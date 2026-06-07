import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/mongodb';
import Enquiry from '@/models/Enquiry';
import { isOnlinePaymentConfigured } from '@/lib/env';
import { resolvePublicOrigin, startCheckout } from '@/lib/services/payment-gateway';

const DEFAULT_FEE_BDT = 30000;

const schema = z.object({
  enquiryId: z.string().min(1, 'enquiryId is required'),
  amount: z.number().int().positive().max(10_000_000).optional(),
  bookingLabel: z.string().trim().max(200).optional(),
});

/**
 * Gateway-agnostic checkout entry point. Picks the active gateway (PipraPay or
 * SSLCommerz) via env config and returns a hosted-checkout redirect URL.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isOnlinePaymentConfigured()) {
      return NextResponse.json(
        { error: 'Online payment is not configured. Please choose another method or call us.' },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { enquiryId, amount, bookingLabel } = parsed.data;
    const fee = amount ?? DEFAULT_FEE_BDT;

    await connectDB();
    const enquiry = await Enquiry.findById(enquiryId);
    if (!enquiry) {
      return NextResponse.json({ error: 'Booking record not found.' }, { status: 404 });
    }

    const { redirectUrl, gateway } = await startCheckout({
      enquiry,
      amount: fee,
      bookingLabel: bookingLabel ?? enquiry.packageTitle ?? 'Booking',
      origin: resolvePublicOrigin(request),
    });

    return NextResponse.json({ success: true, gateway, redirectUrl });
  } catch (error) {
    console.error('[api/payment/checkout] POST failed', error);
    return NextResponse.json(
      { error: 'Could not start the online payment. Please try again or call us.' },
      { status: 502 }
    );
  }
}
