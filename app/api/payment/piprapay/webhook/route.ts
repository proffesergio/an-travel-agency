import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Enquiry from '@/models/Enquiry';
import { isValidWebhookKey, verifyPayment } from '@/lib/services/piprapay';

/**
 * PipraPay server-to-server webhook.
 *
 * Security: PipraPay sends our API key in the `mh-piprapay-api-key` header. We
 * reject anything that doesn't match. We then independently re-verify the
 * charge with verify-payments (verify-payments is the source of truth — never
 * trust the webhook body's status alone) before marking the booking paid.
 */
export async function POST(request: NextRequest) {
  try {
    const receivedKey = request.headers.get('mh-piprapay-api-key');
    if (!isValidWebhookKey(receivedKey)) {
      return NextResponse.json({ status: false, message: 'Unauthorized' }, { status: 401 });
    }

    const payload = (await request.json().catch(() => null)) as
      | { pp_id?: string | number; metadata?: { enquiryId?: string } }
      | null;
    const ppId = payload?.pp_id != null ? String(payload.pp_id) : null;
    if (!ppId) {
      return NextResponse.json({ status: false, message: 'Missing pp_id' }, { status: 400 });
    }

    // Source of truth: re-verify with PipraPay.
    const verified = await verifyPayment(ppId);

    await connectDB();
    // Reconcile by pp_id (set at create time); fall back to metadata.enquiryId.
    const enquiry =
      (await Enquiry.findOne({ ppId })) ??
      (payload?.metadata?.enquiryId
        ? await Enquiry.findById(payload.metadata.enquiryId)
        : null);

    if (!enquiry) {
      // Acknowledge so PipraPay stops retrying, but log for investigation.
      console.error('[piprapay/webhook] no enquiry for pp_id', ppId);
      return NextResponse.json({ status: true, message: 'No matching booking' });
    }

    const isPaid = verified.status?.toLowerCase() === 'completed';
    enquiry.paymentMethod = 'piprapay';
    enquiry.ppId = ppId;
    enquiry.paymentStatus = isPaid ? 'paid' : 'failed';
    if (isPaid) enquiry.paidAt = new Date();
    if (verified.transaction_id) enquiry.transactionId = verified.transaction_id;
    if (verified.sender_number) enquiry.paymentReference = verified.sender_number;
    if (typeof verified.amount === 'number') enquiry.paymentAmount = verified.amount;
    await enquiry.save();

    return NextResponse.json({ status: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('[api/payment/piprapay/webhook] POST failed', error);
    return NextResponse.json(
      { status: false, message: 'Webhook processing error' },
      { status: 500 }
    );
  }
}
