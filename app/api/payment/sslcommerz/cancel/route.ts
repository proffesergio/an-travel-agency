import { NextRequest, NextResponse } from 'next/server';
import { resolvePublicOrigin } from '@/lib/services/payment-gateway';

/** SSLCommerz cancel_url — customer cancelled. Send them to the cancel page. */
export async function POST(request: NextRequest) {
  const origin = resolvePublicOrigin(request);
  let enquiryId: string | undefined;
  try {
    const form = await request.formData();
    enquiryId = form.get('value_a')?.toString();
  } catch {
    // ignore — fall through to the generic cancel page
  }
  return NextResponse.redirect(
    `${origin}/payment/cancel${enquiryId ? `?enquiry=${enquiryId}` : ''}`,
    303
  );
}
