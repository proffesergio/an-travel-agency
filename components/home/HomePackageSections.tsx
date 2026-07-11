import { getDisplayPackagesByCategory } from '@/lib/data/packages';
import PackageCarousel from './PackageCarousel';

export default async function HomePackageSections({ locale }: { locale: string }) {
  const isBn = locale === 'bn';
  const isAr = locale === 'ar';
  const [hajj, umrah, tours] = await Promise.all([
    getDisplayPackagesByCategory('hajj'),
    getDisplayPackagesByCategory('umrah'),
    getDisplayPackagesByCategory('tour'),
  ]);

  return (
    <>
      <PackageCarousel
        locale={locale}
        eyebrow={isBn ? 'হজ্জ' : isAr ? 'الحج' : 'Hajj Packages'}
        title={isBn ? 'হজ্জ প্যাকেজ ২০২৫' : isAr ? 'باقات الحج ٢٠٢٥' : 'Hajj Packages 2025'}
        subtitle={
          isBn
            ? 'সরকার অনুমোদিত প্যাকেজ — ফ্লাইট, হোটেল, ভিসা ও মুতাওয়াফসহ পূর্ণ সহায়তা।'
            : isAr
              ? 'باقات معتمدة حكومياً — تشمل الطيران والفنادق والتأشيرة وإرشاد المطوّف.'
              : 'Government-approved packages — flights, hotels, visa, and Mutawwif support included.'
        }
        viewAllHref={`/${locale}/hajj`}
        viewAllLabel={isBn ? 'সকল হজ্জ প্যাকেজ' : isAr ? 'عرض جميع باقات الحج' : 'View all Hajj packages'}
        packages={hajj}
        accent="green"
        iconKey="hajj"
        background="stone"
      />

      <PackageCarousel
        locale={locale}
        eyebrow={isBn ? 'উমরাহ' : isAr ? 'العمرة' : 'Umrah Packages'}
        title={isBn ? 'উমরাহ প্যাকেজ' : isAr ? 'باقات العمرة' : 'Umrah Packages'}
        subtitle={
          isBn
            ? 'সারা বছর — সাশ্রয়ী থেকে প্রিমিয়াম, মক্কা ও মদিনার নিকটতম হোটেলসহ।'
            : isAr
              ? 'على مدار العام — من الاقتصادية إلى الفاخرة، مع فنادق قريبة من الحرم والمسجد النبوي.'
              : 'Year-round — from economy to premium, with hotels close to Haram & Masjid Nabawi.'
        }
        viewAllHref={`/${locale}/umrah`}
        viewAllLabel={isBn ? 'সকল উমরাহ প্যাকেজ' : isAr ? 'عرض جميع باقات العمرة' : 'View all Umrah packages'}
        packages={umrah}
        accent="teal"
        iconKey="plane"
        background="white"
      />

      <PackageCarousel
        locale={locale}
        eyebrow={isBn ? 'আন্তর্জাতিক ট্যুর' : isAr ? 'جولات دولية' : 'International Tours'}
        title={isBn ? 'আন্তর্জাতিক ট্যুর প্যাকেজ' : isAr ? 'باقات الجولات الدولية' : 'International Tour Packages'}
        subtitle={
          isBn
            ? 'দুবাই, মালয়েশিয়া, থাইল্যান্ড — গাইডেড গ্রুপ ট্যুর ও কাস্টম ভ্রমণ পরিকল্পনা।'
            : isAr
              ? 'دبي وماليزيا وتايلاند وغيرها — جولات جماعية مع مرشد وبرامج سفر مخصصة.'
              : 'Dubai, Malaysia, Thailand and beyond — guided group tours and custom itineraries.'
        }
        viewAllHref={`/${locale}/tours`}
        viewAllLabel={isBn ? 'সকল ট্যুর দেখুন' : isAr ? 'عرض جميع الجولات' : 'View all tours'}
        packages={tours}
        accent="blue"
        iconKey="planeTakeoff"
        background="gradient"
      />
    </>
  );
}
