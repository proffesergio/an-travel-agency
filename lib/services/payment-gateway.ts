import {
  getEnv,
  isPiprapayConfigured,
  isSslcommerzConfigured,
} from '@/lib/env';
import { connectDB } from '@/lib/mongodb';
import Enquiry, { type IEnquiry } from '@/models/Enquiry';
import { createCharge } from './piprapay';
import {
  initiatePayment as sslInitiate,
  validatePayment as sslValidate,
  isPaidStatus as sslIsPaid,
} from './sslcommerz';

export type GatewayName = 'piprapay' | 'sslcommerz';

/**
 * Decide which gateway handles checkout.
 * - PAYMENT_GATEWAY=piprapay|sslcommerz forces a specific one (only if configured).
 * - Otherwise auto-detect: SSLCommerz takes precedence when configured, else PipraPay.
 */
export function getActiveGateway(): GatewayName | null {
  const explicit = getEnv('PAYMENT_GATEWAY')?.toLowerCase();
  if (explicit === 'piprapay') return isPiprapayConfigured() ? 'piprapay' : null;
  if (explicit === 'sslcommerz') return isSslcommerzConfigured() ? 'sslcommerz' : null;
  if (isSslcommerzConfigured()) return 'sslcommerz';
  if (isPiprapayConfigured()) return 'piprapay';
  return null;
}

/**
 * Public origin for redirect/webhook/IPN URLs. Never derive from request.url —
 * behind LiteSpeed/Passenger the Host header leaks the internal :3000 (see proxy.ts).
 */
export function resolvePublicOrigin(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  try {
    return new URL(request.url).origin;
  } catch {
    return 'https://atharnurtravels.com';
  }
}

export interface StartCheckoutInput {
  enquiry: IEnquiry;
  amount: number;
  bookingLabel: string;
  origin: string;
}

export interface StartCheckoutResult {
  redirectUrl: string;
  gateway: GatewayName;
}

/**
 * Create a charge on the active gateway, persist its reference on the enquiry,
 * and return the hosted-checkout URL to redirect the customer to.
 */
export async function startCheckout(input: StartCheckoutInput): Promise<StartCheckoutResult> {
  const gateway = getActiveGateway();
  if (!gateway) throw new Error('No payment gateway configured');

  const { enquiry, amount, bookingLabel, origin } = input;
  const enquiryId = String(enquiry._id);

  if (gateway === 'piprapay') {
    const charge = await createCharge({
      fullName: enquiry.name,
      emailOrMobile: enquiry.email || enquiry.phone,
      amount,
      redirectUrl: `${origin}/payment/success?enquiry=${enquiryId}`,
      cancelUrl: `${origin}/payment/cancel?enquiry=${enquiryId}`,
      webhookUrl: `${origin}/api/payment/piprapay/webhook`,
      metadata: { enquiryId, bookingLabel },
    });
    enquiry.paymentMethod = 'piprapay';
    enquiry.paymentAmount = amount;
    enquiry.paymentStatus = 'pending';
    enquiry.ppId = charge.pp_id;
    await enquiry.save();
    return { redirectUrl: charge.pp_url, gateway };
  }

  // SSLCommerz: tran_id must be unique per attempt.
  const tranId = `ANT-${enquiryId}-${Date.now().toString(36)}`;
  const { gatewayPageUrl } = await sslInitiate({
    amount,
    tranId,
    customerName: enquiry.name,
    customerEmail: enquiry.email,
    customerPhone: enquiry.phone,
    productName: bookingLabel,
    successUrl: `${origin}/api/payment/sslcommerz/success`,
    failUrl: `${origin}/api/payment/sslcommerz/fail`,
    cancelUrl: `${origin}/api/payment/sslcommerz/cancel`,
    ipnUrl: `${origin}/api/payment/sslcommerz/ipn`,
    valueA: enquiryId,
  });
  enquiry.paymentMethod = 'sslcommerz';
  enquiry.paymentAmount = amount;
  enquiry.paymentStatus = 'pending';
  enquiry.paymentReference = tranId;
  await enquiry.save();
  return { redirectUrl: gatewayPageUrl, gateway };
}

/**
 * Validate an SSLCommerz callback (success or IPN) and update the enquiry.
 * Shared by both the browser success_url handler and the server-to-server IPN.
 * Idempotent — safe to run twice for the same transaction.
 */
export async function finalizeSslcommerz(opts: {
  valId?: string | null;
  tranId?: string | null;
  enquiryId?: string | null;
}): Promise<{ paid: boolean; enquiryId?: string }> {
  if (!opts.valId) return { paid: false, enquiryId: opts.enquiryId ?? undefined };

  const result = await sslValidate(opts.valId);

  await connectDB();
  let enquiry: IEnquiry | null = null;
  if (opts.enquiryId) {
    try {
      enquiry = await Enquiry.findById(opts.enquiryId);
    } catch {
      enquiry = null;
    }
  }
  if (!enquiry && opts.tranId) {
    enquiry = await Enquiry.findOne({ paymentReference: opts.tranId });
  }
  if (!enquiry) return { paid: false };

  // Guard against tampered amounts: the validated amount must match what we charged.
  const expected = enquiry.paymentAmount ?? 0;
  const amountOk = Math.abs(result.amount - expected) < 1;
  const paid = sslIsPaid(result.status) && amountOk;

  enquiry.paymentMethod = 'sslcommerz';
  enquiry.paymentStatus = paid ? 'paid' : 'failed';
  if (paid) enquiry.paidAt = new Date();
  if (result.bankTranId) enquiry.transactionId = result.bankTranId;
  await enquiry.save();

  return { paid, enquiryId: String(enquiry._id) };
}
