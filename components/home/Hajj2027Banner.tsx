import Link from 'next/link';
import { ArrowRight, Sparkles, Star } from 'lucide-react';

export default function Hajj2027Banner({ locale }: { locale: string }) {
  return (
    <section className="relative py-10 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}/hajj-2027-pre-registration#register`}
          className="group relative block overflow-hidden rounded-3xl bg-arabesque text-white p-8 sm:p-12 shadow-xl hover:shadow-2xl transition-shadow"
        >
          {/* Decorative twinkles */}
          <Star
            className="absolute top-6 left-8 w-3 h-3 text-amber-300/70 animate-twinkle"
            style={{ animationDelay: '0s' }}
          />
          <Star
            className="absolute bottom-10 left-[18%] w-2 h-2 text-amber-300/60 animate-twinkle"
            style={{ animationDelay: '0.8s' }}
          />
          <Sparkles className="absolute top-1/2 left-[45%] w-5 h-5 text-amber-200/40 animate-float-slow -translate-y-1/2" />

          <div className="relative flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 border border-amber-300/40 rounded-full text-amber-100 text-xs font-medium backdrop-blur-sm mb-4">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-300" />
                </span>
                LIMITED TIME · প্রাক নিবন্ধন চলছে
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                <span className="block">হজ্ব ২০২৭</span>
                <span className="shimmer-text">প্রাক নিবন্ধন চলছে</span>
              </h2>
              <p className="mt-3 text-green-100/90 text-base sm:text-lg max-w-2xl">
                📝 ইবাদত আপনার · সেবা আমাদের। আজই আপনার আসন নিশ্চিত করুন।
              </p>
              <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-400 text-[#1b4332] font-semibold group-hover:bg-amber-300 transition-all group-hover:gap-3">
                বিস্তারিত দেখুন
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>

            <div className="flex-shrink-0 animate-float-slow">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-400/30 blur-3xl rounded-full" />
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 flex items-center justify-center shadow-2xl ring-4 ring-white/10">
                  <div className="text-center text-[#1b4332]">
                    <p className="text-[10px] font-semibold tracking-widest uppercase opacity-80">
                      Hajj
                    </p>
                    <p className="text-4xl sm:text-5xl font-black leading-none">2027</p>
                    <p className="text-[10px] font-bold tracking-wider mt-1">প্রাক নিবন্ধন</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
