import { NextResponse } from 'next/server';
import { listDestinations, listHotelSuggestions } from '@/lib/services/hotels';

export const revalidate = 60;

export async function GET() {
  try {
    const [destinations, properties] = await Promise.all([
      listDestinations(),
      listHotelSuggestions(),
    ]);
    return NextResponse.json({ destinations, properties });
  } catch (error) {
    console.error('[api/hotels/destinations] GET failed', error);
    return NextResponse.json({ destinations: [], properties: [] });
  }
}
