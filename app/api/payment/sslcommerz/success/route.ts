import { NextRequest, NextResponse } from 'next/server';
import { finalizeSslcommerz, resolvePublicOrigin } from '@/lib/services/payment-gateway';

/**
 * SSLCommerz success_url — the gateway POSTs here (browser navigation) after a
 * completed payment. We re-validate server-side (source of truth), update the
 * enquiry, then redirect the browser to the friendly success page.
 */
export async function POST(request: NextRequest) {
  const origin = resolvePublicOrigin(request);
  let enquiryId: string | undefined;
  try {
    const form = await request.formData();
    const valId = form.get('val_id')?.toString();
    const tranId = form.get('tran_id')?.toString();
    enquiryId = form.get('value_a')?.toString();

    const result = await finalizeSslcommerz({ valId, tranId, enquiryId });
    enquiryId = result.enquiryId ?? enquiryId;

    if (!result.paid) {
      return NextResponse.redirect(
        `${origin}/payment/cancel${enquiryId ? `?enquiry=${enquiryId}` : ''}`,
        303
      );
    }
  } catch (error) {
    console.error('[api/payment/sslcommerz/success] failed', error);
    return NextResponse.redirect(`${origin}/payment/cancel`, 303);
  }

  return NextResponse.redirect(
    `${origin}/payment/success${enquiryId ? `?enquiry=${enquiryId}` : ''}`,
    303
  );
}
