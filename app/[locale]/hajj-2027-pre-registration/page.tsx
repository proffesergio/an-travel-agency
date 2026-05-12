import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Compass,
  IdCard,
  MapPin,
  PhoneCall,
  Smartphone,
  Sparkles,
  Star,
} from 'lucide-react';
import {
  HAJJ_2027_PRIMARY_PHONE,
  HAJJ_2027_PRIMARY_WHATSAPP,
  HAJJ_2027_WHATSAPP_MESSAGE,
  HAJJ_SERVICES,
  MADINAH_SITES,
  MAKKAH_SITES,
  OFFICES,
} from '@/lib/hajj2027-content';
import { buildWhatsAppLink } from '@/lib/whatsapp';

export const metadata: Metadata = {
  title: 'হজ্ব ২০২৭ প্রাক নিবন্ধন · Athar Nur Travels',
  description:
    'আতহার নূর ট্রাভেলস — ২০২৭ সালের হজ্বের প্রাক নিবন্ধন চলছে। হজ্ব ভিসা, এয়ার টিকেট, হোটেল, খাবার, গাইড, জিয়ারা ও পূর্ণ সেবা।',
  openGraph: {
    title: 'হজ্ব ২০২৭ প্রাক নিবন্ধন',
    description: 'ইবাদত আপনার, সেবা আমাদের। ২০২৭ সালের হজ্বের প্রাক নিবন্ধন চলছে।',
  },
};

const MARQUEE_ITEMS = [
  '২০২৭ সালে হজ্বের প্রাক নিবন্ধন চলছে',
  'ইবাদত আপনার, সেবা আমাদের',
  'অভিজ্ঞ আলেম ও গাইড সাথে',
  'মক্কা–মদিনায় নিকটতম হোটেল',
  'মিনা–আরাফায় দেশীয় খাবার',
];

const REQUIREMENTS = [
  {
    icon: IdCard,
    title: 'জাতীয় পরিচয় পত্র / পাসপোর্ট',
    subtitle: 'National ID or Passport copy',
  },
  {
    icon: Smartphone,
    title: 'মোবাইল নাম্বার',
    subtitle: 'Active mobile number',
  },
];

export default async function Hajj2027Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const whatsappLink = buildWhatsAppLink(HAJJ_2027_PRIMARY_WHATSAPP, HAJJ_2027_WHATSAPP_MESSAGE);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-stone-50">
        {/* ============================================================ */}
        {/* HERO                                                          */}
        {/* ============================================================ */}
        <section className="relative overflow-hidden bg-arabesque text-white">
          {/* Decorative twinkles */}
          <div className="absolute inset-0 pointer-events-none">
            <Star className="absolute top-12 left-[10%] w-3 h-3 text-amber-300/70 animate-twinkle" style={{ animationDelay: '0s' }} />
            <Star className="absolute top-24 right-[15%] w-4 h-4 text-amber-200/80 animate-twinkle" style={{ animationDelay: '0.6s' }} />
            <Star className="absolute bottom-32 left-[20%] w-2 h-2 text-amber-300/60 animate-twinkle" style={{ animationDelay: '1.2s' }} />
            <Star className="absolute bottom-20 right-[12%] w-3 h-3 text-amber-200/70 animate-twinkle" style={{ animationDelay: '1.8s' }} />
            <Sparkles className="absolute top-40 left-[45%] w-5 h-5 text-amber-200/50 animate-float-slow" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28 relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left column */}
              <div className="lg:col-span-7 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-400/20 border border-amber-300/40 rounded-full text-amber-100 text-sm font-medium backdrop-blur-sm mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300" />
                  </span>
                  প্রাক নিবন্ধন চলছে
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                  <span className="block text-white/90">হজ্ব ২০২৭</span>
                  <span className="block shimmer-text">প্রাক নিবন্ধন</span>
                </h1>

                <p className="mt-6 text-lg sm:text-xl text-green-100/90 font-medium max-w-2xl">
                  📝 ইবাদত আপনার <span className="text-amber-300">·</span> সেবা আমাদের
                </p>
                <p className="mt-4 text-base text-green-100/80 max-w-2xl">
                  আপনি আজই আপনার হজ্বের প্রাক নিবন্ধন নিশ্চিত করুন। অভিজ্ঞ আলেম, গাইড, সম্পূর্ণ
                  ব্যবস্থাপনা — এক ছাদের নিচে।
                </p>

                <div className="mt-10 flex flex-wrap gap-4">
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-[#25D366] hover:bg-[#1da851] text-white font-semibold shadow-lg animate-glow-pulse transition-transform hover:scale-105"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
                    </svg>
                    WhatsApp এ যোগাযোগ
                  </a>
                  <a
                    href={`tel:${HAJJ_2027_PRIMARY_PHONE}`}
                    className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold transition-all hover:scale-105"
                  >
                    <PhoneCall className="w-5 h-5" />
                    এখনই কল করুন
                  </a>
                </div>

                <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-green-100/80 text-sm">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-300" /> অভিজ্ঞ আলেমের তত্ত্বাবধান
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-300" /> সরকার অনুমোদিত
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-300" /> ১৭+ সেবা অন্তর্ভুক্ত
                  </span>
                </div>
              </div>

              {/* Right column: animated year card */}
              <div className="lg:col-span-5 flex justify-center lg:justify-end">
                <div className="relative animate-float-slow">
                  <div className="absolute inset-0 bg-amber-400/30 blur-3xl rounded-full" />
                  <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 flex items-center justify-center shadow-2xl ring-8 ring-white/10">
                    <div className="text-center text-[#1b4332]">
                      <p className="text-sm font-semibold tracking-widest uppercase opacity-80">Hajj</p>
                      <p className="text-7xl sm:text-8xl font-black tracking-tight leading-none mt-1">2027</p>
                      <p className="text-base font-bold tracking-wider mt-2">প্রাক নিবন্ধন</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wave divider */}
          <svg
            viewBox="0 0 1440 80"
            className="block w-full h-12 sm:h-16 text-stone-50"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path fill="currentColor" d="M0,32L60,37.3C120,43,240,53,360,53.3C480,53,600,43,720,40C840,37,960,43,1080,48C1200,53,1320,59,1380,61.3L1440,64L1440,80L0,80Z" />
          </svg>
        </section>

        {/* ============================================================ */}
        {/* MARQUEE                                                       */}
        {/* ============================================================ */}
        <section className="bg-[#2d6a4f] text-white py-3 overflow-hidden border-y border-[#1b4332]">
          <div className="flex whitespace-nowrap animate-marquee">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span key={i} className="flex items-center gap-4 px-8 text-sm sm:text-base font-medium">
                <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0" />
                {item}
              </span>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* REQUIREMENTS                                                  */}
        {/* ============================================================ */}
        <section className="py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <p className="text-sm font-semibold text-[#2d6a4f] tracking-widest uppercase">Step 1</p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">
                প্রাক নিবন্ধনের জন্য প্রয়োজন
              </h2>
              <p className="mt-3 text-gray-600">মাত্র দুটি জিনিস — শুরু হয়ে যাক আপনার হজ্বের যাত্রা</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {REQUIREMENTS.map((req, i) => {
                const Icon = req.icon;
                return (
                  <div
                    key={req.title}
                    className="group bg-white rounded-2xl border border-stone-200 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${i * 120}ms`, animationFillMode: 'backwards' }}
                  >
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2d6a4f] to-[#1b4332] text-white shadow-md group-hover:scale-110 transition-transform">
                      <Icon className="w-7 h-7" />
                    </div>
                    <div className="mt-5">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        <span className="text-[#2d6a4f] mr-2">০{i + 1}.</span>
                        {req.title}
                      </div>
                      <p className="text-sm text-gray-500">{req.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SERVICES                                                      */}
        {/* ============================================================ */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-[#2d6a4f] tracking-widest uppercase">What's Included</p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">আমাদের সেবা সমূহ</h2>
              <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
                ভিসা থেকে জিয়ারা পর্যন্ত — সম্পূর্ণ প্যাকেজে আপনি যা পাচ্ছেন
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {HAJJ_SERVICES.map((service, i) => {
                const Icon = service.icon;
                return (
                  <div
                    key={service.title}
                    className="group relative bg-white rounded-2xl border-2 border-stone-100 p-6 hover:border-[#74c69d] hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
                    style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}
                  >
                    {service.note && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold tracking-wide">
                        {service.note}
                      </span>
                    )}
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-green-100 text-[#2d6a4f] group-hover:from-[#2d6a4f] group-hover:to-[#1b4332] group-hover:text-white transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-gray-900 leading-snug">
                      {service.title}
                    </h3>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SACRED SITES                                                  */}
        {/* ============================================================ */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-stone-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-amber-600 tracking-widest uppercase">
                Sacred Visits
              </p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">
                ঐতিহাসিক স্থান জিয়ারা
              </h2>
              <p className="mt-3 text-gray-600">প্যাকেজের সাথে অন্তর্ভুক্ত — মক্কা ও মদিনার পবিত্র স্থানসমূহ</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Makkah */}
              <div className="relative bg-white rounded-3xl border border-stone-200 p-8 shadow-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-100/40 rounded-full -translate-y-20 translate-x-20 blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-md">
                      <Compass className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-amber-700 tracking-wider uppercase">Makkah</p>
                      <h3 className="text-2xl font-bold text-gray-900">মক্কায় ঐতিহাসিক স্থান</h3>
                    </div>
                  </div>
                  <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                    {MAKKAH_SITES.map((site, i) => (
                      <li key={site} className="flex items-start gap-3 text-sm text-gray-700">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-50 text-amber-700 font-bold flex items-center justify-center text-[11px] mt-0.5">
                          {i + 1}
                        </span>
                        <span>{site}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Madinah */}
              <div className="relative bg-white rounded-3xl border border-stone-200 p-8 shadow-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-green-100/40 rounded-full -translate-y-20 translate-x-20 blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#74c69d] to-[#2d6a4f] flex items-center justify-center text-white shadow-md">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#2d6a4f] tracking-wider uppercase">Madinah</p>
                      <h3 className="text-2xl font-bold text-gray-900">মদিনায় ঐতিহাসিক স্থান</h3>
                    </div>
                  </div>
                  <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                    {MADINAH_SITES.map((site, i) => (
                      <li key={site} className="flex items-start gap-3 text-sm text-gray-700">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-50 text-[#2d6a4f] font-bold flex items-center justify-center text-[11px] mt-0.5">
                          {i + 1}
                        </span>
                        <span>{site}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* PRE-REGISTER CTA                                              */}
        {/* ============================================================ */}
        <section className="py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-arabesque text-white p-10 sm:p-14 text-center shadow-2xl">
              <div className="absolute inset-0 pointer-events-none">
                <Sparkles className="absolute top-8 left-10 w-6 h-6 text-amber-300/60 animate-float-slow" />
                <Sparkles className="absolute bottom-10 right-12 w-5 h-5 text-amber-300/60 animate-float-slow" style={{ animationDelay: '1s' }} />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold">এখনই প্রাক নিবন্ধন করুন</h2>
              <p className="mt-4 text-green-100/90 max-w-2xl mx-auto">
                আপনার তথ্য পাঠান, আমাদের প্রতিনিধি আপনার সাথে যোগাযোগ করবেন।
                ১০০% নিরাপদ ও বিশ্বস্ত হজ্ব ব্যবস্থাপনা।
              </p>
              <div className="mt-8 flex flex-wrap gap-4 justify-center">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-[#25D366] hover:bg-[#1da851] text-white font-semibold shadow-lg transition-transform hover:scale-105"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                  </svg>
                  WhatsApp এ মেসেজ দিন
                </a>
                <a
                  href={`tel:${HAJJ_2027_PRIMARY_PHONE}`}
                  className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-amber-400 hover:bg-amber-500 text-[#1b4332] font-semibold shadow-lg transition-transform hover:scale-105"
                >
                  <PhoneCall className="w-5 h-5" />
                  কল করুন
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* CONTACT / OFFICES                                             */}
        {/* ============================================================ */}
        <section className="py-16 sm:py-20 bg-white border-t border-stone-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-[#2d6a4f] tracking-widest uppercase">Contact</p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">যোগাযোগ</h2>
            </div>

            <div className="bg-gradient-to-br from-stone-50 to-white rounded-3xl border border-stone-200 p-6 sm:p-10 mb-10 flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
              <Image
                src="/ATHAR-NUR-Logo.png"
                alt="Athar Nur Travels"
                width={200}
                height={70}
                className="h-16 w-auto"
              />
              <div className="flex-1 text-center lg:text-left">
                <p className="text-sm font-medium text-[#2d6a4f]">নিউ আল নুর হজ্ব কাফেলা টুরস এন্ড ট্রাভেলস</p>
                <p className="text-lg font-bold text-gray-900">আতহার নূর ট্রাভেলস</p>
                <p className="mt-2 text-sm text-gray-600 flex items-center justify-center lg:justify-start gap-2">
                  <Building2 className="w-4 h-4 text-[#2d6a4f]" />
                  ৫৫ আজাদ সেন্টার, পুরানা পল্টন, ঢাকা–১০০০
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {OFFICES.map((office, i) => (
                <div
                  key={office.label}
                  className={`relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-in fade-in ${
                    office.highlight
                      ? 'bg-gradient-to-br from-[#2d6a4f] to-[#1b4332] text-white shadow-md'
                      : 'bg-white border border-stone-200'
                  }`}
                  style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className={`w-4 h-4 ${office.highlight ? 'text-amber-300' : 'text-[#2d6a4f]'}`} />
                    <p
                      className={`text-xs font-semibold tracking-wider uppercase ${
                        office.highlight ? 'text-amber-300' : 'text-[#2d6a4f]'
                      }`}
                    >
                      {office.city}
                    </p>
                  </div>
                  <h3 className={`text-base font-bold mb-3 ${office.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {office.label}
                  </h3>
                  <div className="space-y-2">
                    {office.numbers.map((n) => (
                      <a
                        key={n}
                        href={`tel:${n.replace(/[^+\d]/g, '')}`}
                        className={`flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-80 ${
                          office.highlight ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        {n}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="#top"
                className="inline-flex items-center gap-2 text-sm text-[#2d6a4f] hover:text-[#1b4332] font-medium"
              >
                <ArrowRight className="w-4 h-4 rotate-[-90deg]" />
                উপরে ফিরে যান
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* MOBILE STICKY CTA                                             */}
        {/* ============================================================ */}
        <div className="fixed bottom-4 left-4 right-4 z-40 flex gap-3 sm:hidden">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-[#25D366] text-white text-sm font-semibold shadow-xl"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z" />
            </svg>
            WhatsApp
          </a>
          <a
            href={`tel:${HAJJ_2027_PRIMARY_PHONE}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-[#1b4332] text-white text-sm font-semibold shadow-xl"
          >
            <PhoneCall className="w-4 h-4" />
            কল করুন
          </a>
        </div>
      </main>
      <Footer locale={locale} />
    </>
  );
}
