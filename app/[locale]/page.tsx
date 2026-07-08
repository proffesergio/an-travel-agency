import { setRequestLocale } from 'next-intl/server';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import HomePackageSections from '@/components/home/HomePackageSections';
import HotelSearchTeaser from '@/components/home/HotelSearchTeaser';
import Hajj2027Banner from '@/components/home/Hajj2027Banner';
import ServicesSection from '@/components/home/ServicesSection';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import StatsSection from '@/components/home/StatsSection';
import CtaBanner from '@/components/home/CtaBanner';

// Render live so packages/hotels created in the admin panel appear immediately.
export const dynamic = 'force-dynamic';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <HeroSection locale={locale} />
        <HomePackageSections locale={locale} />
        <HotelSearchTeaser locale={locale} />
        <Hajj2027Banner locale={locale} />
        <ServicesSection locale={locale} />
        <WhyChooseUs />
        <StatsSection />
        <CtaBanner />
      </main>
      <Footer locale={locale} />
    </>
  );
}
