import { NextRequest, NextResponse } from 'next/server';
import { finalizeSslcommerz } from '@/lib/services/payment-gateway';

/**
 * SSLCommerz IPN (Instant Payment Notification) — server-to-server callback.
 * This is the reliable confirmation path (the browser success_url can be lost
 * if the user closes the tab). We re-validate and mark the enquiry. Idempotent.
 */
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const valId = form.get('val_id')?.toString();
    const tranId = form.get('tran_id')?.toString();
    const enquiryId = form.get('value_a')?.toString();

    await finalizeSslcommerz({ valId, tranId, enquiryId });
    return NextResponse.json({ status: true });
  } catch (error) {
    console.error('[api/payment/sslcommerz/ipn] failed', error);
    return NextResponse.json({ status: false }, { status: 500 });
  }
}
