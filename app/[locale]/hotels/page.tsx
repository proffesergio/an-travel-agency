import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import Image from 'next/image';
import HotelSearchBar from '@/components/hotels/HotelSearchBar';
import HotelFilterBar from '@/components/hotels/HotelFilterBar';
import HotelCard from '@/components/hotels/HotelCard';
import { searchHotels } from '@/lib/services/hotels';
import type { HotelSort } from '@/lib/hotels-shared';
import { Hotel as HotelIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HotelsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const isBn = locale === 'bn';
  const isAr = locale === 'ar';

  let hotels: Awaited<ReturnType<typeof searchHotels>> = [];
  try {
    hotels = await searchHotels({
      city: sp.city,
      stars: sp.stars ? sp.stars.split(',').map(Number).filter(Boolean) : undefined,
      maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
      haramMaxMeters: sp.haram ? Number(sp.haram) : undefined,
      amenities: sp.amenities ? sp.amenities.split(',').filter(Boolean) : undefined,
      sort: (sp.sort as HotelSort) ?? 'recommended',
    });
  } catch (error) {
    console.error('[hotels] search failed', error);
  }

  const query = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => typeof v === 'string') as [string, string][]
  ).toString();

  return (
    <main className="flex-1 bg-gray-50">
      <div className="bg-[#1b4332] text-white pt-12 pb-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white shadow-lg overflow-hidden flex-shrink-0">
                <Image
                  src="/images/hotels/logo.jpeg"
                  alt="M.M. Ajmeer International Limited"
                  fill
                  className="object-contain p-1"
                  sizes="96px"
                  priority
                />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold">
                  {isBn ? 'হোটেল বুকিং' : isAr ? 'حجز الفنادق' : 'Hotel Booking'}
                </h1>
                <p className="text-green-200 mt-1">
                  {isBn
                    ? 'মক্কা, মদিনা, দুবাইসহ সেরা হোটেলে সেরা দামে থাকুন'
                    : isAr
                      ? 'فنادق مختارة في مكة والمدينة ودبي وغيرها — أفضل الأسعار وخدمة شخصية'
                      : 'Handpicked hotels in Makkah, Madinah, Dubai and beyond — best rates, personal service'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 -mt-12">
          <HotelSearchBar
            locale={locale}
            initialCity={sp.city ?? ''}
            initialCheckIn={sp.checkin ?? ''}
            initialCheckOut={sp.checkout ?? ''}
            initialRooms={sp.rooms ? Number(sp.rooms) : 1}
            initialAdults={sp.adults ? Number(sp.adults) : 2}
            initialChildren={sp.children ? Number(sp.children) : 0}
          />
        </div>

        <section className="max-w-6xl mx-auto px-4 py-8">
          <Suspense>
            <HotelFilterBar locale={locale} />
          </Suspense>

          <p className="text-sm text-gray-500 mt-4 mb-4">
            {isBn ? `${hotels.length}টি হোটেল পাওয়া গেছে` : isAr ? `تم العثور على ${hotels.length} فندقاً` : `${hotels.length} hotels found`}
            {sp.city ? ` — ${sp.city}` : ''}
          </p>

          {hotels.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
              <HotelIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">
                {isBn ? 'কোনো হোটেল পাওয়া যায়নি' : isAr ? 'لا توجد فنادق مطابقة لبحثك' : 'No hotels match your search'}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {isBn
                  ? 'ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন'
                  : isAr
                    ? 'جرّب تعديل الفلاتر أو البحث في مدينة أخرى'
                    : 'Try adjusting your filters or searching a different city'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel) => (
                <HotelCard key={hotel._id} hotel={hotel} locale={locale} query={query} />
              ))}
            </div>
          )}
      </section>
    </main>
  );
}
