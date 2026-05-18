import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/mongodb';
import Enquiry from '@/models/Enquiry';

const HAJJ_2027_BOOKING_FEE = 30000;

const paymentSchema = z.object({
  enquiryId: z.string().min(1, 'enquiryId is required'),
  method: z.enum(['bkash', 'nagad', 'rocket', 'bank', 'card', 'cash']),
  reference: z.string().trim().max(120).optional().or(z.literal('')),
});

const METHOD_LABELS: Record<string, string> = {
  bkash: 'bKash',
  nagad: 'Nagad',
  rocket: 'Rocket',
  bank: 'Bank transfer',
  card: 'Card (SSLCommerz)',
  cash: 'Cash on office',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = paymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { enquiryId, method, reference } = parsed.data;

    await connectDB();
    const enquiry = await Enquiry.findById(enquiryId);
    if (!enquiry) {
      return NextResponse.json({ error: 'Registration not found.' }, { status: 404 });
    }

    enquiry.paymentMethod = method;
    enquiry.paymentAmount = HAJJ_2027_BOOKING_FEE;
    enquiry.paymentReference = reference || '';
    enquiry.paymentStatus = method === 'card' ? 'pending' : 'pending';
    enquiry.message = `${enquiry.message ?? ''}\n\nPayment intent: ${METHOD_LABELS[method]} · BDT ${HAJJ_2027_BOOKING_FEE.toLocaleString('en-IN')}${
      reference ? ` · Ref: ${reference}` : ''
    }`;
    await enquiry.save();

    if (method === 'card') {
      // Cards flow — the client should redirect to SSLCommerz. We return a
      // placeholder here that the frontend uses to forward the user. When
      // SSLCommerz is configured (SSLCOMMERZ_STORE_ID etc), wire this to
      // /api/payment/initiate.
      return NextResponse.json({
        success: true,
        method,
        amount: HAJJ_2027_BOOKING_FEE,
        gateway: 'sslcommerz',
        message:
          'Card payment will be processed via SSLCommerz. Our team will share the secure link shortly.',
      });
    }

    return NextResponse.json({
      success: true,
      method,
      amount: HAJJ_2027_BOOKING_FEE,
      message:
        method === 'cash'
          ? 'Cash on office confirmed. Please visit our Purana Paltan office within 3 days.'
          : 'Payment intent recorded. Our team will verify your transaction and confirm within 24 hours.',
    });
  } catch (error) {
    console.error('[api/hajj2027/payment] POST failed', error);
    return NextResponse.json(
      { error: 'Could not record your payment. Please call us or try again.' },
      { status: 500 }
    );
  }
}
