'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, MoonStar, Plane, PlaneTakeoff, Ticket } from 'lucide-react';
import PackageCard from '@/components/packages/PackageCard';

const ICONS = {
  moon: MoonStar,
  plane: Plane,
  planeTakeoff: PlaneTakeoff,
  ticket: Ticket,
} as const;
export type CarouselIconKey = keyof typeof ICONS;

type CarouselPackage = {
  id: string;
  slug: string;
  category: 'hajj' | 'umrah' | 'tour';
  title: string;
  titleBn: string;
  price: number;
  duration: string;
  durationBn: string;
  imageUrl: string;
  inclusions: string[];
};

interface PackageCarouselProps {
  locale: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  viewAllHref: string;
  viewAllLabel: string;
  packages: CarouselPackage[];
  accent?: 'green' | 'teal' | 'blue' | 'amber';
  iconKey?: CarouselIconKey;
  background?: 'white' | 'stone' | 'gradient';
}

const ACCENT_CLASSES: Record<string, { eyebrow: string; ringSoft: string; iconBg: string }> = {
  green: { eyebrow: 'text-[#2d6a4f]', ringSoft: 'ring-[#2d6a4f]/10', iconBg: 'bg-emerald-100 text-emerald-700' },
  teal: { eyebrow: 'text-teal-700', ringSoft: 'ring-teal-500/10', iconBg: 'bg-teal-100 text-teal-700' },
  blue: { eyebrow: 'text-blue-700', ringSoft: 'ring-blue-500/10', iconBg: 'bg-blue-100 text-blue-700' },
  amber: { eyebrow: 'text-amber-700', ringSoft: 'ring-amber-500/10', iconBg: 'bg-amber-100 text-amber-700' },
};

const BG_CLASSES: Record<string, string> = {
  white: 'bg-white',
  stone: 'bg-gradient-to-b from-stone-50 to-white',
  gradient: 'bg-gradient-to-br from-green-50/60 via-white to-stone-50',
};

export default function PackageCarousel({
  locale,
  eyebrow,
  title,
  subtitle,
  viewAllHref,
  viewAllLabel,
  packages,
  accent = 'green',
  iconKey,
  background = 'white',
}: PackageCarouselProps) {
  const Icon = iconKey ? ICONS[iconKey] : null;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isBn = locale === 'bn';
  const a = ACCENT_CLASSES[accent];

  const updateScrollState = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [packages.length]);

  const scrollBy = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-carousel-item]');
    const step = card ? card.offsetWidth + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: step * direction, behavior: 'smooth' });
  };

  if (packages.length === 0) return null;

  return (
    <section className={`relative py-16 sm:py-20 ${BG_CLASSES[background]}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 gap-4">
          <div className="flex items-start gap-4">
            {Icon && (
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${a.iconBg} shadow-sm`}>
                <Icon className="w-6 h-6" />
              </div>
            )}
            <div>
              <p className={`text-xs font-bold tracking-widest uppercase ${a.eyebrow}`}>
                {eyebrow}
              </p>
              <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-2 text-gray-600 max-w-2xl text-sm sm:text-base">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => scrollBy(-1)}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className="w-10 h-10 rounded-full border border-gray-200 bg-white text-gray-600 flex items-center justify-center hover:border-[#2d6a4f] hover:text-[#2d6a4f] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollBy(1)}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              className="w-10 h-10 rounded-full border border-gray-200 bg-white text-gray-600 flex items-center justify-center hover:border-[#2d6a4f] hover:text-[#2d6a4f] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <Link
              href={viewAllHref}
              className="hidden sm:inline-flex items-center gap-1 ml-2 text-[#2d6a4f] font-semibold text-sm hover:underline"
            >
              {viewAllLabel} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="relative -mx-4 sm:mx-0">
          <div
            ref={scrollerRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4 px-4 sm:px-0 sm:pl-0 scroll-smooth"
          >
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                data-carousel-item
                className="snap-start flex-shrink-0 w-[85%] sm:w-[48%] lg:w-[32%] xl:w-[31%]"
              >
                <PackageCard
                  slug={pkg.slug}
                  category={pkg.category}
                  title={isBn ? pkg.titleBn : pkg.title}
                  price={pkg.price}
                  duration={isBn ? pkg.durationBn : pkg.duration}
                  imageUrl={pkg.imageUrl}
                  inclusions={pkg.inclusions}
                  locale={locale}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 sm:hidden text-center">
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 text-[#2d6a4f] font-semibold text-sm"
          >
            {viewAllLabel} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
