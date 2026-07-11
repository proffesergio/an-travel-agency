/** Client-safe hotel constants and helpers (no server-only imports). */

export const AMENITY_KEYS = [
  'wifi',
  'breakfast',
  'parking',
  'prayer-room',
  'shuttle',
  'family-room',
  'ac',
  'restaurant',
  'laundry',
  'elevator',
] as const;

export type AmenityKey = (typeof AMENITY_KEYS)[number];

export const AMENITY_LABELS: Record<AmenityKey, { en: string; bn: string; ar: string }> = {
  wifi: { en: 'Free WiFi', bn: 'ফ্রি ওয়াইফাই', ar: 'واي فاي مجاني' },
  breakfast: { en: 'Breakfast', bn: 'সকালের নাস্তা', ar: 'إفطار' },
  parking: { en: 'Parking', bn: 'পার্কিং', ar: 'موقف سيارات' },
  'prayer-room': { en: 'Prayer Room', bn: 'নামাজের কক্ষ', ar: 'مصلى' },
  shuttle: { en: 'Airport Shuttle', bn: 'এয়ারপোর্ট শাটল', ar: 'نقل من المطار' },
  'family-room': { en: 'Family Rooms', bn: 'ফ্যামিলি রুম', ar: 'غرف عائلية' },
  ac: { en: 'Air Conditioning', bn: 'এয়ার কন্ডিশনিং', ar: 'تكييف' },
  restaurant: { en: 'Restaurant', bn: 'রেস্টুরেন্ট', ar: 'مطعم' },
  laundry: { en: 'Laundry', bn: 'লন্ড্রি', ar: 'مغسلة ملابس' },
  elevator: { en: 'Elevator', bn: 'লিফট', ar: 'مصعد' },
};

export type UiLang = 'en' | 'bn' | 'ar';

export function uiLang(locale: string): UiLang {
  return locale === 'bn' || locale === 'ar' ? locale : 'en';
}

export const HOTEL_CURRENCIES = ['BDT', 'SAR', 'AED', 'USD'] as const;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  BDT: '৳',
  SAR: 'SAR ',
  AED: 'AED ',
  USD: '$',
};

export function formatMoney(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  return `${symbol}${amount.toLocaleString('en-US')}`;
}

/** "150m from Haram" / "1.2km from Haram" */
export function formatHaramDistance(meters: number, lang: UiLang): string {
  const dist = meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
  if (lang === 'bn') return `হারাম থেকে ${dist}`;
  if (lang === 'ar') return `${dist} من الحرم`;
  return `${dist} from Haram`;
}

/** Cities where the distance-from-Haram filter applies (matched case-insensitively). */
export const HARAM_CITIES = ['makkah', 'mecca', 'madinah', 'medina'];

export function isHaramCity(city: string | undefined): boolean {
  if (!city) return false;
  return HARAM_CITIES.includes(city.trim().toLowerCase());
}

export const HOTEL_SORT_OPTIONS = [
  { value: 'recommended', en: 'Recommended', bn: 'প্রস্তাবিত', ar: 'موصى به' },
  { value: 'price-asc', en: 'Price: Low to High', bn: 'দাম: কম থেকে বেশি', ar: 'السعر: من الأقل إلى الأعلى' },
  { value: 'price-desc', en: 'Price: High to Low', bn: 'দাম: বেশি থেকে কম', ar: 'السعر: من الأعلى إلى الأقل' },
  { value: 'stars-desc', en: 'Star Rating', bn: 'স্টার রেটিং', ar: 'تصنيف النجوم' },
  { value: 'distance-asc', en: 'Closest to Haram', bn: 'হারামের নিকটতম', ar: 'الأقرب إلى الحرم' },
] as const;

export type HotelSort = (typeof HOTEL_SORT_OPTIONS)[number]['value'];
