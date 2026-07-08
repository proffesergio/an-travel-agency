import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin } from 'lucide-react';
import {
  AMENITY_LABELS,
  formatMoney,
  formatHaramDistance,
  type AmenityKey,
} from '@/lib/hotels-shared';
import type { PublicHotel } from '@/lib/services/hotels';

export default function HotelCard({
  hotel,
  locale,
  query = '',
}: {
  hotel: PublicHotel;
  locale: string;
  query?: string; // preserved search params appended to the detail link
}) {
  const isBn = locale === 'bn';
  const roomThumbs = hotel.rooms.filter((r) => r.available && r.images.length > 0).slice(0, 3);

  return (
    <Link
      href={`/${locale}/hotels/${hotel.slug}${query ? `?${query}` : ''}`}
      className="group flex flex-col sm:flex-row gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow p-4"
    >
      <div className="relative w-full sm:w-56 h-44 sm:h-40 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
        {hotel.images[0] ? (
          <Image
            src={hotel.images[0]}
            alt={isBn ? hotel.nameBn : hotel.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, 224px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
            No photo
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg group-hover:text-[#2d6a4f] transition-colors">
              {isBn ? hotel.nameBn : hotel.name}
            </h3>
            <p className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
              <span className="inline-flex items-center gap-0.5 text-amber-500">
                {Array.from({ length: hotel.starRating }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </span>
              <MapPin className="w-3.5 h-3.5 ml-1" />
              {isBn ? hotel.cityBn : hotel.city}, {isBn ? hotel.countryBn : hotel.country}
            </p>
            {typeof hotel.distanceFromHaramMeters === 'number' && (
              <span className="inline-block mt-1.5 text-xs font-medium bg-green-50 text-[#2d6a4f] px-2 py-0.5 rounded-full">
                🕋 {formatHaramDistance(hotel.distanceFromHaramMeters, isBn)}
              </span>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-400">{isBn ? 'শুরু' : 'From'}</p>
            <p className="text-xl font-bold text-[#1b4332]">
              {formatMoney(hotel.fromPrice, hotel.currency)}
            </p>
            <p className="text-xs text-gray-400">{isBn ? '/রাত' : '/night'}</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-2 line-clamp-1">
          {hotel.amenities
            .slice(0, 4)
            .map(
              (a) =>
                (isBn
                  ? AMENITY_LABELS[a as AmenityKey]?.bn
                  : AMENITY_LABELS[a as AmenityKey]?.en) ?? a
            )
            .join(' · ')}
        </p>

        {roomThumbs.length > 0 && (
          <div className="flex gap-2 mt-3">
            {roomThumbs.map((room, i) => (
              <div key={i} className="relative w-16 h-12 rounded-lg overflow-hidden bg-gray-100">
                <Image src={room.images[0]} alt={room.name} fill className="object-cover" sizes="64px" />
              </div>
            ))}
            <span className="self-center text-xs text-[#2d6a4f] font-medium ml-1">
              {isBn ? `${hotel.rooms.length}টি রুম টাইপ` : `${hotel.rooms.length} room types`} →
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
