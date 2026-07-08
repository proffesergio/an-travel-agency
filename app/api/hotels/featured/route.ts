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
