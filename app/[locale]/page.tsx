import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import ServicesSection from '@/components/home/ServicesSection';
import FeaturedPackages from '@/components/home/FeaturedPackages';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import StatsSection from '@/components/home/StatsSection';
import CtaBanner from '@/components/home/CtaBanner';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <HeroSection locale={locale} />
        <ServicesSection locale={locale} />
        <FeaturedPackages locale={locale} />
        <WhyChooseUs />
        <StatsSection />
        <CtaBanner />
      </main>
      <Footer locale={locale} />
    </>
  );
}
