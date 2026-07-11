import Image from 'next/image';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Star, MapPin, Users, BedDouble, Phone, MessageCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HotelBookingForm from '@/components/hotels/HotelBookingForm';
import HotelGallery from '@/components/hotels/HotelGallery';
import BookRoomButton from './BookRoomButton';
import { getHotelBySlug } from '@/lib/services/hotels';
import {
  AMENITY_LABELS,
  formatMoney,
  formatHaramDistance,
  uiLang,
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
  const isAr = locale === 'ar';
  const lang = uiLang(locale);

  const hotel = await getHotelBySlug(slug);
  if (!hotel || !hotel.available) notFound();

  const rooms = (hotel.rooms ?? []).filter((r) => r.available);
  const name = isBn ? hotel.nameBn || hotel.name : hotel.name;
  const city = isBn ? hotel.cityBn || hotel.city : hotel.city;
  const country = isBn ? hotel.countryBn || hotel.country : hotel.country;
  const description = isBn ? hotel.descriptionBn || hotel.description : hotel.description;

  const bookingPhone = hotel.bookingPhone?.trim() ?? '';
  // wa.me links take the number as digits only (with country code, no + or dashes).
  const whatsAppNumber = bookingPhone.replace(/\D/g, '');
  const whatsAppText = encodeURIComponent(
    `Hello, I would like to book a room at ${hotel.name}.`
  );

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Gallery */}
          <HotelGallery images={hotel.images ?? []} name={name} isBn={isBn} />

          {/* Header */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{name}</h1>
                <p className="flex items-center gap-2 text-gray-500 mt-2">
                  <span className="inline-flex items-center gap-0.5">
                    {Array.from({ length: hotel.starRating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </span>
                  <MapPin className="w-4 h-4" />
                  {city}, {country}
                </p>
                {typeof hotel.distanceFromHaramMeters === 'number' && (
                  <span className="inline-block mt-2 text-sm font-medium bg-green-50 text-[#2d6a4f] px-3 py-1 rounded-full">
                    🕋 {formatHaramDistance(hotel.distanceFromHaramMeters, lang)}
                  </span>
                )}
              </div>
              {bookingPhone && (
                <div className="flex flex-col gap-2">
                  <a
                    href={`tel:${bookingPhone.replace(/[^\d+]/g, '')}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] transition-colors font-semibold text-sm"
                  >
                    <Phone className="w-4 h-4" />
                    {isBn ? 'বুক করতে কল করুন' : isAr ? 'اتصل للحجز' : 'Call to Book'} — {bookingPhone}
                  </a>
                  {whatsAppNumber && (
                    <a
                      href={`https://wa.me/${whatsAppNumber}?text=${whatsAppText}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-[#2d6a4f] text-[#2d6a4f] rounded-lg hover:bg-green-50 transition-colors font-semibold text-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {isBn ? 'হোয়াটসঅ্যাপে বুক করুন' : isAr ? 'احجز عبر واتساب' : 'Book via WhatsApp'}
                    </a>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {(hotel.amenities ?? []).map((a) => (
                <span key={a} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                  {AMENITY_LABELS[a as AmenityKey]?.[lang] ?? a}
                </span>
              ))}
            </div>
            {description && (
              <p className="text-gray-600 mt-4 whitespace-pre-line">{description}</p>
            )}
          </div>

          {/* Location */}
          {hotel.mapEmbedUrl && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#2d6a4f]" />
                {isBn ? 'অবস্থান' : isAr ? 'الموقع' : 'Location'}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {city}, {country}
              </p>
              <div className="rounded-xl overflow-hidden border border-gray-100">
                <iframe
                  src={hotel.mapEmbedUrl}
                  title={`${name} — ${isBn ? 'গুগল ম্যাপ' : isAr ? 'خرائط جوجل' : 'Google Map'}`}
                  className="w-full h-72 md:h-96"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          )}

          {/* Rooms */}
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {isBn ? 'আপনার রুম বেছে নিন' : isAr ? 'اختر غرفتك' : 'Choose Your Room'}
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
                  <h3 className="font-semibold text-gray-900">
                    {isBn ? room.nameBn || room.name : room.name}
                  </h3>
                  <p className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    {room.bedInfo && (
                      <span className="inline-flex items-center gap-1">
                        <BedDouble className="w-4 h-4" /> {room.bedInfo}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {room.capacity?.adults} {isBn ? 'প্রাপ্তবয়স্ক' : isAr ? 'بالغين' : 'adults'}
                      {room.capacity?.children
                        ? ` + ${room.capacity.children} ${isBn ? 'শিশু' : isAr ? 'أطفال' : 'children'}`
                        : ''}
                    </span>
                  </p>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                  <p className="text-lg font-bold text-[#1b4332]">
                    {formatMoney(room.pricePerNight, hotel.currency)}
                    <span className="text-xs text-gray-400 font-normal">
                      {isBn ? '/রাত' : isAr ? '/ليلة' : '/night'}
                    </span>
                  </p>
                  <BookRoomButton
                    roomName={room.name}
                    label={isBn ? 'এই রুম বুক করুন' : isAr ? 'احجز هذه الغرفة' : 'Book This Room'}
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
