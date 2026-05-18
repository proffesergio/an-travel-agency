import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword } from '@/lib/password';
import { normalizePhone, registerSchema } from '@/lib/validation/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const phone = normalizePhone(data.phone);

    await connectDB();
    const clash = await User.findOne({
      $or: [{ email: data.email }, { phone }],
    });
    if (clash) {
      const reason =
        clash.email === data.email
          ? 'An account with this email already exists.'
          : 'An account with this phone number already exists.';
      return NextResponse.json({ error: reason }, { status: 409 });
    }

    const passwordHash = await hashPassword(data.password);
    const user = await User.create({
      name: data.name,
      email: data.email,
      phone,
      passwordHash,
      role: 'user',
      provider: 'credentials',
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please sign in.',
      user: { id: user._id.toString(), name: user.name, email: user.email, phone: user.phone },
    });
  } catch (error) {
    console.error('[api/auth/register] POST failed', error);
    return NextResponse.json(
      { error: 'Could not create your account. Please try again.' },
      { status: 500 }
    );
  }
}
