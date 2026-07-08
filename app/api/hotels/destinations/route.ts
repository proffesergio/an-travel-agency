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
