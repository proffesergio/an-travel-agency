import type { ComponentType } from 'react';
import {
  Plane,
  Bus,
  MapPin,
  UtensilsCrossed,
  Tent,
  Compass,
  Hotel,
  BookOpen,
  GraduationCap,
  Mountain,
  Train,
  Accessibility,
  HeartPulse,
  Salad,
  Sparkles,
  ShoppingBag,
  Stamp,
  type LucideProps,
} from 'lucide-react';

export interface HajjService {
  icon: ComponentType<LucideProps>;
  title: string;
  note?: string;
}

export const HAJJ_SERVICES: HajjService[] = [
  { icon: Stamp, title: 'হজ্ব ভিসা' },
  { icon: Plane, title: 'সৌদিয়া / বিমানে সরাসরি এয়ার টিকেট' },
  { icon: Bus, title: 'মক্কা–মদিনায় ট্রান্সপোর্ট' },
  { icon: MapPin, title: 'মক্কা–মদিনায় জিয়ারা (সাইড ভিজিট)' },
  { icon: UtensilsCrossed, title: 'সকাল–দুপুর–রাতে দেশীয় খাবার' },
  { icon: Tent, title: 'মিনা ও আরাফায় খাবার সরবরাহ' },
  { icon: Compass, title: 'সার্বক্ষণিক অভিজ্ঞ গাইড' },
  { icon: Hotel, title: 'মক্কা ও মদিনায় নিকটতম হোটেল' },
  { icon: BookOpen, title: 'অভিজ্ঞ আলেমের মাধ্যমে হজ্বের কার্যক্রম পরিচালনা' },
  { icon: GraduationCap, title: 'হজ্ব প্রশিক্ষণ' },
  {
    icon: Mountain,
    title: 'তায়েফ, আরব সাগর, বদর, বীরে শেফা, ওয়াদিয়াল জ্বীন পাহাড় ভিজিট',
    note: 'শর্তসাপেক্ষে',
  },
  { icon: Train, title: 'বুলেট ট্রেনের টিকেটের ব্যবস্থা', note: 'শর্ত প্রযোজ্য' },
  {
    icon: Accessibility,
    title: 'অসুস্থ যাত্রীর জন্য হুইল চেয়ার ও গাইডের ব্যবস্থা',
    note: 'শর্ত প্রযোজ্য',
  },
  { icon: HeartPulse, title: 'অসুস্থ যাত্রীদের নিকটতম হাসপাতালে চিকিৎসা প্রদান' },
  { icon: Salad, title: 'ডায়বেটিস যাত্রীদের জন্য আলাদা খাবারের ব্যবস্থা' },
  { icon: Sparkles, title: 'হোটেলে নিয়মিত রুম সার্ভিস' },
  { icon: ShoppingBag, title: 'মক্কা–মদিনায় কেনাকাটায় সহযোগিতা' },
];

export const MAKKAH_SITES: string[] = [
  'রাসুল ﷺ এর জন্মস্থান',
  'খাদিজা (রা:) এর কবরস্থান',
  'জাবালে আবু কুবাইস পাহাড়',
  'আবু জেহেলের বাড়ী',
  'সৌদি বাদশাহর বাড়ী',
  'জাবালে ছুর পাহাড়',
  'জাবালে নুর পাহাড় (হেরা গুহা)',
  'জাবালে রহমত পাহাড়',
  'মসজিদে নামিরা (আরাফাতে)',
  'আরাফাতের ময়দান',
  'মুজদালিফার ময়দান',
  'মসজিদে মাশআরিল হারাম (মুজদালিফায়)',
  'নহরে জোবাইদা',
  'মিনার ময়দান',
  'মসজিদে খায়েফ (মিনায়)',
  'শয়তানকে পাথর মারার স্থান (মিনায়)',
  'ইসমাইল (আ:) এর কুরবানির স্থান',
  'মসজিদে জ্বীন (মক্কায়)',
  'মসজিদে সাজা (মক্কায়)',
];

export const MADINAH_SITES: string[] = [
  'মসজিদে কুবা',
  'মসজিদে কিবলাতাইন',
  'ওহুদ পাহাড়',
  'খন্দক প্রান্তর',
  'খেজুর বাগান',
  'মসজিদে বেলাল',
  'মসজিদে আবু বকর',
  'মসজিদে আলি',
  'মসজিদে গামামা',
  'জান্নাতুল বাকি',
];

export interface OfficeContact {
  label: string;
  city: string;
  numbers: string[];
  highlight?: boolean;
}

export const OFFICES: OfficeContact[] = [
  { label: 'প্রধান কার্যালয়', city: 'ঢাকা', numbers: ['01843-431743', '01878-586353'], highlight: true },
  { label: 'ঢাকা অফিস', city: 'Dhaka', numbers: ['01678-820080'] },
  { label: 'ফেনী অফিস', city: 'Feni', numbers: ['01606-923178', '01738-426042'] },
  { label: 'টঙ্গী অফিস', city: 'Tongi', numbers: ['01621-449937'] },
  { label: 'বাহ্মনবাড়িয়া অফিস', city: 'Brahmanbaria', numbers: ['01846-805281'] },
  { label: 'বগুড়া প্রতিনিধি', city: 'Bogura', numbers: ['01760-683923', '01727-542943'] },
  { label: 'সৌদি আরব', city: 'Saudi Arabia', numbers: ['+966 53 731 1069'], highlight: true },
];

export const HAJJ_2027_PRIMARY_WHATSAPP = '8801843431743';
export const HAJJ_2027_PRIMARY_PHONE = '+8801843431743';

export const HAJJ_2027_WHATSAPP_MESSAGE =
  'আসসালামু আলাইকুম, আমি ২০২৭ সালের হজ্বের প্রাক নিবন্ধন করতে চাই।';
