import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/mongodb';
import Enquiry from '@/models/Enquiry';

const DEFAULT_FEE_BDT = 30000;

const paymentSchema = z.object({
  enquiryId: z.string().min(1, 'enquiryId is required'),
  method: z.enum(['bkash', 'nagad', 'rocket', 'bank', 'card', 'cash']),
  reference: z.string().trim().max(120).optional().or(z.literal('')),
  amount: z.number().int().positive().max(10_000_000).optional(),
  bookingLabel: z.string().trim().max(200).optional(),
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
    const { enquiryId, method, reference, amount, bookingLabel } = parsed.data;
    const fee = amount ?? DEFAULT_FEE_BDT;

    await connectDB();
    const enquiry = await Enquiry.findById(enquiryId);
    if (!enquiry) {
      return NextResponse.json({ error: 'Booking record not found.' }, { status: 404 });
    }

    enquiry.paymentMethod = method;
    enquiry.paymentAmount = fee;
    enquiry.paymentReference = reference || '';
    enquiry.paymentStatus = 'pending';
    const trailer = `Payment intent: ${METHOD_LABELS[method]} · BDT ${fee.toLocaleString(
      'en-IN'
    )}${reference ? ` · Ref: ${reference}` : ''}${
      bookingLabel ? ` · For: ${bookingLabel}` : ''
    }`;
    enquiry.message = `${enquiry.message ?? ''}\n\n${trailer}`;
    await enquiry.save();

    if (method === 'card') {
      return NextResponse.json({
        success: true,
        method,
        amount: fee,
        gateway: 'sslcommerz',
        message:
          'Card payment will be processed via SSLCommerz. Our team will share the secure link shortly.',
      });
    }

    return NextResponse.json({
      success: true,
      method,
      amount: fee,
      message:
        method === 'cash'
          ? 'Cash on office confirmed. Please visit our Purana Paltan office within 3 days.'
          : 'Payment intent recorded. Our team will verify your transaction and confirm within 24 hours.',
    });
  } catch (error) {
    console.error('[api/bookings/payment] POST failed', error);
    return NextResponse.json(
      { error: 'Could not record your payment. Please call us or try again.' },
      { status: 500 }
    );
  }
}
