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

export const AMENITY_LABELS: Record<AmenityKey, { en: string; bn: string }> = {
  wifi: { en: 'Free WiFi', bn: 'ফ্রি ওয়াইফাই' },
  breakfast: { en: 'Breakfast', bn: 'সকালের নাস্তা' },
  parking: { en: 'Parking', bn: 'পার্কিং' },
  'prayer-room': { en: 'Prayer Room', bn: 'নামাজের কক্ষ' },
  shuttle: { en: 'Airport Shuttle', bn: 'এয়ারপোর্ট শাটল' },
  'family-room': { en: 'Family Rooms', bn: 'ফ্যামিলি রুম' },
  ac: { en: 'Air Conditioning', bn: 'এয়ার কন্ডিশনিং' },
  restaurant: { en: 'Restaurant', bn: 'রেস্টুরেন্ট' },
  laundry: { en: 'Laundry', bn: 'লন্ড্রি' },
  elevator: { en: 'Elevator', bn: 'লিফট' },
};

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
export function formatHaramDistance(meters: number, isBn: boolean): string {
  const dist = meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
  return isBn ? `হারাম থেকে ${dist}` : `${dist} from Haram`;
}

/** Cities where the distance-from-Haram filter applies (matched case-insensitively). */
export const HARAM_CITIES = ['makkah', 'mecca', 'madinah', 'medina'];

export function isHaramCity(city: string | undefined): boolean {
  if (!city) return false;
  return HARAM_CITIES.includes(city.trim().toLowerCase());
}

export const HOTEL_SORT_OPTIONS = [
  { value: 'recommended', en: 'Recommended', bn: 'প্রস্তাবিত' },
  { value: 'price-asc', en: 'Price: Low to High', bn: 'দাম: কম থেকে বেশি' },
  { value: 'price-desc', en: 'Price: High to Low', bn: 'দাম: বেশি থেকে কম' },
  { value: 'stars-desc', en: 'Star Rating', bn: 'স্টার রেটিং' },
  { value: 'distance-asc', en: 'Closest to Haram', bn: 'হারামের নিকটতম' },
] as const;

export type HotelSort = (typeof HOTEL_SORT_OPTIONS)[number]['value'];
