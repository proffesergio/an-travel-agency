// lib/validation/site-settings.ts
import { z } from 'zod';
import { LOCALES, NOTICE_PLACEMENTS, SOCIAL_PLATFORMS } from '@/lib/site-settings-shared';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const localizedSchema = z.object({
  en: z.string().max(600),
  bn: z.string().max(600),
  ar: z.string().max(600),
});

/** English is the fallback for every other locale, so it must not be blank. */
const requiredLocalizedSchema = localizedSchema.extend({
  en: z.string().min(1, 'English text is required').max(600),
});

export const brandSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(120),
  logoUrl: z.string().max(500).default(''),
  faviconUrl: z.string().max(500).default(''),
  ogImageUrl: z.string().max(500).default(''),
});

const phoneSchema = z.object({
  number: z.string().min(1, 'Display number is required').max(40),
  tel: z
    .string()
    .min(1, 'Dialable number is required')
    .max(20)
    .regex(/^\+?[0-9]+$/, 'Dialable number may only contain digits and a leading +'),
  countryCode: z.string().max(8).default(''),
  flag: z.string().max(8).default(''),
  country: z.string().max(8).default(''),
  enabled: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

export const contactSchema = z.object({
  email: z.email('Enter a valid email address').max(200),
  whatsappNumber: z
    .string()
    .min(6, 'WhatsApp number is required')
    .max(20)
    .regex(/^[0-9]+$/, 'WhatsApp number must be digits only, with no + or spaces'),
  phones: z.array(phoneSchema).max(10),
});

const officeSchema = z.object({
  label: requiredLocalizedSchema,
  address: requiredLocalizedSchema,
  phone: z.string().max(40).default(''),
  mapUrl: z.string().max(500).default(''),
  order: z.number().int().min(0).default(0),
});

export const officesSchema = z.object({
  offices: z.array(officeSchema).max(10),
});

const socialSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  url: z
    .url('Enter a valid URL including https://')
    .max(500)
    .refine((u) => /^https?:\/\//.test(u), 'URL must start with http:// or https://'),
  enabled: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

export const socialsSchema = z.object({
  socials: z.array(socialSchema).max(SOCIAL_PLATFORMS.length),
});

const paymentSchema = z.object({
  name: z.string().min(1, 'Payment name is required').max(60),
  label: z.string().min(1, 'Badge label is required').max(20),
  sub: z.string().max(20).default(''),
  bg: z.string().regex(HEX_COLOR, 'Background must be a hex colour like #1A1F71'),
  text: z.string().regex(HEX_COLOR, 'Text must be a hex colour like #ffffff'),
  enabled: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

export const paymentsSchema = z.object({
  payments: z.array(paymentSchema).max(20),
});

export const noticeSchema = z
  .object({
    enabled: z.boolean().default(false),
    text: localizedSchema,
    linkUrl: z
      .string()
      .max(500)
      .refine(
        (u) => u === '' || /^https?:\/\//.test(u) || u.startsWith('/'),
        'Link must start with http://, https://, or / for an internal link'
      )
      .default(''),
    placements: z.array(z.enum(NOTICE_PLACEMENTS)).default([]),
    startsAt: z.string().regex(ISO_DATE).or(z.literal('')).default(''),
    endsAt: z.string().regex(ISO_DATE).or(z.literal('')).default(''),
  })
  .refine((n) => !n.enabled || n.text.en.trim().length > 0, {
    message: 'English notice text is required when the notice is enabled',
    path: ['text', 'en'],
  })
  .refine((n) => !n.enabled || n.placements.length > 0, {
    message: 'Choose at least one placement when the notice is enabled',
    path: ['placements'],
  })
  .refine((n) => !n.startsAt || !n.endsAt || n.startsAt <= n.endsAt, {
    message: 'Start date must be on or before the end date',
    path: ['endsAt'],
  });

export const footerSchema = z.object({
  tagline: requiredLocalizedSchema,
  paymentNote: localizedSchema,
  rights: requiredLocalizedSchema,
  badgeLine: localizedSchema,
});

export const seoSchema = z.object({
  title: requiredLocalizedSchema,
  description: requiredLocalizedSchema,
});

/**
 * Each admin tab saves one section independently. The key is the section name
 * sent by the form; the value validates that section's payload.
 */
export const siteSettingsSectionSchemas = {
  brand: brandSchema,
  contact: contactSchema,
  offices: officesSchema,
  socials: socialsSchema,
  payments: paymentsSchema,
  notice: noticeSchema,
  footer: footerSchema,
  seo: seoSchema,
} as const;

export type SiteSettingsSection = keyof typeof siteSettingsSectionSchemas;

export const SITE_SETTINGS_SECTIONS = Object.keys(
  siteSettingsSectionSchemas
) as SiteSettingsSection[];

/** LOCALES is re-exported so forms can iterate locales without a second import. */
export { LOCALES };
