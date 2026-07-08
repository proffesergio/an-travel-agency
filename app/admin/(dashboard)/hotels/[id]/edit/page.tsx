import { notFound } from 'next/navigation';
import HotelForm, { type HotelFormValues } from '@/components/admin/HotelForm';
import { getHotelById } from '@/lib/services/hotels';
import type { IRoomType } from '@/models/Hotel';

export const dynamic = 'force-dynamic';

export default async function EditHotelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hotel = await getHotelById(id);
  if (!hotel) notFound();

  const initial: HotelFormValues = {
    name: hotel.name,
    nameBn: hotel.nameBn,
    slug: hotel.slug,
    city: hotel.city,
    cityBn: hotel.cityBn,
    country: hotel.country,
    countryBn: hotel.countryBn,
    starRating: hotel.starRating,
    distanceFromHaramMeters: hotel.distanceFromHaramMeters
      ? String(hotel.distanceFromHaramMeters)
      : '',
    description: hotel.description,
    descriptionBn: hotel.descriptionBn,
    amenities: hotel.amenities ?? [],
    images: hotel.images ?? [],
    currency: hotel.currency,
    featured: hotel.featured,
    available: hotel.available,
    rooms: (hotel.rooms ?? []).map((r: IRoomType) => ({
      name: r.name,
      nameBn: r.nameBn,
      pricePerNight: String(r.pricePerNight),
      adults: String(r.capacity?.adults ?? 2),
      children: String(r.capacity?.children ?? 0),
      bedInfo: r.bedInfo ?? '',
      images: r.images ?? [],
      available: r.available,
    })),
  };

  return <HotelForm initial={initial} hotelId={id} />;
}
