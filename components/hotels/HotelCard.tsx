import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, ArrowRight, BedDouble } from 'lucide-react';
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
  const name = isBn ? hotel.nameBn || hotel.name : hotel.name;
  const city = isBn ? hotel.cityBn || hotel.city : hotel.city;
  const country = isBn ? hotel.countryBn || hotel.country : hotel.country;
  const roomThumbs = hotel.rooms.filter((r) => r.available && r.images.length > 0).slice(0, 3);
  const availableRooms = hotel.rooms.filter((r) => r.available).length;

  return (
    <Link
      href={`/${locale}/hotels/${hotel.slug}${query ? `?${query}` : ''}`}
      className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ease-out border border-gray-100 hover:shadow-2xl hover:border-[#74c69d]/60 hover:-translate-y-1.5 hover:ring-1 hover:ring-[#74c69d]/30 active:scale-[0.99]"
    >
      {/* Image */}
      <div className="relative h-52 bg-gray-200 overflow-hidden">
        {hotel.images[0] ? (
          <Image
            src={hotel.images[0]}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <BedDouble className="w-10 h-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full shadow-sm">
            {hotel.starRating}
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
          </span>
          {hotel.featured && (
            <span className="text-xs font-semibold text-white bg-[#2d6a4f]/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm">
              {isBn ? 'ফিচার্ড' : 'Featured'}
            </span>
          )}
        </div>
        {typeof hotel.distanceFromHaramMeters === 'number' && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
              🕋 {formatHaramDistance(hotel.distanceFromHaramMeters, isBn)}
            </span>
          </div>
        )}
        <div className="absolute bottom-3 right-3">
          <span className="inline-flex items-baseline gap-1 text-white bg-[#2d6a4f]/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
            <span className="text-[10px] uppercase tracking-wide opacity-80">
              {isBn ? 'শুরু' : 'From'}
            </span>
            <span className="text-sm font-bold">{formatMoney(hotel.fromPrice, hotel.currency)}</span>
            <span className="text-[10px] opacity-80">{isBn ? '/রাত' : '/night'}</span>
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-lg leading-snug line-clamp-2 group-hover:text-[#2d6a4f] transition-colors">
          {name}
        </h3>
        <p className="flex items-center gap-1 text-sm text-gray-500 mt-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#2d6a4f]" />
          {city}, {country}
        </p>

        {hotel.amenities.length > 0 && (
          <p className="text-xs text-gray-500 mt-3 line-clamp-1">
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
        )}

        {roomThumbs.length > 0 && (
          <div className="flex items-center gap-2 mt-4">
            {roomThumbs.map((room, i) => (
              <div
                key={i}
                className="relative w-16 h-12 rounded-lg overflow-hidden bg-gray-100 ring-1 ring-gray-100"
              >
                <Image
                  src={room.images[0]}
                  alt={room.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            ))}
            <span className="text-xs text-gray-400 ml-1">
              {isBn ? `${availableRooms}টি রুম টাইপ` : `${availableRooms} room types`}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100">
          <span className="text-sm font-semibold text-[#2d6a4f]">
            {isBn ? 'রুম দেখুন ও বুক করুন' : 'View Rooms & Book'}
          </span>
          <span className="w-9 h-9 rounded-full bg-[#2d6a4f] text-white flex items-center justify-center group-hover:bg-[#1b4332] group-hover:translate-x-1 transition-all">
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
