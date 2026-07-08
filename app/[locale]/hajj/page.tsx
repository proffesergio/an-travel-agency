import { setRequestLocale } from 'next-intl/server';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PackageCard from '@/components/packages/PackageCard';
import { getDisplayPackagesByCategory } from '@/lib/data/packages';
import { Moon } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HajjPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isBn = locale === 'bn';
  const packages = await getDisplayPackagesByCategory('hajj');

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <div className="bg-[#1b4332] text-white py-16 px-4">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#2d6a4f] flex items-center justify-center">
              <Moon className="w-7 h-7 text-[#74c69d]" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">
                {isBn ? 'হজ্জ প্যাকেজ ২০২৫' : 'Hajj Packages 2025'}
              </h1>
              <p className="text-green-200 mt-1">
                {isBn
                  ? 'সরকার অনুমোদিত হজ্জ প্যাকেজ — সম্পূর্ণ সহায়তাসহ'
                  : 'Government-approved packages with complete support — flights, hotels, visa & guidance'}
              </p>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-amber-50 border-b border-amber-200 py-3 px-4 text-center text-sm text-amber-800">
          <strong>Important:</strong> Hajj 2025 registrations are now open. Limited seats available.
          Call <a href="tel:+8801843431743" className="font-bold underline">+88 01843 431743</a> to register.
        </div>

        {/* Packages */}
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

        {/* Why book with us */}
        <section className="py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Why Book Your Hajj with Athar Nur Travels?
            </h2>
            <p className="text-gray-600 mb-8">
              We have been serving Bangladeshi pilgrims for over 15 years with government-approved packages,
              dedicated Mutawwif support, and transparent pricing.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { label: 'ATAB Registered', icon: '✅' },
                { label: 'Govt. Approved', icon: '🏛️' },
                { label: '5000+ Pilgrims', icon: '🕋' },
                { label: '24/7 Support', icon: '📞' },
              ].map((item) => (
                <div key={item.label} className="bg-green-50 rounded-xl p-4">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <div className="text-sm font-semibold text-[#2d6a4f]">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
