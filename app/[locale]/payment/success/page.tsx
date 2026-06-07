import Link from 'next/link';
import { CheckCircle2, Clock, Phone } from 'lucide-react';
import { connectDB } from '@/lib/mongodb';
import Enquiry from '@/models/Enquiry';

export const dynamic = 'force-dynamic';

async function getStatus(enquiryId?: string): Promise<'paid' | 'pending' | 'unknown'> {
  if (!enquiryId) return 'unknown';
  try {
    await connectDB();
    const enquiry = await Enquiry.findById(enquiryId).select('paymentStatus').lean();
    if (!enquiry) return 'unknown';
    return enquiry.paymentStatus === 'paid' ? 'paid' : 'pending';
  } catch {
    return 'unknown';
  }
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ enquiry?: string }>;
}) {
  const { enquiry } = await searchParams;
  const status = await getStatus(enquiry);
  const confirmed = status === 'paid';

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-stone-200 shadow-sm p-8 sm:p-12 text-center">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${
            confirmed ? 'bg-green-100' : 'bg-amber-100'
          }`}
        >
          {confirmed ? (
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          ) : (
            <Clock className="w-10 h-10 text-amber-600" />
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          {confirmed ? 'আলহামদুলিল্লাহ! পেমেন্ট সম্পন্ন হয়েছে' : 'পেমেন্ট নিশ্চিত করা হচ্ছে'}
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">
          {confirmed
            ? 'আপনার পেমেন্ট সফলভাবে গ্রহণ করা হয়েছে। আমাদের টিম শীঘ্রই বুকিং নিশ্চিত করে যোগাযোগ করবে।'
            : 'আপনার পেমেন্ট প্রসেস হচ্ছে। নিশ্চিত হতে কয়েক মিনিট সময় লাগতে পারে — কনফার্মেশন ইমেইল/কলের জন্য অপেক্ষা করুন।'}
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
