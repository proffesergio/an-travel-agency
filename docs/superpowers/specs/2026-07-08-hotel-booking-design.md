# Hotel Booking Feature — Design Spec

**Date:** 2026-07-08
**Status:** Approved pending final user review
**Reference:** GoZayaan hotel search (`public/images/reference-img-hotel-booking-feature.png`)

## Summary

Add a hotel booking feature to the ATHAR NUR Travels site. Inventory is **curated by the admin** through the admin panel (no third-party hotel API). Booking is **enquiry-first**: users submit a booking request; admin confirms availability and settles payment later using the existing enquiry payment tools. Destinations are **overseas-first** (Makkah/Madinah for Umrah & Hajj, Dubai for trips) with domestic cities supported too.

**Core constraint:** everything is managed from the admin panel, and public pages render live data — a hotel saved in admin appears on the site immediately (dynamic rendering + `revalidatePath`), no rebuild or redeploy.

## Decisions made during brainstorming

| Decision | Choice |
|---|---|
| Inventory source | Curated via admin panel |
| Booking flow | Enquiry first, pay later (existing payment tools) |
| Search placement | Homepage teaser card + dedicated `/hotels` page (Option C) |
| Rooms model | Room types per hotel, embedded subdocuments |
| Destinations | Overseas-first (Makkah, Madinah, Dubai, …), open list from DB |
| Filters | Price range, star rating, distance from Haram, amenities, sort |
| Results layout | Horizontal filter bar above full-width results (Option B), clean/modern |
| Room pictures | Shown on result cards and detail page |
| Build order | Admin panel first, then public pages |

## Data models

### `models/Hotel.ts` (new)

```ts
interface IRoomType {
  name: string;          nameBn: string;
  pricePerNight: number;              // in hotel.currency
  capacity: { adults: number; children: number };
  bedInfo?: string;                   // "1 King Bed"
  images: string[];                   // Cloudinary URLs
  available: boolean;
}

interface IHotel {
  name: string;            nameBn: string;
  slug: string;                       // unique
  city: string;            cityBn: string;
  country: string;         countryBn: string;
  starRating: 1 | 2 | 3 | 4 | 5;
  distanceFromHaramMeters?: number;   // Makkah/Madinah only; drives pilgrim filter
  description: string;     descriptionBn: string;
  amenities: string[];                // fixed keys: wifi, breakfast, parking,
                                      // prayer-room, shuttle, family-room, ac,
                                      // restaurant, laundry, elevator
  images: string[];                   // hotel gallery
  currency: string;                   // default 'BDT'; SAR/AED/USD for overseas
  featured: boolean;                  // homepage teaser section
  available: boolean;
  rooms: IRoomType[];                 // embedded
  // timestamps
}
```

Amenities are fixed keys translated via `messages/{en,bn}.json` so filters are locale-independent. Prices display in the hotel's own currency, no conversion.

### `models/Enquiry.ts` (extended, backward-compatible)

- `category` enum gains `'hotel'`.
- New optional fields: `hotelId`, `hotelName`, `roomType` (name snapshot), `checkIn`, `checkOut` (date strings), `roomsCount`, `guests: { adults, children }`.
- Existing status flow (new → contacted → closed) and payment fields reused unchanged.

## Admin panel (build first)

New **Hotels** item in the admin sidebar:

- `/admin/hotels` — table: thumbnail, name, city, stars, room count, featured/available, edit/delete. Mirrors `/admin/packages`.
- `/admin/hotels/new`, `/admin/hotels/[id]/edit` — single form: hotel basics (bilingual), star picker, currency select, optional distance-from-Haram, amenities checkbox grid, gallery multi-upload (existing `/api/upload` → Cloudinary), and a repeatable **room types editor** (like the package itinerary editor) with per-room images.
- `/admin/hotels/[id]` — read-only detail.
- `/admin/enquiries` — hotel enquiries appear with a `hotel` badge; detail page shows check-in/out, room type, guests.
- All mutations: admin-auth validated, `logActivity()` audit, `revalidatePath` on public hotel routes.

**APIs:** `/api/admin/hotels` (GET, POST), `/api/admin/hotels/[id]` (GET, PUT, DELETE) — same auth/layering as package routes. Validation in `lib/validation/hotel.ts` (zod), services in `lib/services/hotels.ts`.

## Public pages

- **Homepage teaser** — compact "Find your hotel" search card below the existing hero (hero unchanged); submits to `/hotels`. Below the card, a row of up to 4 `featured` hotels (photo, name, stars, from-price) linking to their detail pages.
- **`/[locale]/hotels`** — search bar (destination autocomplete, check-in/out, rooms & guests) + horizontal filter chips (Price ▾, Stars ▾, Distance from Haram ▾ — shown only for Makkah/Madinah searches, Amenities ▾, Sort ▾) + full-width hotel cards (photo, name, stars, city, distance badge, amenity icons, room photo thumbnails, "From {currency} X/night", View Rooms).
- **`/[locale]/hotels/[slug]`** — gallery, name/stars/distance/amenities, bilingual description, room-type cards (photos, bed info, capacity, price/night, Book This Room), booking request form (pre-filled room + dates; name, phone/WhatsApp, email, message).

### Behavior

- **Search state in the URL** (`?city=&checkin=&checkout=&rooms=&adults=&children=&stars=&minPrice=&maxPrice=&haramDistance=&amenities=&sort=`). Server component queries MongoDB per request. No pagination initially (curated inventory is small); add later if needed.
- **Freshness:** hotel routes render dynamically (`force-dynamic`); admin mutations also call `revalidatePath`. Admin saves → public site updates instantly.
- **Autocomplete:** `/api/hotels/destinations` returns Top Destinations (distinct cities by hotel count) + Top Properties (featured hotels), cached ~60s.
- **Dates/guests do not filter results** (no availability engine); they pre-fill and are stored on the enquiry. Check-out must be after check-in (zod, client + server).
- **Booking:** `POST /api/enquiries` (extended schema) → `category: 'hotel'` → admin inbox → WhatsApp/phone confirmation → payment recorded via existing tools.
- **i18n:** all hotel content bilingual (en/bn) rendered per locale; UI strings and amenity labels in `messages/*.json`.

## Error handling

- No results → empty state with "clear filters".
- Unknown/unavailable hotel slug → `notFound()`.
- Enquiry POST failure → inline error + sonner toast.
- Upload failures → existing admin upload error handling.

## Out of scope (deliberate)

- Live hotel inventory APIs (Hotelbeds/Amadeus).
- Per-date room availability tracking and instant online booking/payment at booking time.
- Currency conversion.
- Reviews/ratings by users, maps integration.

## Verification

- `npm run typecheck` and `npm run lint` pass.
- Manual checklist: admin creates hotel with rooms + images → appears on `/hotels` immediately; filters and sort produce correct subsets; distance filter appears only for Makkah/Madinah; booking request lands in admin inbox with hotel fields; bn locale shows Bangla content; existing package/enquiry flows unaffected.
