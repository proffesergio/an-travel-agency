import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { getFeaturedPackages } from '@/lib/seed-data';
import PackageCard from '@/components/packages/PackageCard';

export default function FeaturedPackages({ locale }: { locale: string }) {
  const t = useTranslations('featured');
  const isBn = locale === 'bn';
  const packages = getFeaturedPackages();

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-[#2d6a4f] text-sm font-semibold uppercase tracking-widest">
              {t('title')}
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">
              {t('subtitle')}
            </h2>
          </div>
          <Link
            href={`/${locale}/hajj`}
            className="hidden sm:flex items-center gap-1 text-[#2d6a4f] font-semibold text-sm hover:underline"
          >
            {t('viewAll')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              slug={pkg.slug}
              category={pkg.category}
              title={isBn ? pkg.titleBn : pkg.title}
              price={pkg.price}
              duration={isBn ? pkg.durationBn : pkg.duration}
              imageUrl={pkg.imageUrl}
              inclusions={pkg.inclusions}
              locale={locale}
            />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href={`/${locale}/hajj`}
            className="inline-flex items-center gap-1 text-[#2d6a4f] font-semibold"
          >
            {t('viewAll')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
