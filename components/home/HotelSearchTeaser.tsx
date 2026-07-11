'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Hotel as HotelIcon } from 'lucide-react';
import HotelSearchBar from '@/components/hotels/HotelSearchBar';
import { formatMoney } from '@/lib/hotels-shared';

interface FeaturedHotel {
  name: string;
  nameBn: string;
  slug: string;
  city: string;
  cityBn: string;
  starRating: number;
  imageUrl: string;
  fromPrice: number;
  currency: string;
}

export default function HotelSearchTeaser({ locale }: { locale: string }) {
  const isBn = locale === 'bn';
  const isAr = locale === 'ar';
  const [hotels, setHotels] = useState<FeaturedHotel[]>([]);

  useEffect(() => {
    fetch('/api/hotels/featured')
      .then((r) => r.json())
      .then((d) => setHotels(d.hotels ?? []))
      .catch(() => {});
  }, []);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center">
            <HotelIcon className="w-5 h-5 text-[#2d6a4f]" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isBn ? 'আপনার হোটেল খুঁজুন' : isAr ? 'ابحث عن فندقك' : 'Find Your Hotel'}
            </h2>
            <p className="text-gray-500 text-sm">
              {isBn
                ? 'মক্কা, মদিনা ও দুবাইয়ের সেরা হোটেল — সরাসরি বুকিং অনুরোধ'
                : isAr
                  ? 'فنادق مختارة في مكة والمدينة ودبي — اطلب الحجز خلال دقائق'
                  : 'Handpicked hotels in Makkah, Madinah & Dubai — request a booking in minutes'}
            </p>
          </div>
        </div>

        <HotelSearchBar locale={locale} />

        {hotels.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {hotels.map((h) => (
              <Link
                key={h.slug}
                href={`/${locale}/hotels/${h.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="relative h-32 bg-gray-100">
                  {h.imageUrl && (
                    <Image
                      src={h.imageUrl}
                      alt={isBn ? h.nameBn || h.name : h.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  )}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-[#2d6a4f]">
                    {isBn ? h.nameBn || h.name : h.name}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                    <span className="inline-flex items-center gap-0.5 text-amber-500">
                      {h.starRating}
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </span>
                    · {isBn ? h.cityBn || h.city : h.city}
                  </p>
                  <p className="text-sm font-bold text-[#1b4332] mt-1">
                    {formatMoney(h.fromPrice, h.currency)}
                    <span className="text-xs text-gray-400 font-normal">
                      {isBn ? '/রাত' : isAr ? '/ليلة' : '/night'}
                    </span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
