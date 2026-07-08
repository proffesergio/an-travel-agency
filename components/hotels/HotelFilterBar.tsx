'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import {
  AMENITY_KEYS,
  AMENITY_LABELS,
  HOTEL_SORT_OPTIONS,
  isHaramCity,
} from '@/lib/hotels-shared';

const chipCls =
  'px-3 py-1.5 rounded-full border text-sm font-medium transition-colors cursor-pointer select-none';

export default function HotelFilterBar({ locale }: { locale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isBn = locale === 'bn';
  const [showAmenities, setShowAmenities] = useState(false);

  const city = searchParams.get('city') ?? '';
  const stars = (searchParams.get('stars') ?? '').split(',').filter(Boolean).map(Number);
  const amenities = (searchParams.get('amenities') ?? '').split(',').filter(Boolean);
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const haram = searchParams.get('haram') ?? '';
  const sort = searchParams.get('sort') ?? 'recommended';

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleStar = (s: number) => {
    const next = stars.includes(s) ? stars.filter((x) => x !== s) : [...stars, s];
    setParam('stars', next.join(','));
  };

  const toggleAmenity = (a: string) => {
    const next = amenities.includes(a) ? amenities.filter((x) => x !== a) : [...amenities, a];
    setParam('amenities', next.join(','));
  };

  const hasFilters = stars.length > 0 || amenities.length > 0 || maxPrice || haram;

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    ['stars', 'amenities', 'maxPrice', 'haram', 'sort'].forEach((k) => params.delete(k));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 mr-1">
        <SlidersHorizontal className="w-4 h-4" />
        {isBn ? 'ফিল্টার' : 'Filters'}
      </span>

      {[5, 4, 3].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => toggleStar(s)}
          className={`${chipCls} ${
            stars.includes(s)
              ? 'bg-[#2d6a4f] text-white border-[#2d6a4f]'
              : 'bg-white text-gray-700 border-gray-200 hover:border-[#2d6a4f]'
          }`}
        >
          {s}★
        </button>
      ))}

      <select
        value={maxPrice}
        onChange={(e) => setParam('maxPrice', e.target.value)}
        className={`${chipCls} bg-white border-gray-200 text-gray-700`}
        aria-label="Max price"
      >
        <option value="">{isBn ? 'যেকোনো দাম' : 'Any price'}</option>
        <option value="5000">≤ 5,000</option>
        <option value="10000">≤ 10,000</option>
        <option value="20000">≤ 20,000</option>
        <option value="50000">≤ 50,000</option>
      </select>

      {isHaramCity(city) && (
        <select
          value={haram}
          onChange={(e) => setParam('haram', e.target.value)}
          className={`${chipCls} bg-white border-gray-200 text-gray-700`}
          aria-label="Distance from Haram"
        >
          <option value="">{isBn ? 'হারাম থেকে দূরত্ব' : 'Distance from Haram'}</option>
          <option value="500">≤ 500m</option>
          <option value="1000">≤ 1km</option>
          <option value="2000">≤ 2km</option>
        </select>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowAmenities((v) => !v)}
          className={`${chipCls} ${
            amenities.length
              ? 'bg-[#2d6a4f] text-white border-[#2d6a4f]'
              : 'bg-white text-gray-700 border-gray-200 hover:border-[#2d6a4f]'
          }`}
        >
          {isBn ? 'সুবিধা' : 'Amenities'}
          {amenities.length > 0 && ` (${amenities.length})`}
        </button>
        {showAmenities && (
          <div className="absolute z-20 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-3 w-64">
            {AMENITY_KEYS.map((a) => (
              <label key={a} className="flex items-center gap-2 py-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={amenities.includes(a)}
                  onChange={() => toggleAmenity(a)}
                  className="w-4 h-4 rounded border-gray-300 text-[#2d6a4f] focus:ring-[#2d6a4f]"
                />
                <span className="text-sm text-gray-700">
                  {isBn ? AMENITY_LABELS[a].bn : AMENITY_LABELS[a].en}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600"
          >
            <X className="w-3.5 h-3.5" />
            {isBn ? 'মুছুন' : 'Clear'}
          </button>
        )}
        <select
          value={sort}
          onChange={(e) => setParam('sort', e.target.value)}
          className={`${chipCls} bg-white border-gray-200 text-gray-700`}
          aria-label="Sort"
        >
          {HOTEL_SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {isBn ? o.bn : o.en}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
