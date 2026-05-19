'use client';

import BookingPaymentStep from '@/components/payment/BookingPaymentStep';

interface Hajj2027PaymentStepProps {
  enquiryId: string;
  customerName?: string;
  onReset: () => void;
}

export default function Hajj2027PaymentStep({
  enquiryId,
  customerName,
  onReset,
}: Hajj2027PaymentStepProps) {
  return (
    <BookingPaymentStep
      enquiryId={enquiryId}
      customerName={customerName}
      bookingLabel="Hajj 2027"
      stepLabel="Step 3 · Booking Fee"
      subtitle="Hajj 2027 বুকিং নিশ্চিত করতে অগ্রিম ৳ 30,000 জমা দিন"
      resetLabel="নতুন নিবন্ধন করুন"
      onReset={onReset}
    />
  );
}
