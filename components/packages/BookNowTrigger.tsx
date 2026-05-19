'use client';

import { useState } from 'react';
import { CreditCard, Sparkles } from 'lucide-react';
import BookNowModal from './BookNowModal';
import { PRE_BOOKING_FEE_BDT } from '@/components/payment/BookingPaymentStep';

interface BookNowTriggerProps {
  packageTitle: string;
  packageId: string;
  category: 'hajj' | 'umrah' | 'tour' | 'air-ticketing' | 'general';
  packagePrice: number;
  packageDuration: string;
  locale?: string;
  /** "primary" = big gradient pill, "compact" = small inline pill */
  variant?: 'primary' | 'compact';
  className?: string;
}

export default function BookNowTrigger({
  packageTitle,
  packageId,
  category,
  packagePrice,
  packageDuration,
  locale,
  variant = 'primary',
  className,
}: BookNowTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === 'primary' ? (
        <button
          onClick={() => setOpen(true)}
          className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-[#1b4332] font-extrabold text-base shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all ${className ?? ''}`}
        >
          <Sparkles className="w-4 h-4" />
          Book Now · ৳{PRE_BOOKING_FEE_BDT.toLocaleString('en-IN')} pre-booking
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-400 hover:bg-amber-500 text-[#1b4332] text-xs font-extrabold shadow-sm transition-colors ${className ?? ''}`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          Book Now
        </button>
      )}

      <BookNowModal
        open={open}
        onClose={() => setOpen(false)}
        packageTitle={packageTitle}
        packageId={packageId}
        category={category}
        packagePrice={packagePrice}
        packageDuration={packageDuration}
        locale={locale}
      />
    </>
  );
}
