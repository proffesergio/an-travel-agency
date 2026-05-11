import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listEnquiries } from '@/lib/services/enquiries';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const enquiries = await listEnquiries({
      status: searchParams.get('status') ?? undefined,
      category: searchParams.get('category') ?? undefined,
    });
    return NextResponse.json({ enquiries });
  } catch (error) {
    console.error('[api/admin/enquiries] GET failed', error);
    return NextResponse.json({ error: 'Failed to fetch enquiries' }, { status: 500 });
  }
}
