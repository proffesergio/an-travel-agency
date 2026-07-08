import { connectDB } from '@/lib/mongodb';
import Hotel, { type IHotel, type IRoomType } from '@/models/Hotel';
import { logActivity } from '@/lib/services/activity';
import type { HotelInput, HotelUpdate } from '@/lib/validation/hotel';
import type { HotelSort } from '@/lib/hotels-shared';

// ---------- Admin ----------

export interface AdminHotelFilters {
  city?: string;
  search?: string;
}

export async function listHotels(filters: AdminHotelFilters = {}) {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (filters.city && filters.city !== 'all') {
    query.city = { $regex: `^${filters.city}$`, $options: 'i' };
  }
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { nameBn: { $regex: filters.search, $options: 'i' } },
      { city: { $regex: filters.search, $options: 'i' } },
    ];
  }
  return Hotel.find(query).sort({ createdAt: -1 }).lean();
}

export async function getHotelById(id: string) {
  await connectDB();
  return Hotel.findById(id).lean();
}

export async function getHotelBySlug(slug: string) {
  await connectDB();
  return Hotel.findOne({ slug }).lean();
}

export async function createHotel(input: HotelInput, actor: string): Promise<IHotel> {
  await connectDB();
  const hotel = await Hotel.create(input);
  await logActivity({
    action: 'create',
    entityType: 'hotel',
    entityId: hotel._id.toString(),
    entityName: hotel.name,
    actor,
    details: `Created hotel: ${hotel.name} (${hotel.city})`,
  });
  return hotel;
}

export async function updateHotel(
  id: string,
  input: HotelUpdate,
  actor: string
): Promise<IHotel | null> {
  await connectDB();
  const hotel = await Hotel.findByIdAndUpdate(id, input, { new: true, runValidators: true });
  if (!hotel) return null;
  await logActivity({
    action: 'update',
    entityType: 'hotel',
    entityId: id,
    entityName: hotel.name,
    actor,
    details: `Updated hotel: ${hotel.name} (${hotel.city})`,
  });
  return hotel;
}

export async function deleteHotel(id: string, actor: string): Promise<IHotel | null> {
  await connectDB();
  const hotel = await Hotel.findByIdAndDelete(id);
  if (!hotel) return null;
  await logActivity({
    action: 'delete',
    entityType: 'hotel',
    entityId: id,
    entityName: hotel.name,
    actor,
    details: `Deleted hotel: ${hotel.name} (${hotel.city})`,
  });
  return hotel;
}

// ---------- Public ----------

export interface PublicHotelFilters {
  city?: string;
  stars?: number[];
  minPrice?: number;
  maxPrice?: number;
  haramMaxMeters?: number;
  amenities?: string[];
  sort?: HotelSort;
}

/** Lean hotel + computed cheapest available room price. */
export interface PublicHotel {
  _id: string;
  name: string;
  nameBn: string;
  slug: string;
  city: string;
  cityBn: string;
  country: string;
  countryBn: string;
  starRating: number;
  distanceFromHaramMeters?: number;
  description: string;
  descriptionBn: string;
  amenities: string[];
  images: string[];
  currency: string;
  featured: boolean;
  rooms: IRoomType[];
  fromPrice: number;
}

function toPublicHotel(h: Record<string, unknown>): PublicHotel {
  const rooms = (h.rooms as IRoomType[]) ?? [];
  const availableRooms = rooms.filter((r) => r.available);
  const fromPrice = availableRooms.length
    ? Math.min(...availableRooms.map((r) => r.pricePerNight))
    : 0;
  return { ...(h as unknown as Omit<PublicHotel, 'fromPrice'>), _id: String(h._id), fromPrice };
}

export async function searchHotels(filters: PublicHotelFilters = {}): Promise<PublicHotel[]> {
  await connectDB();
  const query: Record<string, unknown> = { available: true };
  if (filters.city) {
    query.$or = [
      { city: { $regex: filters.city, $options: 'i' } },
      { cityBn: { $regex: filters.city, $options: 'i' } },
      { name: { $regex: filters.city, $options: 'i' } },
      { nameBn: { $regex: filters.city, $options: 'i' } },
    ];
  }
  if (filters.stars?.length) query.starRating = { $in: filters.stars };
  if (filters.amenities?.length) query.amenities = { $all: filters.amenities };
  if (typeof filters.haramMaxMeters === 'number') {
    query.distanceFromHaramMeters = { $lte: filters.haramMaxMeters };
  }

  const docs = await Hotel.find(query).lean();
  let hotels = docs.map((d) => toPublicHotel(d as unknown as Record<string, unknown>));

  // Price range applies to the computed from-price (curated inventory is small; JS filter is fine).
  if (typeof filters.minPrice === 'number') hotels = hotels.filter((h) => h.fromPrice >= filters.minPrice!);
  if (typeof filters.maxPrice === 'number') hotels = hotels.filter((h) => h.fromPrice <= filters.maxPrice!);

  const sort = filters.sort ?? 'recommended';
  hotels.sort((a, b) => {
    switch (sort) {
      case 'price-asc':
        return a.fromPrice - b.fromPrice;
      case 'price-desc':
        return b.fromPrice - a.fromPrice;
      case 'stars-desc':
        return b.starRating - a.starRating;
      case 'distance-asc':
        return (
          (a.distanceFromHaramMeters ?? Number.MAX_SAFE_INTEGER) -
          (b.distanceFromHaramMeters ?? Number.MAX_SAFE_INTEGER)
        );
      default:
        // recommended: featured first, then cheapest first
        return Number(b.featured) - Number(a.featured) || a.fromPrice - b.fromPrice;
    }
  });
  return hotels;
}

export async function getFeaturedHotels(limit = 4): Promise<PublicHotel[]> {
  await connectDB();
  const docs = await Hotel.find({ available: true, featured: true })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();
  return docs.map((d) => toPublicHotel(d as unknown as Record<string, unknown>));
}

export interface DestinationSummary {
  city: string;
  cityBn: string;
  country: string;
  count: number;
}

export async function listDestinations(): Promise<DestinationSummary[]> {
  await connectDB();
  const rows = await Hotel.aggregate([
    { $match: { available: true } },
    {
      $group: {
        _id: { $toLower: '$city' },
        city: { $first: '$city' },
        cityBn: { $first: '$cityBn' },
        country: { $first: '$country' },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 8 },
  ]);
  return rows.map((r) => ({
    city: r.city as string,
    cityBn: r.cityBn as string,
    country: r.country as string,
    count: r.count as number,
  }));
}
