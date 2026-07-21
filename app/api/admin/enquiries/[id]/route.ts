import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { auth } from '@/lib/auth';
import { isAdminSession } from '@/lib/auth-guards';
import {
  getEnquiryById,
  updateEnquiryStatus,
  deleteEnquiry,
} from '@/lib/services/enquiries';
import { enquiryStatusSchema } from '@/lib/validation/enquiry';

// Prevent static generation of this route – forces runtime execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Validates that required admin credentials exist in the environment.
 * Called inside each handler to avoid build-time crashes.
 */
function validateAdminEnvironment() {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    throw new Error('Missing admin credentials. Set ADMIN_EMAIL and ADMIN_PASSWORD in cPanel Node.js App env vars.');
  }
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  // ✅ Credentials check moved here – runs at request time only
  validateAdminEnvironment();

  const session = await auth();
  if (!isAdminSession(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid enquiry id' }, { status: 400 });
  }

  try {
    const enquiry = await getEnquiryById(id);
    if (!enquiry) return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
    return NextResponse.json({ enquiry });
  } catch (error) {
    console.error('[api/admin/enquiries/:id] GET failed', error);
    return NextResponse.json({ error: 'Failed to fetch enquiry' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  // ✅ Credentials check moved here
  validateAdminEnvironment();

  const session = await auth();
  if (!isAdminSession(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid enquiry id' }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = enquiryStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const enquiry = await updateEnquiryStatus(
      id,
      parsed.data.status,
      session.user?.email ?? 'unknown'
    );
    if (!enquiry) return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
    return NextResponse.json({ enquiry });
  } catch (error) {
    console.error('[api/admin/enquiries/:id] PATCH failed', error);
    return NextResponse.json({ error: 'Failed to update enquiry' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  // ✅ Credentials check moved here
  validateAdminEnvironment();

  const session = await auth();
  if (!isAdminSession(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid enquiry id' }, { status: 400 });
  }

  try {
    const enquiry = await deleteEnquiry(id, session.user?.email ?? 'unknown');
    if (!enquiry) return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/admin/enquiries/:id] DELETE failed', error);
    return NextResponse.json({ error: 'Failed to delete enquiry' }, { status: 500 });
  }
}