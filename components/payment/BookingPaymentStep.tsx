'use client';

import { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  Globe,
  Loader2,
  ReceiptText,
  Smartphone,
  Wallet,
} from 'lucide-react';

export const PRE_BOOKING_FEE_BDT = 30000;

export type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'bank' | 'card' | 'cash' | 'online';

export interface BookingPaymentStepProps {
  enquiryId: string;
  customerName?: string;
  /** What the user is paying for, e.g. "Hajj 2027 booking" or "Umrah Standard package" */
  bookingLabel: string;
  /** Subtitle line shown under the section heading */
  subtitle?: string;
  /** Step indicator text, defaults to "Booking Fee" */
  stepLabel?: string;
  /** Pre-booking fee in BDT. Defaults to 30,000. */
  feeBdt?: number;
  /** Label for the success-screen reset button */
  resetLabel?: string;
  onReset: () => void;
}

type Stage = 'choose' | 'detail' | 'submitting' | 'success';

interface MethodSpec {
  id: PaymentMethod;
  label: string;
  sub: string;
  Icon: React.ComponentType<{ className?: string }>;
  category: 'mobile' | 'bank' | 'card' | 'cash' | 'online';
  accent: string;
  iconBg: string;
}

const METHODS: MethodSpec[] = [
  { id: 'online', label: 'Pay Online', sub: 'bKash · Nagad · Card — instant', Icon: Globe, category: 'online', accent: 'border-teal-300 hover:border-teal-500', iconBg: 'bg-teal-100 text-teal-600' },
  { id: 'bkash', label: 'bKash', sub: 'Mobile Banking', Icon: Smartphone, category: 'mobile', accent: 'border-pink-300 hover:border-pink-500', iconBg: 'bg-pink-100 text-pink-600' },
  { id: 'nagad', label: 'Nagad', sub: 'Mobile Banking', Icon: Smartphone, category: 'mobile', accent: 'border-orange-300 hover:border-orange-500', iconBg: 'bg-orange-100 text-orange-600' },
  { id: 'rocket', label: 'Rocket', sub: 'Mobile Banking', Icon: Smartphone, category: 'mobile', accent: 'border-purple-300 hover:border-purple-500', iconBg: 'bg-purple-100 text-purple-600' },
  { id: 'bank', label: 'Bank Transfer', sub: 'Direct deposit', Icon: Building2, category: 'bank', accent: 'border-blue-300 hover:border-blue-500', iconBg: 'bg-blue-100 text-blue-600' },
  { id: 'card', label: 'Card Payment', sub: 'Visa / Mastercard via SSLCommerz', Icon: CreditCard, category: 'card', accent: 'border-emerald-300 hover:border-emerald-500', iconBg: 'bg-emerald-100 text-emerald-600' },
  { id: 'cash', label: 'Cash on Office', sub: 'Pay at Purana Paltan', Icon: Wallet, category: 'cash', accent: 'border-amber-300 hover:border-amber-500', iconBg: 'bg-amber-100 text-amber-700' },
];

const MOBILE_INSTRUCTIONS: Record<'bkash' | 'nagad' | 'rocket', { number: string; type: string; steps: string[] }> = {
  bkash: {
    number: '01843-431743',
    type: 'Merchant',
    steps: [
      'bKash অ্যাপ → "Send Money" → এই নম্বর',
      'অথবা ডায়াল *247# → 1. Send Money',
      'টাকার পরিমাণ: পূর্ণ পরিমাণ লিখুন',
      'রেফারেন্স: আপনার মোবাইল নম্বর',
      'TrxID কপি করে নিচে লিখুন',
    ],
  },
  nagad: {
    number: '01843-431743',
    type: 'Personal',
    steps: [
      'Nagad অ্যাপ → "Send Money" → এই নম্বর',
      'অথবা ডায়াল *167#',
      'টাকার পরিমাণ: পূর্ণ পরিমাণ লিখুন',
      'রেফারেন্স: আপনার মোবাইল নম্বর',
      'TrxID কপি করে নিচে লিখুন',
    ],
  },
  rocket: {
    number: '01843-431743-1',
    type: 'Personal',
    steps: [
      'Rocket অ্যাপ → "Send Money" → এই নম্বর',
      'অথবা ডায়াল *322#',
      'টাকার পরিমাণ: পূর্ণ পরিমাণ লিখুন',
      'রেফারেন্স: আপনার মোবাইল নম্বর',
      'TrxID কপি করে নিচে লিখুন',
    ],
  },
};

const BANK_DETAILS = {
  bank: 'Islami Bank Bangladesh Ltd.',
  branch: 'Paltan Branch, Dhaka',
  account: 'Athar Nur Travels',
  number: '2050X-XXXXXXXX-XXX',
  routing: '125264842',
};

const OFFICE_DETAILS = {
  address: 'Azad Centre, 55 Purana Paltan (14th Floor), Dhaka-1000',
  hours: 'Sat–Thu · 10:00 AM – 7:00 PM',
  phone: '+88 01843 431743',
};

export default function BookingPaymentStep({
  enquiryId,
  customerName,
  bookingLabel,
  subtitle,
  stepLabel = 'Booking Fee',
  feeBdt = PRE_BOOKING_FEE_BDT,
  resetLabel = 'নতুন বুকিং শুরু করুন',
  onReset,
}: BookingPaymentStepProps) {
  const [stage, setStage] = useState<Stage>('choose');
  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [resultMessage, setResultMessage] = useState('');

  const formattedFee = feeBdt.toLocaleString('en-IN');
  const computedSubtitle =
    subtitle ?? `${bookingLabel} বুকিং নিশ্চিত করতে অগ্রিম ৳ ${formattedFee} জমা দিন`;

  const choose = (method: PaymentMethod) => {
    setSelected(method);
    setReference('');
    setError('');
    setStage('detail');
  };

  const submitPayment = async () => {
    if (!selected) return;
    setStage('submitting');
    setError('');

    // Online gateway: create a charge on whichever gateway is configured
    // (PipraPay or SSLCommerz) and redirect to its hosted checkout page.
    if (selected === 'online') {
      try {
        const res = await fetch('/api/payment/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enquiryId, amount: feeBdt, bookingLabel }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.redirectUrl) {
          setError(json.error ?? 'Could not start online payment. Please try another method.');
          setStage('detail');
          return;
        }
        // Hand off to the gateway's hosted checkout.
        window.location.href = json.redirectUrl;
        return;
      } catch {
        setError('Network error. Please try again.');
        setStage('detail');
        return;
      }
    }

    try {
      const res = await fetch('/api/bookings/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enquiryId,
          method: selected,
          reference,
          amount: feeBdt,
          bookingLabel,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? 'Could not record your payment.');
        setStage('detail');
        return;
      }
      setResultMessage(json.message ?? 'Payment intent recorded.');
      setStage('success');
    } catch {
      setError('Network error. Please try again.');
      setStage('detail');
    }
  };

  if (stage === 'success') {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-3xl p-8 sm:p-12 text-center shadow-sm">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-green-900 mb-3">
          আলহামদুলিল্লাহ! পেমেন্ট তথ্য গ্রহণ করা হয়েছে
        </h3>
        <p className="text-green-800 max-w-xl mx-auto">{resultMessage}</p>
        <div className="mt-6 p-4 rounded-2xl bg-white border border-green-100 max-w-md mx-auto text-sm text-gray-600">
          <p>
            Booking ID:{' '}
            <span className="font-mono font-semibold text-gray-900">
              {enquiryId.slice(-8).toUpperCase()}
            </span>
          </p>
          {customerName && (
            <p className="mt-1">
              Name: <span className="font-semibold text-gray-900">{customerName}</span>
            </p>
          )}
          <p className="mt-1">
            Package: <span className="font-semibold text-gray-900">{bookingLabel}</span>
          </p>
          <p className="mt-1">
            Amount: <span className="font-semibold text-gray-900">৳{formattedFee}</span>
          </p>
        </div>
        <button
          onClick={onReset}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#2d6a4f] text-white text-sm font-semibold hover:bg-[#1b4332] transition-colors"
        >
          {resetLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-5 sm:p-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold text-[#2d6a4f] tracking-widest uppercase">
            {stepLabel}
          </p>
          <h3 className="mt-1 text-xl sm:text-2xl font-bold text-gray-900">প্যাকেজ বুকিং পেমেন্ট</h3>
          <p className="mt-1 text-sm text-gray-600">{computedSubtitle}</p>
        </div>
        <div className="hidden sm:block text-right">
          <div className="inline-flex flex-col items-end px-4 py-2.5 rounded-2xl bg-gradient-to-br from-[#2d6a4f] to-[#1b4332] text-white shadow-sm">
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Pre-booking</span>
            <span className="text-xl font-extrabold leading-none mt-0.5">৳{formattedFee}</span>
          </div>
        </div>
      </div>

      {stage === 'choose' && (
        <>
          <p className="text-sm text-gray-700 font-medium mb-3">পেমেন্ট পদ্ধতি বেছে নিন:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => choose(m.id)}
                className={`group flex flex-col items-start gap-2 p-4 rounded-2xl border-2 bg-white text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${m.accent}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.iconBg}`}>
                  <m.Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{m.label}</p>
                  <p className="text-[11px] text-gray-500">{m.sub}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-6 flex items-start gap-2 text-xs text-gray-500 bg-stone-50 border border-stone-200 rounded-xl p-3">
            <ReceiptText className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#2d6a4f]" />
            <span>
              সম্পূর্ণ পেমেন্ট তথ্য সংরক্ষিত হবে এবং রসিদ ইমেইলে পাঠানো হবে। যে কোনো সমস্যায় কল করুন +88 01843 431743
            </span>
          </div>
        </>
      )}

      {(stage === 'detail' || stage === 'submitting') && selected && (
        <div>
          <button
            onClick={() => setStage('choose')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#2d6a4f] mb-5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            অন্য পদ্ধতি বেছে নিন
          </button>

          {(selected === 'bkash' || selected === 'nagad' || selected === 'rocket') && (
            <MobileBankingDetail
              method={selected}
              reference={reference}
              onReferenceChange={setReference}
              amountLabel={`৳ ${formattedFee}`}
            />
          )}
          {selected === 'bank' && (
            <BankDetail
              reference={reference}
              onReferenceChange={setReference}
              amountLabel={`৳ ${formattedFee}`}
            />
          )}
          {selected === 'online' && <OnlineDetail amountLabel={`৳ ${formattedFee}`} />}
          {selected === 'card' && <CardDetail />}
          {selected === 'cash' && <CashDetail amountLabel={`৳ ${formattedFee}`} />}

          {error && (
            <div className="mt-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={submitPayment}
            disabled={
              stage === 'submitting' ||
              ((selected === 'bkash' || selected === 'nagad' || selected === 'rocket' || selected === 'bank') &&
                reference.trim().length < 4)
            }
            className="mt-6 w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full bg-gradient-to-r from-[#2d6a4f] to-[#1b4332] text-white font-bold text-base shadow-md hover:shadow-lg disabled:opacity-60 transition-shadow"
          >
            {stage === 'submitting' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {selected === 'online' ? 'পেমেন্ট পেজে নিয়ে যাওয়া হচ্ছে…' : 'রেকর্ড করা হচ্ছে…'}
              </>
            ) : selected === 'online' ? (
              <>
                <Globe className="w-5 h-5" />
                Pay ৳{formattedFee} online
              </>
            ) : selected === 'card' ? (
              <>
                <CreditCard className="w-5 h-5" />
                Continue to secure payment
              </>
            ) : selected === 'cash' ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Confirm cash on office
              </>
            ) : (
              <>
                <Banknote className="w-5 h-5" />
                পেমেন্ট তথ্য জমা দিন
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function MobileBankingDetail({
  method,
  reference,
  onReferenceChange,
  amountLabel,
}: {
  method: 'bkash' | 'nagad' | 'rocket';
  reference: string;
  onReferenceChange: (v: string) => void;
  amountLabel: string;
}) {
  const meta = MOBILE_INSTRUCTIONS[method];
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-stone-50 to-white border border-stone-200 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {method.toUpperCase()} {meta.type}
        </p>
        <div className="mt-1 flex items-center gap-3">
          <p className="text-2xl font-extrabold text-gray-900 tracking-wider">{meta.number}</p>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(meta.number)}
            className="text-xs px-2 py-1 rounded-md bg-[#2d6a4f] text-white font-semibold hover:bg-[#1b4332]"
          >
            Copy
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Amount: <span className="font-bold text-gray-900">{amountLabel}</span>
        </p>
      </div>

      <ol className="space-y-1.5 text-sm text-gray-700">
        {meta.steps.map((s, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#2d6a4f] text-white text-[11px] font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ol>

      <div>
        <label htmlFor="trxId" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Transaction ID (TrxID) *
        </label>
        <input
          id="trxId"
          value={reference}
          onChange={(e) => onReferenceChange(e.target.value)}
          placeholder="e.g. 8A4F7K2P"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none font-mono tracking-wide"
        />
      </div>
    </div>
  );
}

function BankDetail({
  reference,
  onReferenceChange,
  amountLabel,
}: {
  reference: string;
  onReferenceChange: (v: string) => void;
  amountLabel: string;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-blue-50/60 to-white border border-blue-100 p-5 space-y-1.5 text-sm">
        <Row label="Bank" value={BANK_DETAILS.bank} />
        <Row label="Branch" value={BANK_DETAILS.branch} />
        <Row label="Account name" value={BANK_DETAILS.account} />
        <Row label="Account number" value={BANK_DETAILS.number} bold />
        <Row label="Routing" value={BANK_DETAILS.routing} />
        <Row label="Amount" value={amountLabel} bold />
      </div>
      <p className="text-xs text-gray-500">
        Use your name + mobile number as the deposit reference. Send a photo of the slip to our WhatsApp for fast verification.
      </p>
      <div>
        <label htmlFor="depositRef" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Deposit reference / slip number *
        </label>
        <input
          id="depositRef"
          value={reference}
          onChange={(e) => onReferenceChange(e.target.value)}
          placeholder="e.g. IBBL-DPS-92034"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none"
        />
      </div>
    </div>
  );
}

function OnlineDetail({ amountLabel }: { amountLabel: string }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-white border border-teal-200 p-5">
        <p className="text-sm font-semibold text-teal-800">
          Secure online payment
        </p>
        <p className="mt-1 text-xs text-teal-700/80">
          bKash, Nagad, Rocket, Visa/Mastercard — সব এক পেজে। Continue করলে সিকিউর পেমেন্ট পেজে যাবেন।
        </p>
        <p className="mt-3 text-sm text-gray-700">
          Amount: <span className="font-bold text-gray-900">{amountLabel}</span>
        </p>
      </div>
      <p className="text-xs text-gray-500">
        🔒 আপনার পেমেন্ট তথ্য Athar Nur Travels সংরক্ষণ করে না — সম্পূর্ণ লেনদেন একটি সিকিউর পেমেন্ট গেটওয়েতে হয়। পেমেন্ট সফল হলে বুকিং স্বয়ংক্রিয়ভাবে নিশ্চিত হবে।
      </p>
    </div>
  );
}

function CardDetail() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 p-5">
        <p className="text-sm font-semibold text-emerald-800">
          Secure card payment via SSLCommerz
        </p>
        <p className="mt-1 text-xs text-emerald-700/80">
          Visa, Mastercard, Amex, DBBL Nexus, bKash Wallet — সব সমর্থিত। Continue করলে SSLCommerz এ যাবে।
        </p>
      </div>
      <p className="text-xs text-gray-500">
        🔒 আপনার কার্ড তথ্য Athar Nur Travels সংরক্ষণ করে না — সম্পূর্ণ লেনদেন SSLCommerz এর সিকিউর গেটওয়েতে হয়।
      </p>
    </div>
  );
}

function CashDetail({ amountLabel }: { amountLabel: string }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-200 p-5 space-y-1.5 text-sm">
        <Row label="Office" value={OFFICE_DETAILS.address} />
        <Row label="Hours" value={OFFICE_DETAILS.hours} />
        <Row label="Phone" value={OFFICE_DETAILS.phone} bold />
        <Row label="Amount" value={amountLabel} bold />
      </div>
      <p className="text-xs text-gray-500">
        কল করে আসার সময় জানিয়ে নিন। অগ্রিম ৩ দিনের মধ্যে অফিসে এসে পেমেন্ট সম্পন্ন না করলে বুকিং বাতিল হতে পারে।
      </p>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 border-b border-stone-100 last:border-0">
      <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{value}</span>
    </div>
  );
}
