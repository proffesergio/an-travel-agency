import { setRequestLocale } from 'next-intl/server';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PackageCard from '@/components/packages/PackageCard';
import { getDisplayPackagesByCategory } from '@/lib/data/packages';

export const dynamic = 'force-dynamic';
import { Globe } from 'lucide-react';

export default async function ToursPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isBn = locale === 'bn';
  const isAr = locale === 'ar';
  const packages = await getDisplayPackagesByCategory('tour');

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="bg-[#1b4332] text-white py-16 px-4">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#2d6a4f] flex items-center justify-center">
              <Globe className="w-7 h-7 text-[#74c69d]" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">
                {isBn ? 'আন্তর্জাতিক ট্যুর' : isAr ? 'جولات دولية' : 'International Tours'}
              </h1>
              <p className="text-green-200 mt-1">
                {isBn
                  ? 'দুবাই, মালয়েশিয়া, থাইল্যান্ডসহ আরও অনেক গন্তব্যে কিউরেটেড ট্যুর'
                  : isAr
                    ? 'جولات مختارة إلى دبي وماليزيا وتايلاند وغيرها — باقات مع مرشد بالكامل'
                    : 'Curated tours to Dubai, Malaysia, Thailand and beyond — fully guided packages'}
              </p>
            </div>
          </div>
        </div>

        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
