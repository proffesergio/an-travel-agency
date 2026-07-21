// lib/site-settings-defaults.ts
import type { Localized, SiteSettingsData } from '@/lib/site-settings-shared';

/**
 * The site's current hardcoded values, lifted verbatim from Footer.tsx,
 * WhatsAppButton.tsx and messages/*.json.
 *
 * getSiteSettings() merges the database document over these, so the public
 * site renders identically to before this feature existed when no document
 * has been saved yet. Nothing here should be changed to "improve" copy —
 * edit it in the admin panel instead.
 */
export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  brand: {
    companyName: 'Athar Nur Travels',
    logoUrl: '/ATHAR-NUR-Logo.png',
    faviconUrl: '',
    ogImageUrl: '',
  },
  contact: {
    email: 'atharnurtravel@gmail.com',
    whatsappNumber: '966537311069',
    phones: [
      {
        number: '+88 01843 431743',
        tel: '+8801843431743',
        countryCode: '+880',
        flag: '🇧🇩',
        country: 'BD',
        enabled: true,
        order: 0,
      },
      {
        number: '+966 5373 11069',
        tel: '+966537311069',
        countryCode: '+966',
        flag: '🇸🇦',
        country: 'KSA',
        enabled: true,
        order: 1,
      },
    ],
  },
  offices: [
    {
      label: { en: 'Head Office', bn: 'প্রধান কার্যালয়', ar: 'المكتب الرئيسي' },
      address: {
        en: 'Azad Centre, 55 Purana Paltan (14th Floor), Dhaka-1000',
        bn: 'আজাদ সেন্টার, ৫৫ পুরানা পল্টন (১৪তম তলা), ঢাকা-১০০০',
        ar: 'مركز آزاد، ٥٥ بورانا بالتان (الطابق الرابع عشر)، دكا-١٠٠٠',
      },
      phone: '',
      mapUrl: '',
      order: 0,
    },
  ],
  socials: [
    {
      platform: 'facebook',
      url: 'https://www.facebook.com/people/%E0%A6%86%E0%A6%A4%E0%A6%B9%E0%A6%BE%E0%A6%B0-%E0%A6%A8%E0%A7%82%E0%A6%B0%E0%A7%81-%E0%A6%9F%E0%A7%8D%E0%A6%B0%E0%A6%BE%E0%A6%AD%E0%A7%87%E0%A6%B2%E0%A6%B8-ATHAR-NUR-Travel/61589306429035/',
      enabled: true,
      order: 0,
    },
    { platform: 'instagram', url: 'https://instagram.com/atharnurtravels', enabled: true, order: 1 },
    { platform: 'youtube', url: 'https://youtube.com/@atharnurtravels', enabled: true, order: 2 },
    { platform: 'linkedin', url: 'https://linkedin.com/company/atharnurtravels', enabled: true, order: 3 },
    { platform: 'whatsapp', url: 'https://wa.me/8801843431743', enabled: true, order: 4 },
    { platform: 'telegram', url: 'https://t.me/atharnurtravels', enabled: true, order: 5 },
  ],
  payments: [
    { name: 'VISA', label: 'VISA', sub: '', bg: '#1A1F71', text: '#ffffff', enabled: true, order: 0 },
    { name: 'Mastercard', label: 'MC', sub: 'MasterCard', bg: '#ffffff', text: '#1a1a1a', enabled: true, order: 1 },
    { name: 'bKash', label: 'bKash', sub: '', bg: '#E2136E', text: '#ffffff', enabled: true, order: 2 },
    { name: 'Nagad', label: 'Nagad', sub: '', bg: '#F26522', text: '#ffffff', enabled: true, order: 3 },
    { name: 'Rocket', label: 'Rocket', sub: '', bg: '#8B2D7E', text: '#ffffff', enabled: true, order: 4 },
    { name: 'SSLCommerz', label: 'SSL', sub: 'Commerz', bg: '#0a3d62', text: '#ffffff', enabled: true, order: 5 },
  ],
  notice: {
    enabled: false,
    text: { en: '', bn: '', ar: '' },
    linkUrl: '',
    placements: ['top'],
    startsAt: '',
    endsAt: '',
  },
  footer: {
    tagline: {
      en: 'Your trusted partner for Hajj, Umrah, and international travel.',
      bn: 'হজ্জ, উমরাহ ও আন্তর্জাতিক ভ্রমণে আপনার বিশ্বস্ত অংশীদার।',
      ar: 'شريكك الموثوق للحج والعمرة والسفر الدولي.',
    },
    paymentNote: {
      en: 'We accept all major cards & mobile banking — secure checkout via SSLCommerz.',
      bn: 'সব প্রধান কার্ড ও মোবাইল ব্যাংকিং গ্রহণ করি — SSLCommerz এর মাধ্যমে নিরাপদ পেমেন্ট।',
      ar: 'نقبل جميع البطاقات الرئيسية والخدمات المصرفية عبر الجوال — دفع آمن عبر SSLCommerz.',
    },
    rights: {
      en: 'All rights reserved.',
      bn: 'সর্বস্বত্ব সংরক্ষিত।',
      ar: 'جميع الحقوق محفوظة.',
    },
    badgeLine: {
      en: 'ATAB Registered · Govt. Approved',
      bn: 'ATAB নিবন্ধিত · সরকার অনুমোদিত',
      ar: 'مسجل لدى ATAB · معتمد حكومياً',
    },
  },
  seo: {
    title: {
      en: 'Athar Nur Travels | Hajj, Umrah & International Tours',
      bn: 'আথার নূর ট্রাভেলস | হজ্জ, উমরাহ ও আন্তর্জাতিক ভ্রমণ',
      ar: 'أثر نور للسفر | الحج والعمرة والرحلات الدولية',
    },
    description: {
      en: "Bangladesh's trusted travel agency for Hajj, Umrah, international tours and air ticketing.",
      bn: 'হজ্জ, উমরাহ, আন্তর্জাতিক ট্যুর ও এয়ার টিকেটিং-এ বাংলাদেশের বিশ্বস্ত ট্রাভেল এজেন্সি।',
      ar: 'وكالة السفر الموثوقة في بنغلاديش للحج والعمرة والرحلات الدولية وحجز التذاكر.',
    },
  },
};

/**
 * Merging a partial document over these defaults is the job of
 * `normalizeSiteSettings` in lib/site-settings-normalize.ts. It replaced a
 * generic deep merge that used to live here: that merge was shape-blind, so a
 * document holding `brand: "oops"` (or a stale cache entry holding no `brand`
 * at all) produced a value that satisfied the type checker and then threw on
 * the first property read.
 */

/** Convenience for reading a Localized value with an English fallback. */
export function pickLocale(value: Localized, locale: string): string {
  const key = locale as keyof Localized;
  return value[key] || value.en || '';
}
