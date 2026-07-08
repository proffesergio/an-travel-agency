# Hotel Booking Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Curated hotel inventory managed entirely from the admin panel, with a public GoZayaan-style search/results/detail experience and enquiry-first booking that lands in the existing admin enquiries inbox.

**Architecture:** New `Hotel` Mongoose model with embedded room types; existing `Enquiry` model extended with a `hotel` category + stay fields. Admin CRUD mirrors the packages module (zod validation → service layer → authed API routes → client form pages). Public pages render **dynamically** (`force-dynamic`) so admin changes appear instantly — no rebuild.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4, Mongoose 9, zod 4, next-intl (en/bn), Cloudinary via existing `/api/upload`, lucide-react icons, sonner toasts.

**Spec:** `docs/superpowers/specs/2026-07-08-hotel-booking-design.md`

**Testing note:** This project has no test framework (verification = `npm run typecheck` + `npm run lint` + manual checks, matching existing convention). Every task ends with a typecheck step; the final task has the full manual verification checklist. Run all commands from the repo root.

**Conventions used throughout (copy exactly):**
- Input styling class: `w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none`
- Brand colors: dark green `#1b4332`, mid green `#2d6a4f`, light accent `#74c69d`
- Localized text uses the `isBn = locale === 'bn'` ternary pattern (see `app/[locale]/tours/page.tsx`)

---

### Task 1: Shared hotel constants & helpers

**Files:**
- Create: `lib/hotels-shared.ts`

Client-safe constants (no mongoose imports — this file is imported by client components).

- [ ] **Step 1: Write `lib/hotels-shared.ts`**

```ts
/** Client-safe hotel constants and helpers (no server-only imports). */

export const AMENITY_KEYS = [
  'wifi',
  'breakfast',
  'parking',
  'prayer-room',
  'shuttle',
  'family-room',
  'ac',
  'restaurant',
  'laundry',
  'elevator',
] as const;

export type AmenityKey = (typeof AMENITY_KEYS)[number];

export const AMENITY_LABELS: Record<AmenityKey, { en: string; bn: string }> = {
  wifi: { en: 'Free WiFi', bn: 'ফ্রি ওয়াইফাই' },
  breakfast: { en: 'Breakfast', bn: 'সকালের নাস্তা' },
  parking: { en: 'Parking', bn: 'পার্কিং' },
  'prayer-room': { en: 'Prayer Room', bn: 'নামাজের কক্ষ' },
  shuttle: { en: 'Airport Shuttle', bn: 'এয়ারপোর্ট শাটল' },
  'family-room': { en: 'Family Rooms', bn: 'ফ্যামিলি রুম' },
  ac: { en: 'Air Conditioning', bn: 'এয়ার কন্ডিশনিং' },
  restaurant: { en: 'Restaurant', bn: 'রেস্টুরেন্ট' },
  laundry: { en: 'Laundry', bn: 'লন্ড্রি' },
  elevator: { en: 'Elevator', bn: 'লিফট' },
};

export const HOTEL_CURRENCIES = ['BDT', 'SAR', 'AED', 'USD'] as const;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  BDT: '৳',
  SAR: 'SAR ',
  AED: 'AED ',
  USD: '$',
};

export function formatMoney(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  return `${symbol}${amount.toLocaleString('en-US')}`;
}

/** "150m from Haram" / "1.2km from Haram" */
export function formatHaramDistance(meters: number, isBn: boolean): string {
  const dist = meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
  return isBn ? `হারাম থেকে ${dist}` : `${dist} from Haram`;
}

/** Cities where the distance-from-Haram filter applies (matched case-insensitively). */
export const HARAM_CITIES = ['makkah', 'mecca', 'madinah', 'medina'];

export function isHaramCity(city: string | undefined): boolean {
  if (!city) return false;
  return HARAM_CITIES.includes(city.trim().toLowerCase());
}

export const HOTEL_SORT_OPTIONS = [
  { value: 'recommended', en: 'Recommended', bn: 'প্রস্তাবিত' },
  { value: 'price-asc', en: 'Price: Low to High', bn: 'দাম: কম থেকে বেশি' },
  { value: 'price-desc', en: 'Price: High to Low', bn: 'দাম: বেশি থেকে কম' },
  { value: 'stars-desc', en: 'Star Rating', bn: 'স্টার রেটিং' },
  { value: 'distance-asc', en: 'Closest to Haram', bn: 'হারামের নিকটতম' },
] as const;

export type HotelSort = (typeof HOTEL_SORT_OPTIONS)[number]['value'];
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS (exit 0, no output)

- [ ] **Step 3: Commit**

```bash
git add lib/hotels-shared.ts
git commit -m "feat(hotels): add shared hotel constants and helpers"
```

---

### Task 2: Hotel Mongoose model

**Files:**
- Create: `models/Hotel.ts`

- [ ] **Step 1: Write `models/Hotel.ts`** (mirrors `models/Package.ts` structure)

```ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRoomType {
  name: string;
  nameBn: string;
  pricePerNight: number;
  capacity: { adults: number; children: number };
  bedInfo?: string;
  images: string[];
  available: boolean;
}

export interface IHotel extends Document {
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
  available: boolean;
  rooms: IRoomType[];
  createdAt: Date;
  updatedAt: Date;
}

const RoomTypeSchema = new Schema<IRoomType>(
  {
    name: { type: String, required: true },
    nameBn: { type: String, required: true },
    pricePerNight: { type: Number, required: true },
    capacity: {
      adults: { type: Number, required: true, default: 2 },
      children: { type: Number, required: true, default: 0 },
    },
    bedInfo: { type: String },
    images: [{ type: String }],
    available: { type: Boolean, default: true },
  },
  { _id: false }
);

const HotelSchema = new Schema<IHotel>(
  {
    name: { type: String, required: true },
    nameBn: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    city: { type: String, required: true, index: true },
    cityBn: { type: String, required: true },
    country: { type: String, required: true },
    countryBn: { type: String, required: true },
    starRating: { type: Number, required: true, min: 1, max: 5 },
    distanceFromHaramMeters: { type: Number },
    description: { type: String, required: true },
    descriptionBn: { type: String, required: true },
    amenities: [{ type: String }],
    images: [{ type: String }],
    currency: { type: String, default: 'BDT' },
    featured: { type: Boolean, default: false },
    available: { type: Boolean, default: true },
    rooms: { type: [RoomTypeSchema], default: [] },
  },
  { timestamps: true }
);

const Hotel: Model<IHotel> =
  mongoose.models.Hotel || mongoose.model<IHotel>('Hotel', HotelSchema);

export default Hotel;
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add models/Hotel.ts
git commit -m "feat(hotels): add Hotel model with embedded room types"
```

---

### Task 3: Hotel zod validation

**Files:**
- Create: `lib/validation/hotel.ts`

- [ ] **Step 1: Write `lib/validation/hotel.ts`** (mirrors `lib/validation/package.ts`)

```ts
import { z } from 'zod';
import { AMENITY_KEYS, HOTEL_CURRENCIES } from '@/lib/hotels-shared';

const roomTypeSchema = z.object({
  name: z.string().min(1, 'Room name is required').max(120),
  nameBn: z.string().min(1, 'Bengali room name is required').max(120),
  pricePerNight: z
    .number({ message: 'Price per night is required' })
    .positive('Price must be greater than 0'),
  capacity: z.object({
    adults: z.number().int().min(1, 'At least 1 adult').max(20),
    children: z.number().int().min(0).max(20).default(0),
  }),
  bedInfo: z.string().max(120).optional(),
  images: z.array(z.string()).default([]),
  available: z.boolean().default(true),
});

export const hotelInputSchema = z.object({
  name: z.string().min(1, 'Hotel name is required').max(200),
  nameBn: z.string().min(1, 'Bengali hotel name is required').max(200),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, hyphen-separated'),
  city: z.string().min(1, 'City is required').max(100),
  cityBn: z.string().min(1, 'Bengali city is required').max(100),
  country: z.string().min(1, 'Country is required').max(100),
  countryBn: z.string().min(1, 'Bengali country is required').max(100),
  starRating: z.number().int().min(1).max(5),
  distanceFromHaramMeters: z.number().int().positive().optional(),
  description: z.string().min(1, 'Description is required'),
  descriptionBn: z.string().min(1, 'Bengali description is required'),
  amenities: z.array(z.enum(AMENITY_KEYS)).default([]),
  images: z.array(z.string()).default([]),
  currency: z.enum(HOTEL_CURRENCIES).default('BDT'),
  featured: z.boolean().default(false),
  available: z.boolean().default(true),
  rooms: z.array(roomTypeSchema).min(1, 'Add at least one room type'),
});

export type HotelInput = z.infer<typeof hotelInputSchema>;

export const hotelUpdateSchema = hotelInputSchema.partial();
export type HotelUpdate = z.infer<typeof hotelUpdateSchema>;
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add lib/validation/hotel.ts
git commit -m "feat(hotels): add hotel zod validation schemas"
```

---

### Task 4: Hotels service layer

**Files:**
- Create: `lib/services/hotels.ts`

- [ ] **Step 1: Write `lib/services/hotels.ts`** (mirrors `lib/services/packages.ts`; adds public search)

```ts
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
  let hotels = docs.map((d) => toPublicHotel(d as Record<string, unknown>));

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
  return docs.map((d) => toPublicHotel(d as Record<string, unknown>));
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
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add lib/services/hotels.ts
git commit -m "feat(hotels): add hotels service layer with admin CRUD and public search"
```

---

### Task 5: Extend Enquiry for hotel bookings

**Files:**
- Modify: `models/Enquiry.ts:17,50` (category union + enum)
- Modify: `models/Enquiry.ts` (add hotel fields to interface + schema)
- Modify: `lib/validation/enquiry.ts` (category enum, hotel fields, date rule)
- Modify: `components/admin/StatusBadge.tsx:11,16` (hotel badge style + label)
- Modify: `app/admin/(dashboard)/enquiries/page.tsx:39` (category filter option)

- [ ] **Step 1: Update `models/Enquiry.ts`**

In the `IEnquiry` interface, change the category line and add hotel fields after `passengers`:

```ts
  category: 'hajj' | 'umrah' | 'tour' | 'air-ticketing' | 'hotel' | 'general';
  passengers?: number;
  /** Hotel booking fields (category === 'hotel'). */
  hotelId?: string;
  hotelName?: string;
  roomType?: string;
  checkIn?: string;
  checkOut?: string;
  roomsCount?: number;
  guests?: { adults: number; children: number };
```

In `EnquirySchema`, change the category enum and add fields after `passengers`:

```ts
    category: {
      type: String,
      enum: ['hajj', 'umrah', 'tour', 'air-ticketing', 'hotel', 'general'],
      default: 'general',
    },
    passengers: { type: Number, default: 1 },
    hotelId: { type: String },
    hotelName: { type: String },
    roomType: { type: String },
    checkIn: { type: String },
    checkOut: { type: String },
    roomsCount: { type: Number },
    guests: {
      adults: { type: Number },
      children: { type: Number },
    },
```

- [ ] **Step 2: Update `lib/validation/enquiry.ts`** — replace the whole file:

```ts
import { z } from 'zod';
import { isValidBdPhone } from './auth';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const enquiryInputSchema = z
  .object({
    name: z.string().trim().min(2, 'Please enter your full name').max(120),
    phone: z
      .string()
      .trim()
      .min(1, 'Phone is required')
      .refine((v) => isValidBdPhone(v), {
        message: 'Enter a valid Bangladeshi phone number',
      }),
    email: z.union([z.string().email('Enter a valid email'), z.literal('')]).optional(),
    category: z
      .enum(['hajj', 'umrah', 'tour', 'air-ticketing', 'hotel', 'general'])
      .default('general'),
    packageId: z.string().optional(),
    packageTitle: z.string().optional(),
    passengers: z.coerce.number().int().positive().max(50).default(1),
    message: z.string().max(2000).default(''),
    // Hotel booking fields
    hotelId: z.string().optional(),
    hotelName: z.string().max(200).optional(),
    roomType: z.string().max(120).optional(),
    checkIn: z.string().regex(ISO_DATE, 'Invalid check-in date').optional(),
    checkOut: z.string().regex(ISO_DATE, 'Invalid check-out date').optional(),
    roomsCount: z.coerce.number().int().min(1).max(20).optional(),
    guests: z
      .object({
        adults: z.coerce.number().int().min(1).max(40),
        children: z.coerce.number().int().min(0).max(40).default(0),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.category !== 'hotel') return;
    if (!data.hotelId || !data.hotelName) {
      ctx.addIssue({ code: 'custom', path: ['hotelId'], message: 'Hotel is required' });
    }
    if (!data.checkIn) {
      ctx.addIssue({ code: 'custom', path: ['checkIn'], message: 'Check-in date is required' });
    }
    if (!data.checkOut) {
      ctx.addIssue({ code: 'custom', path: ['checkOut'], message: 'Check-out date is required' });
    }
    if (data.checkIn && data.checkOut && data.checkOut <= data.checkIn) {
      ctx.addIssue({
        code: 'custom',
        path: ['checkOut'],
        message: 'Check-out must be after check-in',
      });
    }
  });

export type EnquiryInput = z.infer<typeof enquiryInputSchema>;

export const enquiryStatusSchema = z.object({
  status: z.enum(['new', 'contacted', 'closed']),
});
```

- [ ] **Step 3: Update `components/admin/StatusBadge.tsx`**

Add to the category style map (line ~11): `hotel: 'bg-indigo-100 text-indigo-800',`
Add to the category label map (line ~16): `hotel: 'Hotel',`

- [ ] **Step 4: Update `app/admin/(dashboard)/enquiries/page.tsx:39`**

```ts
  const categoryOptions = ['all', 'hajj', 'umrah', 'tour', 'air-ticketing', 'hotel', 'general'];
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add models/Enquiry.ts lib/validation/enquiry.ts components/admin/StatusBadge.tsx "app/admin/(dashboard)/enquiries/page.tsx"
git commit -m "feat(hotels): extend enquiry model and validation for hotel bookings"
```

---

### Task 6: Admin hotel API routes

**Files:**
- Create: `app/api/admin/hotels/route.ts`
- Create: `app/api/admin/hotels/[id]/route.ts`

- [ ] **Step 1: Write `app/api/admin/hotels/route.ts`** (mirrors `app/api/admin/packages/route.ts`)

```ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listHotels, createHotel } from '@/lib/services/hotels';
import { hotelInputSchema } from '@/lib/validation/hotel';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const hotels = await listHotels({
      city: searchParams.get('city') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    });
    return NextResponse.json({ hotels });
  } catch (error) {
    console.error('[api/admin/hotels] GET failed', error);
    return NextResponse.json({ error: 'Failed to fetch hotels' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json().catch(() => null);
    const parsed = hotelInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const hotel = await createHotel(parsed.data, session.user?.email ?? 'unknown');
    return NextResponse.json({ hotel }, { status: 201 });
  } catch (error: unknown) {
    console.error('[api/admin/hotels] POST failed', error);
    const err = error as { code?: number };
    if (err.code === 11000) {
      return NextResponse.json({ error: 'A hotel with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create hotel' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Write `app/api/admin/hotels/[id]/route.ts`** (mirrors `app/api/admin/packages/[id]/route.ts` — check that file if unsure about the `RouteContext` shape)

```ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getHotelById, updateHotel, deleteHotel } from '@/lib/services/hotels';
import { hotelUpdateSchema } from '@/lib/validation/hotel';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await context.params;
    const hotel = await getHotelById(id);
    if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    return NextResponse.json({ hotel });
  } catch (error) {
    console.error('[api/admin/hotels/[id]] GET failed', error);
    return NextResponse.json({ error: 'Failed to fetch hotel' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = hotelUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const hotel = await updateHotel(id, parsed.data, session.user?.email ?? 'unknown');
    if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    return NextResponse.json({ hotel });
  } catch (error: unknown) {
    console.error('[api/admin/hotels/[id]] PUT failed', error);
    const err = error as { code?: number };
    if (err.code === 11000) {
      return NextResponse.json({ error: 'A hotel with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update hotel' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await context.params;
    const hotel = await deleteHotel(id, session.user?.email ?? 'unknown');
    if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/admin/hotels/[id]] DELETE failed', error);
    return NextResponse.json({ error: 'Failed to delete hotel' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/hotels
git commit -m "feat(hotels): add admin hotel CRUD API routes"
```

---

### Task 7: Public hotel API routes (autocomplete + featured)

**Files:**
- Create: `app/api/hotels/destinations/route.ts`
- Create: `app/api/hotels/featured/route.ts`

- [ ] **Step 1: Write `app/api/hotels/destinations/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { listDestinations, getFeaturedHotels } from '@/lib/services/hotels';

export const revalidate = 60;

export async function GET() {
  try {
    const [destinations, properties] = await Promise.all([
      listDestinations(),
      getFeaturedHotels(5),
    ]);
    return NextResponse.json({
      destinations,
      properties: properties.map((h) => ({
        name: h.name,
        nameBn: h.nameBn,
        slug: h.slug,
        city: h.city,
        imageUrl: h.images[0] ?? '',
      })),
    });
  } catch (error) {
    console.error('[api/hotels/destinations] GET failed', error);
    return NextResponse.json({ destinations: [], properties: [] });
  }
}
```

- [ ] **Step 2: Write `app/api/hotels/featured/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { getFeaturedHotels } from '@/lib/services/hotels';

export const revalidate = 60;

export async function GET() {
  try {
    const hotels = await getFeaturedHotels(4);
    return NextResponse.json({
      hotels: hotels.map((h) => ({
        name: h.name,
        nameBn: h.nameBn,
        slug: h.slug,
        city: h.city,
        cityBn: h.cityBn,
        starRating: h.starRating,
        imageUrl: h.images[0] ?? '',
        fromPrice: h.fromPrice,
        currency: h.currency,
      })),
    });
  } catch (error) {
    console.error('[api/hotels/featured] GET failed', error);
    return NextResponse.json({ hotels: [] });
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/api/hotels
git commit -m "feat(hotels): add public destinations and featured hotel APIs"
```

---

### Task 8: Admin sidebar item + hotels list page + delete button

**Files:**
- Modify: `app/admin/(dashboard)/layout.tsx:5-21` (nav item)
- Create: `app/admin/(dashboard)/hotels/actions.ts`
- Create: `components/admin/DeleteHotelButton.tsx`
- Create: `app/admin/(dashboard)/hotels/page.tsx`

- [ ] **Step 1: Add nav item in `app/admin/(dashboard)/layout.tsx`**

Add `Hotel` to the lucide import (line 5-12) and a nav entry after Packages (line ~18):

```ts
import {
  Package,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  LayoutDashboard,
  Hotel,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/packages', label: 'Packages', icon: Package },
  { href: '/admin/hotels', label: 'Hotels', icon: Hotel },
  { href: '/admin/enquiries', label: 'Enquiries', icon: MessageSquare },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];
```

- [ ] **Step 2: Write `app/admin/(dashboard)/hotels/actions.ts`** (server action for delete, mirrors packages `actions.ts`)

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { deleteHotel } from '@/lib/services/hotels';

export async function deleteHotelAction(id: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session) return { error: 'Unauthorized' };

  try {
    const deleted = await deleteHotel(id, session.user?.email ?? 'unknown');
    if (!deleted) return { error: 'Hotel not found' };
    revalidatePath('/admin/hotels');
    return {};
  } catch (error) {
    console.error('[admin/hotels] delete failed', error);
    return { error: 'Failed to delete hotel' };
  }
}
```

- [ ] **Step 3: Write `components/admin/DeleteHotelButton.tsx`** (mirrors `DeletePackageButton.tsx` — check it if the ConfirmButton API differs)

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteHotelAction } from '@/app/admin/(dashboard)/hotels/actions';

export default function DeleteHotelButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!window.confirm(`Delete hotel "${name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteHotelAction(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Hotel deleted');
        router.refresh();
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-50"
      title="Delete hotel"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
```

- [ ] **Step 4: Write `app/admin/(dashboard)/hotels/page.tsx`**

```tsx
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Star, Hotel as HotelIcon } from 'lucide-react';
import { listHotels } from '@/lib/services/hotels';
import DeleteHotelButton from '@/components/admin/DeleteHotelButton';
import { formatMoney } from '@/lib/hotels-shared';

export const dynamic = 'force-dynamic';

export default async function AdminHotelsPage() {
  const hotels = await listHotels();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hotels</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage curated hotels — changes appear on the site immediately
          </p>
        </div>
        <Link
          href="/admin/hotels/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Hotel
        </Link>
      </div>

      {hotels.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <HotelIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hotels yet. Add your first hotel to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Hotel</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Stars</th>
                <th className="px-4 py-3 font-medium">Rooms</th>
                <th className="px-4 py-3 font-medium">From</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {hotels.map((hotel) => {
                const availableRooms = (hotel.rooms ?? []).filter((r) => r.available);
                const fromPrice = availableRooms.length
                  ? Math.min(...availableRooms.map((r) => r.pricePerNight))
                  : 0;
                return (
                  <tr key={String(hotel._id)} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-9 rounded bg-gray-100 overflow-hidden relative flex-shrink-0">
                          {hotel.images?.[0] && (
                            <Image
                              src={hotel.images[0]}
                              alt={hotel.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          )}
                        </div>
                        <Link
                          href={`/admin/hotels/${hotel._id}`}
                          className="font-medium text-gray-900 hover:text-[#2d6a4f]"
                        >
                          {hotel.name}
                        </Link>
                        {hotel.featured && (
                          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {hotel.city}, {hotel.country}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-gray-700">
                        {hotel.starRating}
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{hotel.rooms?.length ?? 0}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {fromPrice > 0 ? formatMoney(fromPrice, hotel.currency) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          hotel.available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {hotel.available ? 'Available' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/admin/hotels/${hotel._id}/edit`}
                          className="px-3 py-1.5 text-sm text-[#2d6a4f] hover:bg-green-50 rounded-lg font-medium"
                        >
                          Edit
                        </Link>
                        <DeleteHotelButton id={String(hotel._id)} name={hotel.name} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add "app/admin/(dashboard)/layout.tsx" "app/admin/(dashboard)/hotels" components/admin/DeleteHotelButton.tsx
git commit -m "feat(hotels): add admin hotels list page, nav item, and delete action"
```

---

### Task 9: Admin HotelForm component (shared by new + edit)

**Files:**
- Create: `components/admin/HotelForm.tsx`

One client component handles both create and edit. It mirrors the package form's structure (state object, `/api/upload` uploads, repeatable editors) but supports **multi-image galleries** for the hotel and each room.

- [ ] **Step 1: Write `components/admin/HotelForm.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Upload, Plus, Trash2, X } from 'lucide-react';
import {
  AMENITY_KEYS,
  AMENITY_LABELS,
  HOTEL_CURRENCIES,
  type AmenityKey,
} from '@/lib/hotels-shared';

const inputCls =
  'w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none';

interface RoomForm {
  name: string;
  nameBn: string;
  pricePerNight: string;
  adults: string;
  children: string;
  bedInfo: string;
  images: string[];
  available: boolean;
}

export interface HotelFormValues {
  name: string;
  nameBn: string;
  slug: string;
  city: string;
  cityBn: string;
  country: string;
  countryBn: string;
  starRating: number;
  distanceFromHaramMeters: string;
  description: string;
  descriptionBn: string;
  amenities: string[];
  images: string[];
  currency: string;
  featured: boolean;
  available: boolean;
  rooms: RoomForm[];
}

const EMPTY_ROOM: RoomForm = {
  name: '',
  nameBn: '',
  pricePerNight: '',
  adults: '2',
  children: '0',
  bedInfo: '',
  images: [],
  available: true,
};

export const EMPTY_HOTEL: HotelFormValues = {
  name: '',
  nameBn: '',
  slug: '',
  city: '',
  cityBn: '',
  country: '',
  countryBn: '',
  starRating: 3,
  distanceFromHaramMeters: '',
  description: '',
  descriptionBn: '',
  amenities: [],
  images: [],
  currency: 'BDT',
  featured: false,
  available: true,
  rooms: [{ ...EMPTY_ROOM }],
};

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function uploadFile(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    return data.url ?? null;
  } catch {
    return null;
  }
}

export default function HotelForm({
  initial,
  hotelId,
}: {
  initial: HotelFormValues;
  hotelId?: string; // present = edit mode
}) {
  const router = useRouter();
  const [form, setForm] = useState<HotelFormValues>(initial);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = Boolean(hotelId);

  const set = (patch: Partial<HotelFormValues>) => setForm((f) => ({ ...f, ...patch }));

  const handleNameChange = (value: string) => {
    set(isEdit ? { name: value } : { name: value, slug: generateSlug(value) });
  };

  const toggleAmenity = (key: AmenityKey) => {
    set({
      amenities: form.amenities.includes(key)
        ? form.amenities.filter((a) => a !== key)
        : [...form.amenities, key],
    });
  };

  const handleGalleryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    roomIndex?: number
  ) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of files) {
      const url = await uploadFile(file);
      if (url) urls.push(url);
    }
    if (urls.length < files.length) setError('Some images failed to upload');
    if (typeof roomIndex === 'number') {
      const rooms = [...form.rooms];
      rooms[roomIndex] = { ...rooms[roomIndex], images: [...rooms[roomIndex].images, ...urls] };
      set({ rooms });
    } else {
      set({ images: [...form.images, ...urls] });
    }
    setUploading(false);
    e.target.value = '';
  };

  const removeImage = (url: string, roomIndex?: number) => {
    if (typeof roomIndex === 'number') {
      const rooms = [...form.rooms];
      rooms[roomIndex] = {
        ...rooms[roomIndex],
        images: rooms[roomIndex].images.filter((i) => i !== url),
      };
      set({ rooms });
    } else {
      set({ images: form.images.filter((i) => i !== url) });
    }
  };

  const updateRoom = (index: number, patch: Partial<RoomForm>) => {
    const rooms = [...form.rooms];
    rooms[index] = { ...rooms[index], ...patch };
    set({ rooms });
  };

  const addRoom = () => set({ rooms: [...form.rooms, { ...EMPTY_ROOM }] });
  const removeRoom = (index: number) => {
    const rooms = [...form.rooms];
    rooms.splice(index, 1);
    set({ rooms });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      ...form,
      starRating: Number(form.starRating),
      distanceFromHaramMeters: form.distanceFromHaramMeters
        ? parseInt(form.distanceFromHaramMeters, 10)
        : undefined,
      rooms: form.rooms
        .filter((r) => r.name.trim())
        .map((r) => ({
          name: r.name,
          nameBn: r.nameBn,
          pricePerNight: parseFloat(r.pricePerNight),
          capacity: { adults: parseInt(r.adults, 10), children: parseInt(r.children, 10) || 0 },
          bedInfo: r.bedInfo || undefined,
          images: r.images,
          available: r.available,
        })),
    };

    try {
      const res = await fetch(isEdit ? `/api/admin/hotels/${hotelId}` : '/api/admin/hotels', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save hotel');
      }
      router.push('/admin/hotels');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const Gallery = ({ images, roomIndex }: { images: string[]; roomIndex?: number }) => (
    <div className="flex flex-wrap gap-2 mt-2">
      {images.map((url) => (
        <div key={url} className="relative w-24 h-16 rounded-lg overflow-hidden border border-gray-200 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => removeImage(url, roomIndex)}
            className="absolute top-0.5 right-0.5 p-0.5 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/hotels" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Hotel' : 'Add New Hotel'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Saved changes appear on the public site immediately
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name (English) *</label>
              <input type="text" value={form.name} onChange={(e) => handleNameChange(e.target.value)} required className={inputCls} placeholder="e.g., Swissôtel Al Maqam Makkah" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name (Bengali) *</label>
              <input type="text" value={form.nameBn} onChange={(e) => set({ nameBn: e.target.value })} required className={inputCls} placeholder="হোটেলের নাম বাংলায়" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
              <input type="text" value={form.slug} onChange={(e) => set({ slug: e.target.value })} required className={inputCls} placeholder="swissotel-al-maqam-makkah" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Star Rating *</label>
              <select value={form.starRating} onChange={(e) => set({ starRating: Number(e.target.value) })} className={`${inputCls} bg-white`}>
                {[5, 4, 3, 2, 1].map((s) => (
                  <option key={s} value={s}>{s} Star{s > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City (English) *</label>
              <input type="text" value={form.city} onChange={(e) => set({ city: e.target.value })} required className={inputCls} placeholder="Makkah" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City (Bengali) *</label>
              <input type="text" value={form.cityBn} onChange={(e) => set({ cityBn: e.target.value })} required className={inputCls} placeholder="মক্কা" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country (English) *</label>
              <input type="text" value={form.country} onChange={(e) => set({ country: e.target.value })} required className={inputCls} placeholder="Saudi Arabia" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country (Bengali) *</label>
              <input type="text" value={form.countryBn} onChange={(e) => set({ countryBn: e.target.value })} required className={inputCls} placeholder="সৌদি আরব" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select value={form.currency} onChange={(e) => set({ currency: e.target.value })} className={`${inputCls} bg-white`}>
                {HOTEL_CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distance from Haram (meters)
                <span className="text-gray-400 font-normal"> — Makkah/Madinah hotels only</span>
              </label>
              <input type="number" value={form.distanceFromHaramMeters} onChange={(e) => set({ distanceFromHaramMeters: e.target.value })} min="0" className={inputCls} placeholder="150" />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (English) *</label>
              <textarea value={form.description} onChange={(e) => set({ description: e.target.value })} required rows={4} className={`${inputCls} resize-none`} placeholder="Hotel description in English..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Bengali) *</label>
              <textarea value={form.descriptionBn} onChange={(e) => set({ descriptionBn: e.target.value })} required rows={4} className={`${inputCls} resize-none`} placeholder="বাংলায় হোটেলের বর্ণনা..." />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {AMENITY_KEYS.map((key) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.amenities.includes(key)}
                  onChange={() => toggleAmenity(key)}
                  className="w-4 h-4 rounded border-gray-300 text-[#2d6a4f] focus:ring-[#2d6a4f]"
                />
                <span className="text-sm text-gray-700">{AMENITY_LABELS[key].en}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Hotel Gallery */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hotel Photos</h2>
          <input type="file" accept="image/*" multiple onChange={(e) => handleGalleryUpload(e)} className="hidden" id="hotel-gallery-upload" disabled={uploading} />
          <label htmlFor="hotel-gallery-upload" className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Photos'}
          </label>
          <p className="text-sm text-gray-500 mt-2">First photo is the cover. Recommended 1200x800px.</p>
          <Gallery images={form.images} />
        </div>

        {/* Room Types */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Room Types</h2>
            <button type="button" onClick={addRoom} className="inline-flex items-center gap-1 text-sm text-[#2d6a4f] hover:text-[#1b4332] font-medium">
              <Plus className="w-4 h-4" /> Add Room Type
            </button>
          </div>
          <div className="space-y-4">
            {form.rooms.map((room, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Room Type {index + 1}</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                      <input type="checkbox" checked={room.available} onChange={(e) => updateRoom(index, { available: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-[#2d6a4f] focus:ring-[#2d6a4f]" />
                      Available
                    </label>
                    {form.rooms.length > 1 && (
                      <button type="button" onClick={() => removeRoom(index)} className="p-1 text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" value={room.name} onChange={(e) => updateRoom(index, { name: e.target.value })} className={inputCls} placeholder="Room name (e.g., Deluxe King Room)" />
                  <input type="text" value={room.nameBn} onChange={(e) => updateRoom(index, { nameBn: e.target.value })} className={inputCls} placeholder="রুমের নাম বাংলায়" />
                  <input type="number" value={room.pricePerNight} onChange={(e) => updateRoom(index, { pricePerNight: e.target.value })} min="0" className={inputCls} placeholder="Price per night" />
                  <input type="text" value={room.bedInfo} onChange={(e) => updateRoom(index, { bedInfo: e.target.value })} className={inputCls} placeholder="Bed info (e.g., 1 King Bed)" />
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 whitespace-nowrap">Adults</label>
                    <input type="number" value={room.adults} onChange={(e) => updateRoom(index, { adults: e.target.value })} min="1" className={inputCls} />
                    <label className="text-sm text-gray-600 whitespace-nowrap">Children</label>
                    <input type="number" value={room.children} onChange={(e) => updateRoom(index, { children: e.target.value })} min="0" className={inputCls} />
                  </div>
                  <div>
                    <input type="file" accept="image/*" multiple onChange={(e) => handleGalleryUpload(e, index)} className="hidden" id={`room-upload-${index}`} disabled={uploading} />
                    <label htmlFor={`room-upload-${index}`} className={`inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-white transition-colors cursor-pointer text-sm ${uploading ? 'opacity-50' : ''}`}>
                      <Upload className="w-4 h-4" />
                      Room Photos
                    </label>
                  </div>
                </div>
                <Gallery images={room.images} roomIndex={index} />
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.available} onChange={(e) => set({ available: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-[#2d6a4f] focus:ring-[#2d6a4f]" />
              <span className="text-sm text-gray-700">Visible on the website</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={(e) => set({ featured: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-[#2d6a4f] focus:ring-[#2d6a4f]" />
              <span className="text-sm text-gray-700">Featured (show on homepage)</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/admin/hotels" className="px-6 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium">
            Cancel
          </Link>
          <button type="submit" disabled={loading || uploading} className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] transition-colors font-medium disabled:opacity-60">
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Hotel'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/admin/HotelForm.tsx
git commit -m "feat(hotels): add shared admin hotel form with rooms editor and galleries"
```

---

### Task 10: Admin new / edit / detail pages

**Files:**
- Create: `app/admin/(dashboard)/hotels/new/page.tsx`
- Create: `app/admin/(dashboard)/hotels/[id]/edit/page.tsx`
- Create: `app/admin/(dashboard)/hotels/[id]/page.tsx`

- [ ] **Step 1: Write `app/admin/(dashboard)/hotels/new/page.tsx`**

```tsx
import HotelForm, { EMPTY_HOTEL } from '@/components/admin/HotelForm';

export default function NewHotelPage() {
  return <HotelForm initial={EMPTY_HOTEL} />;
}
```

- [ ] **Step 2: Write `app/admin/(dashboard)/hotels/[id]/edit/page.tsx`**

```tsx
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
```

- [ ] **Step 3: Write `app/admin/(dashboard)/hotels/[id]/page.tsx`** (read-only detail)

```tsx
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Star, Pencil } from 'lucide-react';
import { getHotelById } from '@/lib/services/hotels';
import { AMENITY_LABELS, formatMoney, type AmenityKey } from '@/lib/hotels-shared';

export const dynamic = 'force-dynamic';

export default async function AdminHotelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hotel = await getHotelById(id);
  if (!hotel) notFound();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/hotels" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {hotel.name}
              <span className="inline-flex items-center gap-0.5 text-amber-500 text-base">
                {hotel.starRating}
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {hotel.city}, {hotel.country}
              {hotel.distanceFromHaramMeters ? ` · ${hotel.distanceFromHaramMeters}m from Haram` : ''}
            </p>
          </div>
        </div>
        <Link
          href={`/admin/hotels/${id}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] transition-colors font-medium"
        >
          <Pencil className="w-4 h-4" />
          Edit Hotel
        </Link>
      </div>

      {hotel.images?.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {hotel.images.map((url: string) => (
            <div key={url} className="relative w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
              <Image src={url} alt={hotel.name} fill className="object-cover" sizes="192px" />
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
        <p className="text-gray-600 whitespace-pre-line">{hotel.description}</p>
        <h3 className="text-md font-medium text-gray-700 mt-4 mb-2">Amenities</h3>
        <div className="flex flex-wrap gap-2">
          {(hotel.amenities ?? []).map((a: string) => (
            <span key={a} className="text-xs bg-green-50 text-[#2d6a4f] px-2.5 py-1 rounded-full">
              {AMENITY_LABELS[a as AmenityKey]?.en ?? a}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Room Types ({hotel.rooms?.length ?? 0})
        </h2>
        <div className="space-y-3">
          {(hotel.rooms ?? []).map((room, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="relative w-20 h-14 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                {room.images?.[0] && (
                  <Image src={room.images[0]} alt={room.name} fill className="object-cover" sizes="80px" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{room.name}</p>
                <p className="text-sm text-gray-500">
                  {room.bedInfo ? `${room.bedInfo} · ` : ''}
                  {room.capacity?.adults} adults{room.capacity?.children ? ` + ${room.capacity.children} children` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {formatMoney(room.pricePerNight, hotel.currency)}
                  <span className="text-xs text-gray-500 font-normal">/night</span>
                </p>
                <span className={`text-xs ${room.available ? 'text-green-700' : 'text-gray-400'}`}>
                  {room.available ? 'Available' : 'Hidden'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Manual smoke test (requires dev server + MongoDB)**

Run: `npm run dev`, log into `/admin`, then:
1. Admin → Hotels → Add Hotel → fill all fields, add 2 room types with images → Create Hotel.
2. Expected: redirected to `/admin/hotels`, hotel row appears with correct from-price.
3. Edit the hotel, change price → Save → detail page reflects the change.

- [ ] **Step 6: Commit**

```bash
git add "app/admin/(dashboard)/hotels"
git commit -m "feat(hotels): add admin hotel new/edit/detail pages"
```

---

### Task 11: Admin enquiry detail — hotel booking card

**Files:**
- Modify: `app/admin/(dashboard)/enquiries/[id]/page.tsx`

- [ ] **Step 1: Add a hotel details card**

Open `app/admin/(dashboard)/enquiries/[id]/page.tsx`. Find the card that renders package/booking info (near the `enquiry.category === 'air-ticketing'` ternary at line ~429). **After** that card's closing tag, insert this block (adjust wrapper classes to match the sibling cards in that file — they use `bg-white rounded-xl border border-gray-200 p-6`):

```tsx
{enquiry.category === 'hotel' && (
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Hotel Booking Details</h2>
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
      <div>
        <dt className="text-gray-500">Hotel</dt>
        <dd className="font-medium text-gray-900">{enquiry.hotelName ?? '—'}</dd>
      </div>
      <div>
        <dt className="text-gray-500">Room Type</dt>
        <dd className="font-medium text-gray-900">{enquiry.roomType ?? '—'}</dd>
      </div>
      <div>
        <dt className="text-gray-500">Check-in</dt>
        <dd className="font-medium text-gray-900">{enquiry.checkIn ?? '—'}</dd>
      </div>
      <div>
        <dt className="text-gray-500">Check-out</dt>
        <dd className="font-medium text-gray-900">{enquiry.checkOut ?? '—'}</dd>
      </div>
      <div>
        <dt className="text-gray-500">Rooms</dt>
        <dd className="font-medium text-gray-900">{enquiry.roomsCount ?? 1}</dd>
      </div>
      <div>
        <dt className="text-gray-500">Guests</dt>
        <dd className="font-medium text-gray-900">
          {enquiry.guests
            ? `${enquiry.guests.adults} adults${enquiry.guests.children ? ` + ${enquiry.guests.children} children` : ''}`
            : '—'}
        </dd>
      </div>
    </dl>
  </div>
)}
```

If the page reads the enquiry through a typed helper, the new `IEnquiry` fields from Task 5 are already on the type — no extra type changes needed.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add "app/admin/(dashboard)/enquiries/[id]/page.tsx"
git commit -m "feat(hotels): show hotel booking details on admin enquiry page"
```

---

### Task 12: Navbar link + i18n messages

**Files:**
- Modify: `components/layout/Navbar.tsx:33-38` (serviceLinks)
- Modify: `messages/en.json` (nav section)
- Modify: `messages/bn.json` (nav section)

- [ ] **Step 1: Add nav link in `components/layout/Navbar.tsx`**

In `serviceLinks` (line ~33), add after tours:

```ts
  const serviceLinks = [
    { href: '/hajj', label: t('hajj') },
    { href: '/umrah', label: t('umrah') },
    { href: '/tours', label: t('tours') },
    { href: '/hotels', label: t('hotels') },
    { href: '/air-ticketing', label: t('airTicketing') },
  ];
```

- [ ] **Step 2: Add message keys**

In `messages/en.json`, inside the `"nav"` object, add: `"hotels": "Hotels"`
In `messages/bn.json`, inside the `"nav"` object, add: `"hotels": "হোটেল"`

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/layout/Navbar.tsx messages/en.json messages/bn.json
git commit -m "feat(hotels): add Hotels nav link with en/bn labels"
```

---

### Task 13: Public /hotels search & results page

**Files:**
- Create: `components/hotels/HotelSearchBar.tsx`
- Create: `components/hotels/HotelFilterBar.tsx`
- Create: `components/hotels/HotelCard.tsx`
- Create: `app/[locale]/hotels/page.tsx`

- [ ] **Step 1: Write `components/hotels/HotelSearchBar.tsx`** (client; destination autocomplete + dates + rooms/guests; navigates to /hotels with query params)

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Search, Building2 } from 'lucide-react';

const inputCls =
  'w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none';

interface Destination {
  city: string;
  cityBn: string;
  country: string;
  count: number;
}

interface Property {
  name: string;
  nameBn: string;
  slug: string;
  city: string;
  imageUrl: string;
}

export default function HotelSearchBar({
  locale,
  initialCity = '',
  initialCheckIn = '',
  initialCheckOut = '',
  initialRooms = 1,
  initialAdults = 2,
  initialChildren = 0,
}: {
  locale: string;
  initialCity?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialRooms?: number;
  initialAdults?: number;
  initialChildren?: number;
}) {
  const router = useRouter();
  const isBn = locale === 'bn';
  const [city, setCity] = useState(initialCity);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [rooms, setRooms] = useState(initialRooms);
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const [open, setOpen] = useState(false);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/hotels/destinations')
      .then((r) => r.json())
      .then((d) => {
        setDestinations(d.destinations ?? []);
        setProperties(d.properties ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (city.trim()) params.set('city', city.trim());
    if (checkIn) params.set('checkin', checkIn);
    if (checkOut) params.set('checkout', checkOut);
    params.set('rooms', String(rooms));
    params.set('adults', String(adults));
    params.set('children', String(children));
    router.push(`/${locale}/hotels?${params.toString()}`);
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 flex flex-col lg:flex-row gap-3"
    >
      <div className="relative flex-[2]" ref={boxRef}>
        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
          {isBn ? 'শহর / হোটেল' : 'City / Hotel'}
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={city}
            onFocus={() => setOpen(true)}
            onChange={(e) => setCity(e.target.value)}
            className={`${inputCls} pl-9`}
            placeholder={isBn ? 'যেমন: মক্কা, দুবাই' : 'e.g., Makkah, Dubai'}
          />
        </div>
        {open && (destinations.length > 0 || properties.length > 0) && (
          <div className="absolute z-30 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 p-3 max-h-80 overflow-y-auto">
            {destinations.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-1">
                  {isBn ? 'জনপ্রিয় গন্তব্য' : 'Top Destinations'}
                </p>
                {destinations.map((d) => (
                  <button
                    key={d.city}
                    type="button"
                    onClick={() => {
                      setCity(d.city);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-green-50 text-left"
                  >
                    <MapPin className="w-4 h-4 text-[#2d6a4f]" />
                    <span className="flex-1 text-sm text-gray-800">
                      {isBn ? d.cityBn : d.city}
                      <span className="text-gray-400"> · {d.country}</span>
                    </span>
                    <span className="text-xs text-gray-400">
                      {d.count} {isBn ? 'হোটেল' : 'hotels'}
                    </span>
                  </button>
                ))}
              </>
            )}
            {properties.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mt-2 mb-1">
                  {isBn ? 'জনপ্রিয় হোটেল' : 'Top Properties'}
                </p>
                {properties.map((p) => (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => router.push(`/${locale}/hotels/${p.slug}`)}
                    className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-green-50 text-left"
                  >
                    <Building2 className="w-4 h-4 text-[#2d6a4f]" />
                    <span className="flex-1 text-sm text-gray-800">
                      {isBn ? p.nameBn : p.name}
                      <span className="text-gray-400"> · {p.city}</span>
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
          {isBn ? 'চেক ইন' : 'Check In'}
        </label>
        <input type="date" value={checkIn} min={today} onChange={(e) => setCheckIn(e.target.value)} className={inputCls} />
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
          {isBn ? 'চেক আউট' : 'Check Out'}
        </label>
        <input type="date" value={checkOut} min={checkIn || today} onChange={(e) => setCheckOut(e.target.value)} className={inputCls} />
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
          {isBn ? 'রুম ও অতিথি' : 'Rooms & Guests'}
        </label>
        <div className="flex gap-1">
          <select value={rooms} onChange={(e) => setRooms(Number(e.target.value))} className={`${inputCls} bg-white`} aria-label="Rooms">
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n} {isBn ? 'রুম' : n > 1 ? 'Rooms' : 'Room'}</option>
            ))}
          </select>
          <select value={adults} onChange={(e) => setAdults(Number(e.target.value))} className={`${inputCls} bg-white`} aria-label="Adults">
            {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
              <option key={n} value={n}>{n} {isBn ? 'প্রাপ্তবয়স্ক' : n > 1 ? 'Adults' : 'Adult'}</option>
            ))}
          </select>
          <select value={children} onChange={(e) => setChildren(Number(e.target.value))} className={`${inputCls} bg-white`} aria-label="Children">
            {[0, 1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>{n} {isBn ? 'শিশু' : n === 1 ? 'Child' : 'Children'}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-end">
        <button
          type="submit"
          className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-8 py-2.5 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] transition-colors font-semibold"
        >
          <Search className="w-4 h-4" />
          {isBn ? 'খুঁজুন' : 'Search'}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Write `components/hotels/HotelFilterBar.tsx`** (client; horizontal chips per approved Option B; syncs to URL)

```tsx
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import {
  AMENITY_KEYS,
  AMENITY_LABELS,
  HOTEL_SORT_OPTIONS,
  isHaramCity,
} from '@/lib/hotels-shared';

const chipCls =
  'px-3 py-1.5 rounded-full border text-sm font-medium transition-colors cursor-pointer select-none';

export default function HotelFilterBar({ locale }: { locale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isBn = locale === 'bn';
  const [showAmenities, setShowAmenities] = useState(false);

  const city = searchParams.get('city') ?? '';
  const stars = (searchParams.get('stars') ?? '').split(',').filter(Boolean).map(Number);
  const amenities = (searchParams.get('amenities') ?? '').split(',').filter(Boolean);
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const haram = searchParams.get('haram') ?? '';
  const sort = searchParams.get('sort') ?? 'recommended';

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleStar = (s: number) => {
    const next = stars.includes(s) ? stars.filter((x) => x !== s) : [...stars, s];
    setParam('stars', next.join(','));
  };

  const toggleAmenity = (a: string) => {
    const next = amenities.includes(a) ? amenities.filter((x) => x !== a) : [...amenities, a];
    setParam('amenities', next.join(','));
  };

  const hasFilters = stars.length > 0 || amenities.length > 0 || maxPrice || haram;

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    ['stars', 'amenities', 'maxPrice', 'haram', 'sort'].forEach((k) => params.delete(k));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 mr-1">
        <SlidersHorizontal className="w-4 h-4" />
        {isBn ? 'ফিল্টার' : 'Filters'}
      </span>

      {[5, 4, 3].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => toggleStar(s)}
          className={`${chipCls} ${
            stars.includes(s)
              ? 'bg-[#2d6a4f] text-white border-[#2d6a4f]'
              : 'bg-white text-gray-700 border-gray-200 hover:border-[#2d6a4f]'
          }`}
        >
          {s}★
        </button>
      ))}

      <select
        value={maxPrice}
        onChange={(e) => setParam('maxPrice', e.target.value)}
        className={`${chipCls} bg-white border-gray-200 text-gray-700`}
        aria-label="Max price"
      >
        <option value="">{isBn ? 'যেকোনো দাম' : 'Any price'}</option>
        <option value="5000">≤ 5,000</option>
        <option value="10000">≤ 10,000</option>
        <option value="20000">≤ 20,000</option>
        <option value="50000">≤ 50,000</option>
      </select>

      {isHaramCity(city) && (
        <select
          value={haram}
          onChange={(e) => setParam('haram', e.target.value)}
          className={`${chipCls} bg-white border-gray-200 text-gray-700`}
          aria-label="Distance from Haram"
        >
          <option value="">{isBn ? 'হারাম থেকে দূরত্ব' : 'Distance from Haram'}</option>
          <option value="500">≤ 500m</option>
          <option value="1000">≤ 1km</option>
          <option value="2000">≤ 2km</option>
        </select>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowAmenities((v) => !v)}
          className={`${chipCls} ${
            amenities.length
              ? 'bg-[#2d6a4f] text-white border-[#2d6a4f]'
              : 'bg-white text-gray-700 border-gray-200 hover:border-[#2d6a4f]'
          }`}
        >
          {isBn ? 'সুবিধা' : 'Amenities'}
          {amenities.length > 0 && ` (${amenities.length})`}
        </button>
        {showAmenities && (
          <div className="absolute z-20 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-3 w-64">
            {AMENITY_KEYS.map((a) => (
              <label key={a} className="flex items-center gap-2 py-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={amenities.includes(a)}
                  onChange={() => toggleAmenity(a)}
                  className="w-4 h-4 rounded border-gray-300 text-[#2d6a4f] focus:ring-[#2d6a4f]"
                />
                <span className="text-sm text-gray-700">
                  {isBn ? AMENITY_LABELS[a].bn : AMENITY_LABELS[a].en}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600"
          >
            <X className="w-3.5 h-3.5" />
            {isBn ? 'মুছুন' : 'Clear'}
          </button>
        )}
        <select
          value={sort}
          onChange={(e) => setParam('sort', e.target.value)}
          className={`${chipCls} bg-white border-gray-200 text-gray-700`}
          aria-label="Sort"
        >
          {HOTEL_SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {isBn ? o.bn : o.en}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `components/hotels/HotelCard.tsx`** (presentational, works in server components)

```tsx
import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin } from 'lucide-react';
import {
  AMENITY_LABELS,
  formatMoney,
  formatHaramDistance,
  type AmenityKey,
} from '@/lib/hotels-shared';
import type { PublicHotel } from '@/lib/services/hotels';

export default function HotelCard({
  hotel,
  locale,
  query = '',
}: {
  hotel: PublicHotel;
  locale: string;
  query?: string; // preserved search params appended to the detail link
}) {
  const isBn = locale === 'bn';
  const roomThumbs = hotel.rooms
    .filter((r) => r.available && r.images.length > 0)
    .slice(0, 3);

  return (
    <Link
      href={`/${locale}/hotels/${hotel.slug}${query ? `?${query}` : ''}`}
      className="group flex flex-col sm:flex-row gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow p-4"
    >
      <div className="relative w-full sm:w-56 h-44 sm:h-40 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
        {hotel.images[0] ? (
          <Image
            src={hotel.images[0]}
            alt={isBn ? hotel.nameBn : hotel.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, 224px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
            No photo
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg group-hover:text-[#2d6a4f] transition-colors">
              {isBn ? hotel.nameBn : hotel.name}
            </h3>
            <p className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
              <span className="inline-flex items-center gap-0.5 text-amber-500">
                {Array.from({ length: hotel.starRating }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </span>
              <MapPin className="w-3.5 h-3.5 ml-1" />
              {isBn ? hotel.cityBn : hotel.city}, {isBn ? hotel.countryBn : hotel.country}
            </p>
            {typeof hotel.distanceFromHaramMeters === 'number' && (
              <span className="inline-block mt-1.5 text-xs font-medium bg-green-50 text-[#2d6a4f] px-2 py-0.5 rounded-full">
                🕋 {formatHaramDistance(hotel.distanceFromHaramMeters, isBn)}
              </span>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-400">{isBn ? 'শুরু' : 'From'}</p>
            <p className="text-xl font-bold text-[#1b4332]">
              {formatMoney(hotel.fromPrice, hotel.currency)}
            </p>
            <p className="text-xs text-gray-400">{isBn ? '/রাত' : '/night'}</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-2 line-clamp-1">
          {hotel.amenities
            .slice(0, 4)
            .map((a) => (isBn ? AMENITY_LABELS[a as AmenityKey]?.bn : AMENITY_LABELS[a as AmenityKey]?.en) ?? a)
            .join(' · ')}
        </p>

        {roomThumbs.length > 0 && (
          <div className="flex gap-2 mt-3">
            {roomThumbs.map((room, i) => (
              <div key={i} className="relative w-16 h-12 rounded-lg overflow-hidden bg-gray-100">
                <Image src={room.images[0]} alt={room.name} fill className="object-cover" sizes="64px" />
              </div>
            ))}
            <span className="self-center text-xs text-[#2d6a4f] font-medium ml-1">
              {isBn ? `${hotel.rooms.length}টি রুম টাইপ` : `${hotel.rooms.length} room types`} →
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: Write `app/[locale]/hotels/page.tsx`**

```tsx
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HotelSearchBar from '@/components/hotels/HotelSearchBar';
import HotelFilterBar from '@/components/hotels/HotelFilterBar';
import HotelCard from '@/components/hotels/HotelCard';
import { searchHotels } from '@/lib/services/hotels';
import type { HotelSort } from '@/lib/hotels-shared';
import { Hotel as HotelIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HotelsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const isBn = locale === 'bn';

  const hotels = await searchHotels({
    city: sp.city,
    stars: sp.stars ? sp.stars.split(',').map(Number).filter(Boolean) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    haramMaxMeters: sp.haram ? Number(sp.haram) : undefined,
    amenities: sp.amenities ? sp.amenities.split(',').filter(Boolean) : undefined,
    sort: (sp.sort as HotelSort) ?? 'recommended',
  });

  const query = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => typeof v === 'string') as [string, string][]
  ).toString();

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="bg-[#1b4332] text-white pt-12 pb-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-full bg-[#2d6a4f] flex items-center justify-center">
                <HotelIcon className="w-7 h-7 text-[#74c69d]" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold">
                  {isBn ? 'হোটেল বুকিং' : 'Hotel Booking'}
                </h1>
                <p className="text-green-200 mt-1">
                  {isBn
                    ? 'মক্কা, মদিনা, দুবাইসহ সেরা হোটেলে সেরা দামে থাকুন'
                    : 'Handpicked hotels in Makkah, Madinah, Dubai and beyond — best rates, personal service'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 -mt-12">
          <HotelSearchBar
            locale={locale}
            initialCity={sp.city ?? ''}
            initialCheckIn={sp.checkin ?? ''}
            initialCheckOut={sp.checkout ?? ''}
            initialRooms={sp.rooms ? Number(sp.rooms) : 1}
            initialAdults={sp.adults ? Number(sp.adults) : 2}
            initialChildren={sp.children ? Number(sp.children) : 0}
          />
        </div>

        <section className="max-w-6xl mx-auto px-4 py-8">
          <Suspense>
            <HotelFilterBar locale={locale} />
          </Suspense>

          <p className="text-sm text-gray-500 mt-4 mb-4">
            {isBn ? `${hotels.length}টি হোটেল পাওয়া গেছে` : `${hotels.length} hotels found`}
            {sp.city ? ` — ${sp.city}` : ''}
          </p>

          {hotels.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
              <HotelIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">
                {isBn ? 'কোনো হোটেল পাওয়া যায়নি' : 'No hotels match your search'}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {isBn
                  ? 'ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন'
                  : 'Try adjusting your filters or searching a different city'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {hotels.map((hotel) => (
                <HotelCard key={hotel._id} hotel={hotel} locale={locale} query={query} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 6: Manual smoke test**

With dev server running and at least one hotel created in admin: visit `/en/hotels`, expect the hotel card; filter by a star rating that excludes it, expect the empty state; visit `/bn/hotels`, expect Bangla text.

- [ ] **Step 7: Commit**

```bash
git add components/hotels "app/[locale]/hotels/page.tsx"
git commit -m "feat(hotels): add public hotel search and results page"
```

---

### Task 14: Hotel detail page + booking request form

**Files:**
- Create: `components/hotels/HotelBookingForm.tsx`
- Create: `app/[locale]/hotels/[slug]/page.tsx`

- [ ] **Step 1: Write `components/hotels/HotelBookingForm.tsx`** (client; posts to existing `/api/enquiries`)

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CalendarCheck, Send } from 'lucide-react';

const inputCls =
  'w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none';

interface RoomOption {
  name: string;
  nameBn: string;
}

export default function HotelBookingForm({
  locale,
  hotelId,
  hotelName,
  rooms,
  initialRoom = '',
  initialCheckIn = '',
  initialCheckOut = '',
  initialRooms = 1,
  initialAdults = 2,
  initialChildren = 0,
}: {
  locale: string;
  hotelId: string;
  hotelName: string;
  rooms: RoomOption[];
  initialRoom?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialRooms?: number;
  initialAdults?: number;
  initialChildren?: number;
}) {
  const isBn = locale === 'bn';
  const formRef = useRef<HTMLDivElement>(null);
  const [roomType, setRoomType] = useState(initialRoom || rooms[0]?.name || '');
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [roomsCount, setRoomsCount] = useState(initialRooms);
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Let RoomCard "Book This Room" buttons select a room and scroll here.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) setRoomType(detail);
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.addEventListener('hotel-book-room', handler);
    return () => window.removeEventListener('hotel-book-room', handler);
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          category: 'hotel',
          hotelId,
          hotelName,
          roomType,
          checkIn,
          checkOut,
          roomsCount,
          guests: { adults, children },
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setDone(true);
      toast.success(
        isBn ? 'বুকিং অনুরোধ পাঠানো হয়েছে!' : 'Booking request sent! We will contact you shortly.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div ref={formRef} id="booking-form" className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <CalendarCheck className="w-10 h-10 text-[#2d6a4f] mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-[#1b4332]">
          {isBn ? 'অনুরোধ গৃহীত হয়েছে!' : 'Request received!'}
        </h3>
        <p className="text-gray-600 text-sm mt-1">
          {isBn
            ? 'আমরা শীঘ্রই আপনার সাথে হোয়াটসঅ্যাপ বা ফোনে যোগাযোগ করব।'
            : 'Our team will confirm availability and contact you via WhatsApp or phone shortly.'}
        </p>
      </div>
    );
  }

  return (
    <div ref={formRef} id="booking-form" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-1">
        {isBn ? 'বুকিং অনুরোধ' : 'Booking Request'}
      </h2>
      <p className="text-sm text-gray-500 mb-5">
        {isBn
          ? 'কোনো অগ্রিম পেমেন্ট লাগবে না — আমরা প্রাপ্যতা নিশ্চিত করে যোগাযোগ করব।'
          : 'No advance payment needed — we confirm availability first, then arrange payment.'}
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isBn ? 'রুম টাইপ' : 'Room Type'} *
          </label>
          <select value={roomType} onChange={(e) => setRoomType(e.target.value)} required className={`${inputCls} bg-white`}>
            {rooms.map((r) => (
              <option key={r.name} value={r.name}>{isBn ? r.nameBn : r.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isBn ? 'চেক ইন' : 'Check In'} *
          </label>
          <input type="date" value={checkIn} min={today} onChange={(e) => setCheckIn(e.target.value)} required className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isBn ? 'চেক আউট' : 'Check Out'} *
          </label>
          <input type="date" value={checkOut} min={checkIn || today} onChange={(e) => setCheckOut(e.target.value)} required className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{isBn ? 'রুম' : 'Rooms'}</label>
          <select value={roomsCount} onChange={(e) => setRoomsCount(Number(e.target.value))} className={`${inputCls} bg-white`}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{isBn ? 'প্রাপ্তবয়স্ক' : 'Adults'}</label>
          <select value={adults} onChange={(e) => setAdults(Number(e.target.value))} className={`${inputCls} bg-white`}>
            {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{isBn ? 'শিশু' : 'Children'}</label>
          <select value={children} onChange={(e) => setChildren(Number(e.target.value))} className={`${inputCls} bg-white`}>
            {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isBn ? 'আপনার নাম' : 'Your Name'} *
          </label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} placeholder={isBn ? 'পূর্ণ নাম' : 'Full name'} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isBn ? 'ফোন / হোয়াটসঅ্যাপ' : 'Phone / WhatsApp'} *
          </label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className={inputCls} placeholder="01XXXXXXXXX" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isBn ? 'ইমেইল (ঐচ্ছিক)' : 'Email (optional)'}
          </label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@email.com" />
        </div>
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isBn ? 'বার্তা (ঐচ্ছিক)' : 'Message (optional)'}
          </label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder={isBn ? 'বিশেষ অনুরোধ...' : 'Special requests...'} />
        </div>
        <div className="md:col-span-3 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] transition-colors font-semibold disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            {loading
              ? isBn ? 'পাঠানো হচ্ছে...' : 'Sending...'
              : isBn ? 'বুকিং অনুরোধ পাঠান' : 'Send Booking Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Write `app/[locale]/hotels/[slug]/page.tsx`**

The "Book This Room" button is a tiny inline client component; keep it in the same folder.

Create `app/[locale]/hotels/[slug]/BookRoomButton.tsx`:

```tsx
'use client';

export default function BookRoomButton({ roomName, label }: { roomName: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent('hotel-book-room', { detail: roomName }))}
      className="px-5 py-2.5 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] transition-colors font-medium text-sm whitespace-nowrap"
    >
      {label}
    </button>
  );
}
```

Create `app/[locale]/hotels/[slug]/page.tsx`:

```tsx
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Star, MapPin, Users, BedDouble } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HotelBookingForm from '@/components/hotels/HotelBookingForm';
import BookRoomButton from './BookRoomButton';
import { getHotelBySlug } from '@/lib/services/hotels';
import {
  AMENITY_LABELS,
  formatMoney,
  formatHaramDistance,
  type AmenityKey,
} from '@/lib/hotels-shared';

export const dynamic = 'force-dynamic';

export default async function HotelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const isBn = locale === 'bn';

  const hotel = await getHotelBySlug(slug);
  if (!hotel || !hotel.available) notFound();

  const rooms = (hotel.rooms ?? []).filter((r) => r.available);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 rounded-2xl overflow-hidden mb-6">
            <div className="relative md:col-span-2 h-64 md:h-96 bg-gray-100">
              {hotel.images?.[0] && (
                <Image src={hotel.images[0]} alt={isBn ? hotel.nameBn : hotel.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 66vw" priority />
              )}
            </div>
            <div className="hidden md:grid grid-rows-2 gap-2">
              {[hotel.images?.[1], hotel.images?.[2]].map((url, i) => (
                <div key={i} className="relative bg-gray-100">
                  {url && <Image src={url} alt="" fill className="object-cover" sizes="33vw" />}
                  {i === 1 && (hotel.images?.length ?? 0) > 3 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-semibold">
                      +{hotel.images.length - 3} {isBn ? 'ছবি' : 'photos'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Header */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {isBn ? hotel.nameBn : hotel.name}
                </h1>
                <p className="flex items-center gap-2 text-gray-500 mt-2">
                  <span className="inline-flex items-center gap-0.5">
                    {Array.from({ length: hotel.starRating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </span>
                  <MapPin className="w-4 h-4" />
                  {isBn ? hotel.cityBn : hotel.city}, {isBn ? hotel.countryBn : hotel.country}
                </p>
                {typeof hotel.distanceFromHaramMeters === 'number' && (
                  <span className="inline-block mt-2 text-sm font-medium bg-green-50 text-[#2d6a4f] px-3 py-1 rounded-full">
                    🕋 {formatHaramDistance(hotel.distanceFromHaramMeters, isBn)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {(hotel.amenities ?? []).map((a) => (
                <span key={a} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                  {(isBn ? AMENITY_LABELS[a as AmenityKey]?.bn : AMENITY_LABELS[a as AmenityKey]?.en) ?? a}
                </span>
              ))}
            </div>
            <p className="text-gray-600 mt-4 whitespace-pre-line">
              {isBn ? hotel.descriptionBn : hotel.description}
            </p>
          </div>

          {/* Rooms */}
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {isBn ? 'আপনার রুম বেছে নিন' : 'Choose Your Room'}
          </h2>
          <div className="space-y-4 mb-8">
            {rooms.map((room, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="relative w-full sm:w-44 h-36 sm:h-28 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {room.images?.[0] ? (
                    <Image src={room.images[0]} alt={room.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 176px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <BedDouble className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{isBn ? room.nameBn : room.name}</h3>
                  <p className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    {room.bedInfo && (
                      <span className="inline-flex items-center gap-1">
                        <BedDouble className="w-4 h-4" /> {room.bedInfo}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {room.capacity?.adults} {isBn ? 'প্রাপ্তবয়স্ক' : 'adults'}
                      {room.capacity?.children ? ` + ${room.capacity.children} ${isBn ? 'শিশু' : 'children'}` : ''}
                    </span>
                  </p>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                  <p className="text-lg font-bold text-[#1b4332]">
                    {formatMoney(room.pricePerNight, hotel.currency)}
                    <span className="text-xs text-gray-400 font-normal">{isBn ? '/রাত' : '/night'}</span>
                  </p>
                  <BookRoomButton roomName={room.name} label={isBn ? 'এই রুম বুক করুন' : 'Book This Room'} />
                </div>
              </div>
            ))}
          </div>

          {/* Booking form */}
          <HotelBookingForm
            locale={locale}
            hotelId={String(hotel._id)}
            hotelName={hotel.name}
            rooms={rooms.map((r) => ({ name: r.name, nameBn: r.nameBn }))}
            initialCheckIn={sp.checkin ?? ''}
            initialCheckOut={sp.checkout ?? ''}
            initialRooms={sp.rooms ? Number(sp.rooms) : 1}
            initialAdults={sp.adults ? Number(sp.adults) : 2}
            initialChildren={sp.children ? Number(sp.children) : 0}
          />
        </div>
      </main>
      <Footer locale={locale} />
    </>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Manual smoke test**

Visit a hotel detail page → click "Book This Room" on the second room → page scrolls to the form with that room pre-selected → submit with valid BD phone → success card appears → enquiry visible at `/admin/enquiries` with the Hotel badge, dates, room and guests.

- [ ] **Step 5: Commit**

```bash
git add components/hotels/HotelBookingForm.tsx "app/[locale]/hotels/[slug]"
git commit -m "feat(hotels): add hotel detail page with room cards and booking request form"
```

---

### Task 15: Homepage teaser + featured hotels row

**Files:**
- Create: `components/home/HotelSearchTeaser.tsx`
- Modify: `app/[locale]/page.tsx:23-31` (insert component)

- [ ] **Step 1: Write `components/home/HotelSearchTeaser.tsx`** (client — fetches featured hotels at runtime so the homepage auto-updates even if statically rendered)

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Hotel as HotelIcon } from 'lucide-react';
import HotelSearchBar from '@/components/hotels/HotelSearchBar';
import { formatMoney } from '@/lib/hotels-shared';

interface FeaturedHotel {
  name: string;
  nameBn: string;
  slug: string;
  city: string;
  cityBn: string;
  starRating: number;
  imageUrl: string;
  fromPrice: number;
  currency: string;
}

export default function HotelSearchTeaser({ locale }: { locale: string }) {
  const isBn = locale === 'bn';
  const [hotels, setHotels] = useState<FeaturedHotel[]>([]);

  useEffect(() => {
    fetch('/api/hotels/featured')
      .then((r) => r.json())
      .then((d) => setHotels(d.hotels ?? []))
      .catch(() => {});
  }, []);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center">
            <HotelIcon className="w-5 h-5 text-[#2d6a4f]" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isBn ? 'আপনার হোটেল খুঁজুন' : 'Find Your Hotel'}
            </h2>
            <p className="text-gray-500 text-sm">
              {isBn
                ? 'মক্কা, মদিনা ও দুবাইয়ের সেরা হোটেল — সরাসরি বুকিং অনুরোধ'
                : 'Handpicked hotels in Makkah, Madinah & Dubai — request a booking in minutes'}
            </p>
          </div>
        </div>

        <HotelSearchBar locale={locale} />

        {hotels.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {hotels.map((h) => (
              <Link
                key={h.slug}
                href={`/${locale}/hotels/${h.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="relative h-32 bg-gray-100">
                  {h.imageUrl && (
                    <Image
                      src={h.imageUrl}
                      alt={isBn ? h.nameBn : h.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  )}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-[#2d6a4f]">
                    {isBn ? h.nameBn : h.name}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                    <span className="inline-flex items-center gap-0.5 text-amber-500">
                      {h.starRating}
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </span>
                    · {isBn ? h.cityBn : h.city}
                  </p>
                  <p className="text-sm font-bold text-[#1b4332] mt-1">
                    {formatMoney(h.fromPrice, h.currency)}
                    <span className="text-xs text-gray-400 font-normal">
                      {isBn ? '/রাত' : '/night'}
                    </span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Insert into `app/[locale]/page.tsx`**

Add the import and place the component between `HomePackageSections` and `Hajj2027Banner`:

```tsx
import HotelSearchTeaser from '@/components/home/HotelSearchTeaser';
// ...
      <main className="flex-1">
        <HeroSection locale={locale} />
        <HomePackageSections locale={locale} />
        <HotelSearchTeaser locale={locale} />
        <Hajj2027Banner locale={locale} />
        <ServicesSection locale={locale} />
        <WhyChooseUs />
        <StatsSection />
        <CtaBanner />
      </main>
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/home/HotelSearchTeaser.tsx "app/[locale]/page.tsx"
git commit -m "feat(hotels): add homepage hotel search teaser with featured hotels"
```

---

### Task 16: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: both PASS (lint may show pre-existing warnings — only new errors block)

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: build completes; `/[locale]/hotels` and `/[locale]/hotels/[slug]` listed as dynamic (ƒ) routes.

- [ ] **Step 3: Manual verification checklist** (dev server + MongoDB + Cloudinary env)

1. **Admin-first + auto-update:** create a hotel in `/admin/hotels/new` (2 room types, photos, featured ✓, Makkah + distance 150) → open `/en/hotels` in another tab → hotel is there immediately, no rebuild.
2. **Filters:** search "Makkah" → distance chip appears; set ≤ 500m → hotel shown; set stars to exclude → empty state with clear button. Search "Dubai" → distance chip hidden.
3. **Sort:** with 2+ hotels, price low→high orders correctly.
4. **Detail + booking:** open detail page → Book This Room pre-selects room and scrolls → submit with valid BD phone → success card → enquiry in `/admin/enquiries` shows Hotel badge, dates, room type, guests → status/payment workflow works as for other enquiries.
5. **i18n:** `/bn/hotels` and the detail page show Bangla names, cities, amenities; navbar shows "হোটেল".
6. **Homepage:** teaser section renders below packages; featured hotel card appears; search from teaser lands on `/hotels` with params applied.
7. **Regression:** packages list/detail, package booking modal, air-ticketing form, and admin packages CRUD all still work.

- [ ] **Step 4: Fix anything the checklist surfaces, then final commit**

```bash
git add -A
git commit -m "feat(hotels): complete hotel booking feature"
```
