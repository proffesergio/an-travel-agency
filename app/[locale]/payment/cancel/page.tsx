import Link from 'next/link';
import { XCircle, Phone } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PaymentCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ enquiry?: string }>;
}) {
  const { enquiry } = await searchParams;

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-stone-200 shadow-sm p-8 sm:p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
          <XCircle className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          পেমেন্ট বাতিল করা হয়েছে
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">
          আপনার পেমেন্ট সম্পন্ন হয়নি বা বাতিল হয়েছে। আপনার বুকিংটি এখনও সংরক্ষিত আছে — আবার চেষ্টা
          করতে পারেন অথবা অন্য পেমেন্ট পদ্ধতি বেছে নিতে আমাদের কল করুন।
        </p>
        {enquiry && (
          <p className="mt-4 text-sm text-gray-500">
            Booking ID:{' '}
            <span className="font-mono font-semibold text-gray-900">
              {enquiry.slice(-8).toUpperCase()}
            </span>
          </p>
        )}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#2d6a4f] text-white text-sm font-semibold hover:bg-[#1b4332] transition-colors"
          >
            হোমে ফিরে যান
          </Link>
          <a
            href="tel:+8801843431743"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-stone-300 text-gray-700 text-sm font-semibold hover:bg-stone-50 transition-colors"
          >
            <Phone className="w-4 h-4" />
            +88 01843 431743
          </a>
        </div>
      </div>
    </main>
  );
}
