import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdminSession } from '@/lib/auth-guards';
import { listPackages, createPackage } from '@/lib/services/packages';
import { packageInputSchema } from '@/lib/validation/package';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!isAdminSession(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const packages = await listPackages({
      category: searchParams.get('category') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    });
    return NextResponse.json({ packages });
  } catch (error) {
    console.error('[api/admin/packages] GET failed', error);
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!isAdminSession(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json().catch(() => null);
    const parsed = packageInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const pkg = await createPackage(parsed.data, session.user?.email ?? 'unknown');
    return NextResponse.json({ package: pkg }, { status: 201 });
  } catch (error: unknown) {
    console.error('[api/admin/packages] POST failed', error);
    const err = error as { code?: number; message?: string };
    if (err.code === 11000) {
      return NextResponse.json(
        { error: 'A package with this slug already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to create package' }, { status: 500 });
  }
}
