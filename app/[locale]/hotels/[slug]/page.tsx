import Image from 'next/image';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Star, MapPin, Users, BedDouble } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HotelBookingForm from '@/components/hotels/HotelBookingForm';
import BookRoomButton from './BookRoomButton';
import { getHotelBySlug } from '@/lib/services/hotels';
import {
  AMENITY_LABELS,
  formatMoney,
  formatHaramDistance,
  type AmenityKey,
} from '@/lib/hotels-shared';

export const dynamic = 'force-dynamic';

export default async function HotelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const isBn = locale === 'bn';

  const hotel = await getHotelBySlug(slug);
  if (!hotel || !hotel.available) notFound();

  const rooms = (hotel.rooms ?? []).filter((r) => r.available);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 rounded-2xl overflow-hidden mb-6">
            <div className="relative md:col-span-2 h-64 md:h-96 bg-gray-100">
              {hotel.images?.[0] && (
                <Image
                  src={hotel.images[0]}
                  alt={isBn ? hotel.nameBn : hotel.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 66vw"
                  priority
                />
              )}
            </div>
            <div className="hidden md:grid grid-rows-2 gap-2">
              {[hotel.images?.[1], hotel.images?.[2]].map((url, i) => (
                <div key={i} className="relative bg-gray-100">
                  {url && <Image src={url} alt="" fill className="object-cover" sizes="33vw" />}
                  {i === 1 && (hotel.images?.length ?? 0) > 3 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-semibold">
                      +{hotel.images.length - 3} {isBn ? 'ছবি' : 'photos'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Header */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {isBn ? hotel.nameBn : hotel.name}
                </h1>
                <p className="flex items-center gap-2 text-gray-500 mt-2">
                  <span className="inline-flex items-center gap-0.5">
                    {Array.from({ length: hotel.starRating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </span>
                  <MapPin className="w-4 h-4" />
                  {isBn ? hotel.cityBn : hotel.city}, {isBn ? hotel.countryBn : hotel.country}
                </p>
                {typeof hotel.distanceFromHaramMeters === 'number' && (
                  <span className="inline-block mt-2 text-sm font-medium bg-green-50 text-[#2d6a4f] px-3 py-1 rounded-full">
                    🕋 {formatHaramDistance(hotel.distanceFromHaramMeters, isBn)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {(hotel.amenities ?? []).map((a) => (
                <span key={a} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                  {(isBn
                    ? AMENITY_LABELS[a as AmenityKey]?.bn
                    : AMENITY_LABELS[a as AmenityKey]?.en) ?? a}
                </span>
              ))}
            </div>
            <p className="text-gray-600 mt-4 whitespace-pre-line">
              {isBn ? hotel.descriptionBn : hotel.description}
            </p>
          </div>

          {/* Rooms */}
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {isBn ? 'আপনার রুম বেছে নিন' : 'Choose Your Room'}
          </h2>
          <div className="space-y-4 mb-8">
            {rooms.map((room, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
              >
                <div className="relative w-full sm:w-44 h-36 sm:h-28 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {room.images?.[0] ? (
                    <Image
                      src={room.images[0]}
                      alt={room.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 176px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <BedDouble className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{isBn ? room.nameBn : room.name}</h3>
                  <p className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    {room.bedInfo && (
                      <span className="inline-flex items-center gap-1">
                        <BedDouble className="w-4 h-4" /> {room.bedInfo}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {room.capacity?.adults} {isBn ? 'প্রাপ্তবয়স্ক' : 'adults'}
                      {room.capacity?.children
                        ? ` + ${room.capacity.children} ${isBn ? 'শিশু' : 'children'}`
                        : ''}
                    </span>
                  </p>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                  <p className="text-lg font-bold text-[#1b4332]">
                    {formatMoney(room.pricePerNight, hotel.currency)}
                    <span className="text-xs text-gray-400 font-normal">
                      {isBn ? '/রাত' : '/night'}
                    </span>
                  </p>
                  <BookRoomButton
                    roomName={room.name}
                    label={isBn ? 'এই রুম বুক করুন' : 'Book This Room'}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Booking form */}
          <HotelBookingForm
            locale={locale}
            hotelId={String(hotel._id)}
            hotelName={hotel.name}
            rooms={rooms.map((r) => ({ name: r.name, nameBn: r.nameBn }))}
            initialCheckIn={sp.checkin ?? ''}
            initialCheckOut={sp.checkout ?? ''}
            initialRooms={sp.rooms ? Number(sp.rooms) : 1}
            initialAdults={sp.adults ? Number(sp.adults) : 2}
            initialChildren={sp.children ? Number(sp.children) : 0}
          />
        </div>
      </main>
      <Footer locale={locale} />
    </>
  );
}
