'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import GravityField from './GravityField';

export default function HeroSection({ locale }: { locale: string }) {
  const t = useTranslations('hero');

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#0f2d23]">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/hajj-hero.jpg')" }}
      />
      {/* Dark green gradient overlay — matches brand */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1b4332]/95 via-[#2d6a4f]/80 to-[#1b4332]/30" />

      {/* Gravitational background animation */}
      <GravityField intensity="normal" />

      {/* Decorative bottom curve */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 80H1440V40C1200 80 960 0 720 20C480 40 240 80 0 40V80Z" fill="white" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-10 xl:px-14 py-24">
        <div className="max-w-2xl">
          {/* Bangla motto — site tagline */}
          <p
            lang="bn"
            className="mb-4 text-base sm:text-lg font-semibold text-[#f4a261] tracking-wide drop-shadow-sm"
          >
            📝 ইবাদত আপনার · সেবা আমাদের
          </p>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#74c69d]/20 border border-[#74c69d]/40 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#74c69d] animate-pulse" />
            <span className="text-[#74c69d] text-sm font-medium">{t('badge')}</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            {t('headline')}
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-green-100 leading-relaxed mb-10 max-w-xl">
            {t('subheadline')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={`/${locale}/hajj`}
              className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#f4a261] text-white font-bold text-base shadow-lg transition-all duration-300 hover:bg-[#e8894a] hover:shadow-2xl hover:-translate-y-0.5 active:scale-95"
            >
              {t('ctaPackages')}
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold text-base transition-all duration-300 hover:bg-white/20 hover:border-white/60 hover:-translate-y-0.5 active:scale-95"
            >
              {t('ctaContact')}
            </Link>
          </div>
        </div>
      </div>

      {/* Floating stats card */}
      <div className="absolute bottom-16 right-8 hidden xl:block">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-white">
          <div className="grid grid-cols-2 gap-4 text-center">
            {[
              { value: '5000+', label: 'Pilgrims' },
              { value: '15+', label: 'Years' },
              { value: '20+', label: 'Destinations' },
              { value: '24/7', label: 'Support' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-[#74c69d]">{stat.value}</div>
                <div className="text-xs text-green-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
