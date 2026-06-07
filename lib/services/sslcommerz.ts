import { getEnv, requireEnv } from '@/lib/env';

/**
 * SSLCommerz — Bangladesh's hosted-checkout gateway.
 * Docs: https://developer.sslcommerz.com/  (v4 API)
 *
 * Flow:
 *   1. initiatePayment() → POST store creds + order → returns GatewayPageURL.
 *   2. Redirect the browser to GatewayPageURL.
 *   3. On completion SSLCommerz POSTs (browser) to success_url/fail_url/cancel_url
 *      and (server-to-server) to ipn_url, carrying val_id + tran_id + value_a.
 *   4. validatePayment(val_id) is the source of truth — store_passwd-authenticated.
 *      Only mark paid when status is VALID/VALIDATED AND amount/currency match.
 *
 * Live vs sandbox is switched by SSLCOMMERZ_IS_LIVE=true.
 */

function isLive(): boolean {
  return getEnv('SSLCOMMERZ_IS_LIVE') === 'true';
}

function endpoints() {
  return isLive()
    ? {
        init: 'https://securepay.sslcommerz.com/gwprocess/v4/api.php',
        validate: 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php',
      }
    : {
        init: 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php',
        validate: 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php',
      };
}

export interface SslInitInput {
  amount: number;
  currency?: string;
  tranId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productName: string;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
  /** Passthrough used to reconcile the callback to an enquiry. */
  valueA?: string;
}

export async function initiatePayment(input: SslInitInput): Promise<{ gatewayPageUrl: string }> {
  const form = new URLSearchParams();
  form.set('store_id', requireEnv('SSLCOMMERZ_STORE_ID'));
  form.set('store_passwd', requireEnv('SSLCOMMERZ_STORE_PASSWORD'));
  form.set('total_amount', String(input.amount));
  form.set('currency', input.currency ?? 'BDT');
  form.set('tran_id', input.tranId);
  form.set('success_url', input.successUrl);
  form.set('fail_url', input.failUrl);
  form.set('cancel_url', input.cancelUrl);
  form.set('ipn_url', input.ipnUrl);
  // Customer block (required by the gateway; fall back to placeholders).
  form.set('cus_name', input.customerName || 'Customer');
  form.set('cus_email', input.customerEmail || 'noemail@atharnurtravels.com');
  form.set('cus_phone', input.customerPhone || 'N/A');
  form.set('cus_add1', 'N/A');
  form.set('cus_city', 'Dhaka');
  form.set('cus_country', 'Bangladesh');
  // Product block.
  form.set('shipping_method', 'NO');
  form.set('num_of_item', '1');
  form.set('product_name', input.productName);
  form.set('product_category', 'Travel');
  form.set('product_profile', 'travel-vertical');
  if (input.valueA) form.set('value_a', input.valueA);

  const res = await fetch(endpoints().init, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: form.toString(),
    cache: 'no-store',
  });

  const json = (await res.json().catch(() => null)) as
    | { status?: string; GatewayPageURL?: string; failedreason?: string }
    | null;

  if (!res.ok || !json || json.status !== 'SUCCESS' || !json.GatewayPageURL) {
    throw new Error(
      `SSLCommerz init failed (HTTP ${res.status}): ${json?.failedreason ?? 'unexpected response'}`
    );
  }
  return { gatewayPageUrl: json.GatewayPageURL };
}

export interface SslValidationResult {
  status: string; // VALID | VALIDATED | INVALID_TRANSACTION | FAILED
  tranId: string;
  amount: number;
  currency: string;
  bankTranId?: string;
  cardType?: string;
}

export async function validatePayment(valId: string): Promise<SslValidationResult> {
  const url = new URL(endpoints().validate);
  url.searchParams.set('val_id', valId);
  url.searchParams.set('store_id', requireEnv('SSLCOMMERZ_STORE_ID'));
  url.searchParams.set('store_passwd', requireEnv('SSLCOMMERZ_STORE_PASSWORD'));
  url.searchParams.set('format', 'json');

  const res = await fetch(url, { cache: 'no-store' });
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !json) {
    throw new Error(`SSLCommerz validation request failed (HTTP ${res.status}) for val_id ${valId}`);
  }
  return {
    status: String(json.status ?? ''),
    tranId: String(json.tran_id ?? ''),
    amount: Number(json.amount ?? 0),
    currency: String(json.currency ?? ''),
    bankTranId: json.bank_tran_id ? String(json.bank_tran_id) : undefined,
    cardType: json.card_type ? String(json.card_type) : undefined,
  };
}

export function isPaidStatus(status: string): boolean {
  return status === 'VALID' || status === 'VALIDATED';
}
