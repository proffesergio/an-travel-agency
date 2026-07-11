'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Search, Star, Hotel as HotelIcon } from 'lucide-react';
import { formatMoney } from '@/lib/hotels-shared';

const inputCls =
  'w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none';

interface Destination {
  city: string;
  cityBn: string;
  country: string;
  count: number;
}

interface Property {
  name: string;
  nameBn: string;
  slug: string;
  city: string;
  cityBn: string;
  country: string;
  starRating: number;
  imageUrl: string;
  fromPrice: number;
  currency: string;
  featured: boolean;
}

function matches(query: string, ...fields: (string | undefined)[]) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => f?.toLowerCase().includes(q));
}

export default function HotelSearchBar({
  locale,
  initialCity = '',
  initialCheckIn = '',
  initialCheckOut = '',
  initialRooms = 1,
  initialAdults = 2,
  initialChildren = 0,
}: {
  locale: string;
  initialCity?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialRooms?: number;
  initialAdults?: number;
  initialChildren?: number;
}) {
  const router = useRouter();
  const isBn = locale === 'bn';
  const isAr = locale === 'ar';
  const [city, setCity] = useState(initialCity);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [rooms, setRooms] = useState(initialRooms);
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const [open, setOpen] = useState(false);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/hotels/destinations')
      .then((r) => r.json())
      .then((d) => {
        setDestinations(d.destinations ?? []);
        setProperties(d.properties ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (city.trim()) params.set('city', city.trim());
    if (checkIn) params.set('checkin', checkIn);
    if (checkOut) params.set('checkout', checkOut);
    params.set('rooms', String(rooms));
    params.set('adults', String(adults));
    params.set('children', String(children));
    router.push(`/${locale}/hotels?${params.toString()}`);
  };

  const today = new Date().toISOString().slice(0, 10);

  // Live suggestions: filter the loaded lists as the user types.
  const visibleDestinations = destinations
    .filter((d) => matches(city, d.city, d.cityBn, d.country))
    .slice(0, 5);
  const visibleProperties = properties
    .filter((p) => matches(city, p.name, p.nameBn, p.city, p.cityBn, p.country))
    .slice(0, city.trim() ? 8 : 5);

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 flex flex-col lg:flex-row gap-3"
    >
      <div className="relative flex-[2]" ref={boxRef}>
        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
          {isBn ? 'শহর / হোটেল' : isAr ? 'المدينة / الفندق' : 'City / Hotel'}
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={city}
            onFocus={() => setOpen(true)}
            onChange={(e) => setCity(e.target.value)}
            className={`${inputCls} pl-9`}
            placeholder={isBn ? 'যেমন: মক্কা, দুবাই' : isAr ? 'مثال: مكة، دبي' : 'e.g., Makkah, Dubai'}
          />
        </div>
        {open && (visibleDestinations.length > 0 || visibleProperties.length > 0) && (
          <div className="absolute z-30 mt-2 w-full sm:min-w-[26rem] bg-white rounded-xl shadow-2xl border border-gray-100 p-3 max-h-96 overflow-y-auto">
            {visibleDestinations.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-1">
                  {isBn ? 'গন্তব্য' : isAr ? 'الوجهات' : 'Destinations'}
                </p>
                {visibleDestinations.map((d) => (
                  <button
                    key={d.city}
                    type="button"
                    onClick={() => {
                      setCity(d.city);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-green-50 text-left"
                  >
                    <MapPin className="w-4 h-4 text-[#2d6a4f]" />
                    <span className="flex-1 text-sm text-gray-800">
                      {isBn ? d.cityBn || d.city : d.city}
                      <span className="text-gray-400"> · {d.country}</span>
                    </span>
                    <span className="text-xs text-gray-400">
                      {d.count} {isBn ? 'হোটেল' : isAr ? 'فندق' : 'hotels'}
                    </span>
                  </button>
                ))}
              </>
            )}
            {visibleProperties.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mt-2 mb-1">
                  {isBn ? 'হোটেল' : isAr ? 'الفنادق' : 'Hotels'}
                </p>
                {visibleProperties.map((p) => (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => router.push(`/${locale}/hotels/${p.slug}`)}
                    className="flex items-start gap-3 w-full p-2 rounded-xl hover:bg-green-50 text-left transition-colors"
                  >
                    <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={isBn ? p.nameBn || p.name : p.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <HotelIcon className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-gray-900 truncate">
                        {isBn ? p.nameBn || p.name : p.name}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <span className="inline-flex items-center gap-0.5 text-amber-500">
                          {p.starRating}
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        </span>
                        · {isBn ? p.cityBn || p.city : p.city}, {p.country}
                      </span>
                    </span>
                    {p.fromPrice > 0 && (
                      <span className="text-right flex-shrink-0">
                        <span className="block text-sm font-bold text-[#1b4332]">
                          {formatMoney(p.fromPrice, p.currency)}
                        </span>
                        <span className="block text-[10px] text-gray-400">
                          {isBn ? 'প্রতি রাত থেকে' : isAr ? 'ابتداءً من /ليلة' : 'from /night'}
                        </span>
                      </span>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
          {isBn ? 'চেক ইন' : isAr ? 'تسجيل الوصول' : 'Check In'}
        </label>
        <input
          type="date"
          value={checkIn}
          min={today}
          onChange={(e) => setCheckIn(e.target.value)}
          className={inputCls}
        />
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
          {isBn ? 'চেক আউট' : isAr ? 'تسجيل المغادرة' : 'Check Out'}
        </label>
        <input
          type="date"
          value={checkOut}
          min={checkIn || today}
          onChange={(e) => setCheckOut(e.target.value)}
          className={inputCls}
        />
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
          {isBn ? 'রুম ও অতিথি' : isAr ? 'الغرف والضيوف' : 'Rooms & Guests'}
        </label>
        <div className="flex gap-1">
          <select
            value={rooms}
            onChange={(e) => setRooms(Number(e.target.value))}
            className={`${inputCls} bg-white`}
            aria-label="Rooms"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} {isBn ? 'রুম' : isAr ? 'غرفة' : n > 1 ? 'Rooms' : 'Room'}
              </option>
            ))}
          </select>
          <select
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            className={`${inputCls} bg-white`}
            aria-label="Adults"
          >
            {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
              <option key={n} value={n}>
                {n} {isBn ? 'প্রাপ্তবয়স্ক' : isAr ? 'بالغ' : n > 1 ? 'Adults' : 'Adult'}
              </option>
            ))}
          </select>
          <select
            value={children}
            onChange={(e) => setChildren(Number(e.target.value))}
            className={`${inputCls} bg-white`}
            aria-label="Children"
          >
            {[0, 1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n} {isBn ? 'শিশু' : isAr ? 'طفل' : n === 1 ? 'Child' : 'Children'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-end">
        <button
          type="submit"
          className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-8 py-2.5 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] transition-colors font-semibold"
        >
          <Search className="w-4 h-4" />
          {isBn ? 'খুঁজুন' : isAr ? 'بحث' : 'Search'}
        </button>
      </div>
    </form>
  );
}
