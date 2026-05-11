import { useTranslations } from 'next-intl';
import { ShieldCheck, HeadphonesIcon, BadgeDollarSign, Award } from 'lucide-react';

const REASONS = [
  { key: 'licensed', icon: ShieldCheck },
  { key: 'support', icon: HeadphonesIcon },
  { key: 'affordable', icon: BadgeDollarSign },
  { key: 'experienced', icon: Award },
];

export default function WhyChooseUs() {
  const t = useTranslations('whyUs');

  return (
    <section className="py-20 bg-[#1b4332]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-[#74c69d] text-sm font-semibold uppercase tracking-widest">
            Why Us
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">
            {t('title')}
          </h2>
          <p className="mt-3 text-green-200 text-base max-w-xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {REASONS.map(({ key, icon: Icon }) => (
            <div
              key={key}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#2d6a4f] mb-4">
                <Icon className="w-7 h-7 text-[#74c69d]" />
              </div>
              <h3 className="font-bold text-white text-lg mb-2">
                {t(`${key}.title`)}
              </h3>
              <p className="text-green-200 text-sm leading-relaxed">
                {t(`${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
