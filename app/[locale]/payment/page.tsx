import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Hajj2027RegistrationForm from '@/components/home/Hajj2027RegistrationForm';
import { ShieldCheck, CreditCard, FileImage, Headset, Star, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'বুকিং ও পেমেন্ট · হজ্ব ২০২৭ · Athar Nur Travels',
  description:
    'হজ্ব ২০২৭ বুকিং সম্পন্ন করুন — তথ্য দিন, পাসপোর্ট/NID/ছবি আপলোড করুন এবং bKash, Nagad, Rocket, কার্ড বা অনলাইনে নিরাপদে পেমেন্ট করুন।',
};

const HIGHLIGHTS = [
  { icon: FileImage, title: 'ডকুমেন্ট আপলোড', sub: 'পাসপোর্ট · NID · ছবি' },
  { icon: CreditCard, title: 'সব পেমেন্ট অপশন', sub: 'bKash · Nagad · Card · Online' },
  { icon: ShieldCheck, title: '১০০% নিরাপদ', sub: 'এনক্রিপ্টেড ও বিশ্বস্ত' },
  { icon: Headset, title: '২৪/৭ সহায়তা', sub: '+88 01843 431743' },
];

export default async function PaymentBookingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex-1 bg-stone-50">
      {/* Hero */}
        <section className="relative overflow-hidden bg-arabesque text-white">
          <div className="absolute inset-0 pointer-events-none">
            <Star className="absolute top-10 left-[12%] w-3 h-3 text-amber-300/70 animate-twinkle" />
            <Star className="absolute top-20 right-[16%] w-4 h-4 text-amber-200/80 animate-twinkle" style={{ animationDelay: '0.6s' }} />
            <Sparkles className="absolute bottom-16 left-[40%] w-5 h-5 text-amber-200/50 animate-float-slow" />
          </div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 relative text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-400/20 border border-amber-300/40 rounded-full text-amber-100 text-sm font-medium backdrop-blur-sm mb-5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300" />
              </span>
              হজ্ব ২০২৭ · বুকিং নিশ্চিত করুন
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              <span className="block">বুকিং ও পেমেন্ট</span>
              <span className="block shimmer-text">এক ধাপেই সম্পূর্ণ করুন</span>
            </h1>
            <p className="mt-4 text-green-100/90 max-w-2xl mx-auto">
              তথ্য পূরণ করুন, প্রয়োজনীয় ডকুমেন্ট আপলোড করুন এবং আপনার পছন্দের পেমেন্ট পদ্ধতিতে
              অগ্রিম জমা দিয়ে হজ্বের যাত্রা নিশ্চিত করুন।
            </p>

            <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {HIGHLIGHTS.map((h) => (
                <div
                  key={h.title}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm p-4"
                >
                  <h.icon className="w-6 h-6 text-amber-300" />
                  <p className="text-sm font-semibold">{h.title}</p>
                  <p className="text-[11px] text-green-100/70">{h.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <svg
            viewBox="0 0 1440 80"
            className="block w-full h-12 sm:h-16 text-stone-50"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path fill="currentColor" d="M0,32L60,37.3C120,43,240,53,360,53.3C480,53,600,43,720,40C840,37,960,43,1080,48C1200,53,1320,59,1380,61.3L1440,64L1440,80L0,80Z" />
          </svg>
        </section>

        {/* Booking + payment flow */}
        <section className="py-12 sm:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-center gap-2 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#2d6a4f] text-white text-[11px] font-bold flex items-center justify-center">1</span>
                তথ্য
              </span>
              <span className="w-6 h-px bg-gray-300" />
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#2d6a4f] text-white text-[11px] font-bold flex items-center justify-center">2</span>
                ডকুমেন্ট
              </span>
              <span className="w-6 h-px bg-gray-300" />
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center">3</span>
                পেমেন্ট
              </span>
            </div>

            <Hajj2027RegistrationForm recommendPassport />
          </div>
      </section>
    </main>
  );
}
