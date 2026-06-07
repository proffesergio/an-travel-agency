import { getEnv, requireEnv } from '@/lib/env';

/**
 * PipraPay — open-source, self-hosted hosted-checkout gateway.
 * Docs: https://docs.piprapay.com/reference  ·  https://fattain-naime.github.io/PipraPay-Api-Documentation/
 *
 * Flow:
 *   1. createCharge() → returns { pp_id, pp_url }. Redirect the browser to pp_url.
 *   2. Customer pays on PipraPay's hosted page (bKash/Nagad/cards/…).
 *   3. PipraPay calls our webhook_url (server-to-server) AND redirects the
 *      browser to redirect_url. The webhook header `mh-piprapay-api-key` must
 *      match our API key.
 *   4. verifyPayment(pp_id) is the source of truth — only mark paid when it
 *      returns status === 'completed'.
 */

const API_KEY_HEADER = 'mh-piprapay-api-key';

function baseUrl(): string {
  // Trim a trailing slash so we can safely append `/api/...`.
  return requireEnv('PIPRAPAY_BASE_URL').replace(/\/+$/, '');
}

export function piprapayCurrency(): string {
  return getEnv('PIPRAPAY_CURRENCY') ?? 'BDT';
}

/** Verify an incoming webhook's API-key header against our configured key. */
export function isValidWebhookKey(received: string | null | undefined): boolean {
  const expected = getEnv('PIPRAPAY_API_KEY');
  if (!expected || !received) return false;
  // Constant-time-ish compare; lengths differ → fail fast.
  if (received.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= received.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export interface CreateChargeInput {
  fullName: string;
  /** Email OR mobile number — PipraPay accepts either. */
  emailOrMobile: string;
  /** Amount as a whole/decimal number; sent to PipraPay as a string. */
  amount: number;
  redirectUrl: string;
  cancelUrl: string;
  webhookUrl: string;
  metadata?: Record<string, unknown>;
}

export interface CreateChargeResult {
  pp_id: string;
  pp_url: string;
}

export async function createCharge(input: CreateChargeInput): Promise<CreateChargeResult> {
  const res = await fetch(`${baseUrl()}/api/create-charge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      [API_KEY_HEADER]: requireEnv('PIPRAPAY_API_KEY'),
    },
    body: JSON.stringify({
      full_name: input.fullName,
      email_mobile: input.emailOrMobile,
      amount: String(input.amount),
      currency: piprapayCurrency(),
      redirect_url: input.redirectUrl,
      cancel_url: input.cancelUrl,
      webhook_url: input.webhookUrl,
      return_type: 'GET',
      metadata: input.metadata ?? {},
    }),
    // PipraPay can be slow on cold instances; don't cache.
    cache: 'no-store',
  });

  const json = (await res.json().catch(() => null)) as
    | { status?: boolean; pp_id?: string | number; pp_url?: string; message?: string }
    | null;

  if (!res.ok || !json || json.status === false || !json.pp_url || json.pp_id == null) {
    throw new Error(
      `PipraPay create-charge failed (HTTP ${res.status}): ${json?.message ?? 'unexpected response'}`
    );
  }

  return { pp_id: String(json.pp_id), pp_url: json.pp_url };
}

export interface VerifyPaymentResult {
  pp_id: string;
  status: string; // 'completed' | 'pending' | 'cancelled' | ...
  amount: number;
  currency: string;
  transaction_id?: string;
  payment_method?: string;
  sender_number?: string;
  customer_name?: string;
  customer_email_mobile?: string;
  metadata?: Record<string, unknown>;
  date?: string;
}

export async function verifyPayment(ppId: string): Promise<VerifyPaymentResult> {
  const res = await fetch(`${baseUrl()}/api/verify-payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      [API_KEY_HEADER]: requireEnv('PIPRAPAY_API_KEY'),
    },
    body: JSON.stringify({ pp_id: ppId }),
    cache: 'no-store',
  });

  const json = (await res.json().catch(() => null)) as VerifyPaymentResult | null;
  if (!res.ok || !json || !json.status) {
    throw new Error(`PipraPay verify-payments failed (HTTP ${res.status}) for pp_id ${ppId}`);
  }
  return json;
}
