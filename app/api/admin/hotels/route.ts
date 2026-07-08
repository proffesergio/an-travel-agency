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
