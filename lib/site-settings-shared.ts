// lib/site-settings-shared.ts

export const LOCALES = ['en', 'bn', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

/** A single piece of admin-editable text, in every supported language. */
export type Localized = Record<Locale, string>;

export const emptyLocalized = (): Localized => ({ en: '', bn: '', ar: '' });

/**
 * Social icons are React components and cannot live in the database, so the
 * platform is a closed enum that maps to an icon in Footer.tsx. Admins edit the
 * URL and the enabled flag; adding a new platform stays a code change.
 */
export const SOCIAL_PLATFORMS = [
  'facebook',
  'instagram',
  'youtube',
  'linkedin',
  'whatsapp',
  'telegram',
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
};

export const NOTICE_PLACEMENTS = ['top', 'footer'] as const;
export type NoticePlacement = (typeof NOTICE_PLACEMENTS)[number];

export interface PhoneEntry {
  /** Display form, e.g. "+88 01843 431743" */
  number: string;
  /** Dialable E.164 form used in tel: links, e.g. "+8801843431743" */
  tel: string;
  countryCode: string;
  flag: string;
  country: string;
  enabled: boolean;
  order: number;
}

export interface OfficeEntry {
  label: Localized;
  address: Localized;
  phone: string;
  mapUrl: string;
  order: number;
}

export interface SocialEntry {
  platform: SocialPlatform;
  url: string;
  enabled: boolean;
  order: number;
}

export interface PaymentEntry {
  /** Stable key + tooltip text, e.g. "Mastercard" */
  name: string;
  /** Badge face text, e.g. "MC" */
  label: string;
  /** Optional smaller trailing text, e.g. "MasterCard" */
  sub: string;
  /** Background colour, #rrggbb */
  bg: string;
  /** Foreground colour, #rrggbb */
  text: string;
  enabled: boolean;
  order: number;
}

export interface BrandSettings {
  companyName: string;
  logoUrl: string;
  faviconUrl: string;
  ogImageUrl: string;
}

export interface ContactSettings {
  email: string;
  /** Digits only, no '+' — used to build https://wa.me/<number> */
  whatsappNumber: string;
  phones: PhoneEntry[];
}

export interface NoticeSettings {
  enabled: boolean;
  text: Localized;
  linkUrl: string;
  placements: NoticePlacement[];
  /** ISO date string (YYYY-MM-DD) or '' for no bound */
  startsAt: string;
  endsAt: string;
}

export interface FooterSettings {
  tagline: Localized;
  paymentNote: Localized;
  rights: Localized;
  /** e.g. "ATAB Registered · Govt. Approved" */
  badgeLine: Localized;
}

export interface SeoSettings {
  title: Localized;
  description: Localized;
}

export interface SiteSettingsData {
  brand: BrandSettings;
  contact: ContactSettings;
  offices: OfficeEntry[];
  socials: SocialEntry[];
  payments: PaymentEntry[];
  notice: NoticeSettings;
  footer: FooterSettings;
  seo: SeoSettings;
}

/** Cache tag invalidated on every admin save. */
export const SITE_SETTINGS_TAG = 'site-settings';

/** _id of the one and only settings document. */
export const SITE_SETTINGS_ID = 'singleton';
