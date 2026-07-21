import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdminSession } from '@/lib/auth-guards';
import { getHotelById, updateHotel, deleteHotel } from '@/lib/services/hotels';
import { hotelUpdateSchema } from '@/lib/validation/hotel';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!isAdminSession(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
  if (!isAdminSession(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
  if (!isAdminSession(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
