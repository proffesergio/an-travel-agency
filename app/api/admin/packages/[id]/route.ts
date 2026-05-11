import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { auth } from '@/lib/auth';
import {
  getPackageById,
  updatePackage,
  deletePackage,
} from '@/lib/services/packages';
import { packageInputSchema } from '@/lib/validation/package';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid package id' }, { status: 400 });
  }

  try {
    const pkg = await getPackageById(id);
    if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    return NextResponse.json({ package: pkg });
  } catch (error) {
    console.error('[api/admin/packages/:id] GET failed', error);
    return NextResponse.json({ error: 'Failed to fetch package' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid package id' }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = packageInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const pkg = await updatePackage(id, parsed.data, session.user?.email ?? 'unknown');
    if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    return NextResponse.json({ package: pkg });
  } catch (error: unknown) {
    console.error('[api/admin/packages/:id] PUT failed', error);
    const err = error as { code?: number };
    if (err.code === 11000) {
      return NextResponse.json(
        { error: 'A package with this slug already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to update package' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid package id' }, { status: 400 });
  }

  try {
    const pkg = await deletePackage(id, session.user?.email ?? 'unknown');
    if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/admin/packages/:id] DELETE failed', error);
    return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 });
  }
}
