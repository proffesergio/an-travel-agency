'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react';
import BookingPaymentStep, { PRE_BOOKING_FEE_BDT } from '@/components/payment/BookingPaymentStep';

interface BookNowModalProps {
  open: boolean;
  onClose: () => void;
  packageTitle: string;
  packageId: string;
  category: 'hajj' | 'umrah' | 'tour' | 'air-ticketing' | 'general';
  packagePrice: number;
  packageDuration: string;
  /** Optional, the user's locale for downstream copy */
  locale?: string;
}

interface FormState {
  name: string;
  phone: string;
  email: string;
  passengers: string;
  preferredDate: string;
  notes: string;
}

const EMPTY: FormState = {
  name: '',
  phone: '',
  email: '',
  passengers: '1',
  preferredDate: '',
  notes: '',
};

export default function BookNowModal({
  open,
  onClose,
  packageTitle,
  packageId,
  category,
  packagePrice,
  packageDuration,
}: BookNowModalProps) {
  const [stage, setStage] = useState<'info' | 'payment'>('info');
  const [form, setForm] = useState<FormState>(EMPTY);
  const [enquiryId, setEnquiryId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setStage('info');
      setForm(EMPTY);
      setEnquiryId('');
      setError('');
      setSubmitting(false);
      requestAnimationFrame(() => firstInputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const composedMessage = [
      `Pre-booking request for "${packageTitle}".`,
      form.preferredDate ? `Preferred date: ${form.preferredDate}` : null,
      form.notes ? `Notes: ${form.notes}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          category,
          packageId,
          packageTitle,
          passengers: Number(form.passengers) || 1,
          message: composedMessage,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? 'Could not create the booking. Please try again.');
        setSubmitting(false);
        return;
      }
      if (!json.enquiryId) {
        setError('Booking saved, but reference missing. Please call us at +88 01843 431743.');
        setSubmitting(false);
        return;
      }
      setEnquiryId(json.enquiryId);
      setStage('payment');
      setSubmitting(false);
    } catch {
      setError('Network error. Please check your connection and try again.');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booknow-title"
    >
      <div
        className="fixed inset-0 bg-gradient-to-br from-[#0b1d18]/85 via-[#0b1d18]/75 to-[#1b4332]/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative min-h-full flex items-start sm:items-center justify-center px-3 py-6 sm:py-10">
        <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 ring-1 ring-black/5">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#1b4332] px-6 sm:px-8 pt-7 pb-10 text-white overflow-hidden">
            <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-amber-300/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-emerald-300/15 blur-3xl pointer-events-none" />
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10 backdrop-blur-sm"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-[11px] uppercase tracking-widest text-amber-200/90 font-bold">
              {stage === 'info' ? 'Step 1 · Your details' : 'Step 2 · Confirm payment'}
            </p>
            <h2 id="booknow-title" className="mt-1 text-xl sm:text-2xl font-bold relative">
              {packageTitle}
            </h2>
            <p className="mt-2 text-sm text-green-100/85 relative">
              ৳{packagePrice.toLocaleString('en-IN')} per person · {packageDuration} · Pre-booking
              fee ৳{PRE_BOOKING_FEE_BDT.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="px-5 sm:px-8 py-6 sm:py-8">
            {stage === 'info' ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full name *" htmlFor="bn-name" Icon={UserIcon}>
                    <input
                      ref={firstInputRef}
                      id="bn-name"
                      required
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      placeholder="Mohammad Karim"
                      className="bn-input"
                      autoComplete="name"
                    />
                  </Field>
                  <Field
                    label="Mobile number *"
                    htmlFor="bn-phone"
                    Icon={Phone}
                    hint="11-digit BD mobile (01XXXXXXXXX)"
                  >
                    <input
                      id="bn-phone"
                      required
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="bn-input"
                      autoComplete="tel"
                    />
                  </Field>
                </div>

                <Field label="Email" htmlFor="bn-email" Icon={Mail} hint="Optional — for receipts">
                  <input
                    id="bn-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="you@example.com"
                    className="bn-input"
                    autoComplete="email"
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Passengers" htmlFor="bn-passengers" Icon={Users}>
                    <select
                      id="bn-passengers"
                      value={form.passengers}
                      onChange={(e) => update('passengers', e.target.value)}
                      className="bn-input bg-white appearance-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'passenger' : 'passengers'}
                        </option>
                      ))}
                      <option value="11">10+ (Group)</option>
                    </select>
                  </Field>
                  <Field
                    label="Preferred travel month"
                    htmlFor="bn-date"
                    Icon={CalendarClock}
                  >
                    <input
                      id="bn-date"
                      type="month"
                      value={form.preferredDate}
                      onChange={(e) => update('preferredDate', e.target.value)}
                      className="bn-input"
                    />
                  </Field>
                </div>

                <Field
                  label="Anything we should know?"
                  htmlFor="bn-notes"
                  Icon={MapPin}
                  hint="Special meals, group members, room preferences…"
                >
                  <textarea
                    id="bn-notes"
                    rows={3}
                    value={form.notes}
                    onChange={(e) => update('notes', e.target.value)}
                    className="bn-input resize-none"
                    placeholder="Optional"
                  />
                </Field>

                {error && (
                  <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-2 flex-col-reverse sm:flex-row">
                  <p className="text-xs text-gray-500 text-center sm:text-left">
                    Pre-booking is fully refundable within 7 days if cancelled in writing.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#2d6a4f] to-[#1b4332] text-white font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 transition-all"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Reserving your slot…
                      </>
                    ) : (
                      <>
                        Continue to payment
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Slot reserved for {form.name}. Complete the pre-booking fee to confirm.
                </div>
                <BookingPaymentStep
                  enquiryId={enquiryId}
                  customerName={form.name}
                  bookingLabel={packageTitle}
                  stepLabel="Step 2 · Pre-booking fee"
                  subtitle={`${packageTitle} বুকিং নিশ্চিত করতে অগ্রিম ৳ ${PRE_BOOKING_FEE_BDT.toLocaleString(
                    'en-IN'
                  )} জমা দিন`}
                  resetLabel="Close"
                  onReset={onClose}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        :global(.bn-input) {
          width: 100%;
          padding: 0.7rem 1rem 0.7rem 2.5rem;
          border: 1px solid rgb(226 232 226);
          border-radius: 0.75rem;
          font-size: 0.875rem;
          outline: none;
          transition: border 0.2s, box-shadow 0.2s, background 0.2s;
          background: #fbfdfb;
        }
        :global(.bn-input:focus) {
          border-color: #2d6a4f;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(45, 106, 79, 0.12);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  Icon,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  Icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
        {children}
      </div>
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}
