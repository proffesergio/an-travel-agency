# Admin Site Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin edit site-wide content — contact details, logo, favicon, offices, socials, payment badges, announcement notice, SEO defaults — from the admin panel, persisted to MongoDB and cached, instead of editing hardcoded values in the codebase.

**Architecture:** A single MongoDB "singleton" document holds all settings. `getSiteSettings()` deep-merges that document over a `DEFAULT_SITE_SETTINGS` constant containing today's exact hardcoded values, so the site renders identically before any admin edit. Reads go through `React cache()` (per-render dedupe) wrapping `unstable_cache` tagged `site-settings` (Vercel Data Cache, no TTL). Admin saves call `revalidateTag('site-settings')` to publish instantly.

**Tech Stack:** Next.js 16.2.4 (App Router), React 19.2.4, Mongoose 9, Zod 4, next-intl 4, Tailwind 4, NextAuth v5, Cloudinary. Deployed on Vercel.

**Spec:** `docs/superpowers/specs/2026-07-21-admin-site-settings-design.md`

## Global Constraints

- **Read the Next docs first.** Per `AGENTS.md`: "This is NOT the Next.js you know … Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices." This applies to every task touching `app/`.
- **No test framework exists.** `package.json` has only `dev`, `build`, `build:cpanel`, `start`, `start:standalone`, `lint`, `typecheck`. There is no jest/vitest/playwright config and no `tests/` directory. **This plan therefore does not use TDD.** The per-task verification cycle is `npm run typecheck` → `npm run lint` → targeted manual browser check. Adding a test framework is explicitly out of scope; the user chose manual testing.
- **Locales are exactly `['en', 'bn', 'ar']`**, default `'en'` (`i18n/routing.ts`). Arabic renders RTL.
- **The singleton `_id` is the literal string `'singleton'`.**
- **The cache tag is the literal string `'site-settings'`.** Defined once as `SITE_SETTINGS_TAG` and imported everywhere; never re-typed inline.
- **Never regress current rendering.** Every default value in Task 2 must be copied verbatim from the current source. With no DB document present the public site must be pixel-identical to today.
- **Existing i18n UI labels stay.** Only `footer.tagline`, `footer.address`, `footer.paymentNote`, `footer.rights` leave `messages/*.json`. `footer.quickLinks`, `footer.contact`, `footer.paymentMethods` remain.
- **Commit after every task.** Do not batch commits across tasks.

---

### Task 0: Install dependencies and capture the baseline

`node_modules/` is currently empty in this working copy — nothing can be typechecked or built until this runs.

**Files:**
- Modify: none (verification only)

**Interfaces:**
- Consumes: nothing
- Produces: a known-green baseline, so any later failure is attributable to this work

- [ ] **Step 1: Install dependencies**

```bash
npm ci
```

If `npm ci` fails because the lockfile is out of sync, use `npm install` and mention the lockfile change in the Task 0 commit.

- [ ] **Step 2: Record the baseline**

```bash
npm run typecheck
npm run lint
```

Expected: both pass. **If either already fails, stop and report the failures before writing any code** — they are pre-existing and must not be confused with regressions introduced later.

- [ ] **Step 3: Read the Next.js docs for the APIs this plan uses**

```bash
ls node_modules/next/dist/docs/
```

Read whatever covers `generateMetadata`, `unstable_cache`, `revalidateTag`, and Server Actions. Note any deprecation notice that contradicts this plan and raise it before proceeding.

- [ ] **Step 4: Capture the current footer rendering for later comparison**

```bash
npm run dev
```

Open `http://localhost:3000/en`, scroll to the footer, and screenshot it. Repeat for `/bn` and `/ar`. These screenshots are the reference for the Task 12 no-op check. Stop the dev server afterwards.

- [ ] **Step 5: Commit (only if the lockfile changed)**

```bash
git add package-lock.json
git commit -m "chore: sync lockfile"
```

If nothing changed, skip the commit.

---

### Task 1: Shared types and social platform registry

Pure types and constants, no I/O. Isolated here so every later task imports one canonical shape.

**Files:**
- Create: `lib/site-settings-shared.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `Locale`, `LOCALES`, `Localized`, `SOCIAL_PLATFORMS`, `SocialPlatform`, `NoticePlacement`, `PhoneEntry`, `OfficeEntry`, `SocialEntry`, `PaymentEntry`, `NoticeSettings`, `BrandSettings`, `ContactSettings`, `FooterSettings`, `SeoSettings`, `SiteSettingsData`, `SITE_SETTINGS_TAG`, `SITE_SETTINGS_ID`, `emptyLocalized`

This file is named `site-settings-shared.ts` to match the existing `lib/hotels-shared.ts` convention. It must contain **no imports from `mongoose`, `next`, or `react`** so it is safe to import from both client and server components.

- [ ] **Step 1: Create the shared types file**

```ts
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
```

- [ ] **Step 2: Verify it compiles**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/site-settings-shared.ts
git commit -m "feat(settings): add shared site settings types"
```

---

### Task 2: Defaults and the merge helper

The correctness keystone. Every value below is copied verbatim from the current source so the site cannot regress.

**Files:**
- Create: `lib/site-settings-defaults.ts`

**Interfaces:**
- Consumes: `SiteSettingsData` and friends from `lib/site-settings-shared.ts` (Task 1)
- Produces: `DEFAULT_SITE_SETTINGS: SiteSettingsData`, `mergeSiteSettings(defaults, partial): SiteSettingsData`

**Sources for these values — do not invent any:**
- `components/layout/Footer.tsx` — `PHONES` (lines 44-60), `SOCIALS` (62-89), `PAYMENT_METHODS` (92-117), the `mailto:` at line 227, the logo `src` at line 143, the badge line at line 154
- `messages/en.json`, `messages/bn.json`, `messages/ar.json` — the `footer` block
- `components/layout/WhatsAppButton.tsx:5` — `'966537311069'`

Note the commented-out second BD phone at `Footer.tsx:52` is **intentionally excluded** — it reflects the user's current working change.

- [ ] **Step 1: Create the defaults file**

```ts
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Deep-merge a partial settings document over the defaults.
 *
 * Arrays are replaced wholesale, never element-merged: if an admin deletes
 * every phone number, an empty array must survive rather than resurrecting
 * the defaults. Plain objects recurse, so a Localized value missing its 'ar'
 * key still falls back to the default Arabic string.
 */
export function mergeSiteSettings(
  defaults: SiteSettingsData,
  partial: unknown
): SiteSettingsData {
  if (!isPlainObject(partial)) return defaults;

  const merge = (base: unknown, override: unknown): unknown => {
    if (override === undefined || override === null) return base;
    if (Array.isArray(override)) return override;
    if (isPlainObject(base) && isPlainObject(override)) {
      const out: Record<string, unknown> = { ...base };
      for (const key of Object.keys(override)) {
        out[key] = merge(base[key], override[key]);
      }
      return out;
    }
    return override;
  };

  return merge(defaults, partial) as SiteSettingsData;
}

/** Convenience for reading a Localized value with an English fallback. */
export function pickLocale(value: Localized, locale: string): string {
  const key = locale as keyof Localized;
  return value[key] || value.en || '';
}
```

- [ ] **Step 2: Verify defaults match the current source exactly**

Open `components/layout/Footer.tsx` and `messages/*.json` side by side and confirm every string above is character-identical. Pay attention to the em-dash in `paymentNote` and the `·` separator in `badgeLine`.

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/site-settings-defaults.ts
git commit -m "feat(settings): add site settings defaults and merge helper"
```

---

### Task 3: Zod validation schema

**Files:**
- Create: `lib/validation/site-settings.ts`

**Interfaces:**
- Consumes: constants from `lib/site-settings-shared.ts` (Task 1)
- Produces: `localizedSchema`, `brandSchema`, `contactSchema`, `officesSchema`, `socialsSchema`, `paymentsSchema`, `noticeSchema`, `footerSchema`, `seoSchema`, `siteSettingsSectionSchemas`, `type SiteSettingsSection`

Follows the `lib/validation/hotel.ts` pattern (Zod 4, message-first errors).

- [ ] **Step 1: Create the schema file**

```ts
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
  url: z.url('Enter a valid URL including https://').max(500),
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
    linkUrl: z.string().max(500).default(''),
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
```

- [ ] **Step 2: Confirm the Zod 4 API surface used here is correct**

Zod 4 moved `z.string().email()` and `.url()` to top-level `z.email()` / `z.url()`. Confirm against the installed version:

```bash
node -e "const {z}=require('zod'); console.log(typeof z.email, typeof z.url, require('zod/package.json').version)"
```

Expected: `function function 4.x.x`. If `z.email` is `undefined`, fall back to `z.string().email(...)` / `z.string().url(...)` throughout this file.

- [ ] **Step 3: Verify**

```bash
npm run typecheck
npm run lint
```

Expected: both PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/validation/site-settings.ts
git commit -m "feat(settings): add zod schemas for site settings sections"
```

---

### Task 4: Mongoose model

**Files:**
- Create: `models/SiteSettings.ts`

**Interfaces:**
- Consumes: types from `lib/site-settings-shared.ts` (Task 1)
- Produces: default export `SiteSettings` (a `Model<ISiteSettings>`)

Follows the `models/Hotel.ts` pattern. `_id` is a `String`, not an ObjectId, because there is exactly one document keyed `'singleton'`.

- [ ] **Step 1: Create the model**

```ts
// models/SiteSettings.ts
import mongoose, { Schema, Model } from 'mongoose';
import type { SiteSettingsData } from '@/lib/site-settings-shared';
import { SOCIAL_PLATFORMS, NOTICE_PLACEMENTS } from '@/lib/site-settings-shared';

export interface ISiteSettings extends SiteSettingsData {
  _id: string;
  updatedAt: Date;
  updatedBy: string;
}

const localizedSchema = new Schema(
  {
    en: { type: String, default: '' },
    bn: { type: String, default: '' },
    ar: { type: String, default: '' },
  },
  { _id: false }
);

const phoneSchema = new Schema(
  {
    number: { type: String, default: '' },
    tel: { type: String, default: '' },
    countryCode: { type: String, default: '' },
    flag: { type: String, default: '' },
    country: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const officeSchema = new Schema(
  {
    label: { type: localizedSchema, default: () => ({}) },
    address: { type: localizedSchema, default: () => ({}) },
    phone: { type: String, default: '' },
    mapUrl: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const socialSchema = new Schema(
  {
    platform: { type: String, enum: SOCIAL_PLATFORMS, required: true },
    url: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const paymentSchema = new Schema(
  {
    name: { type: String, default: '' },
    label: { type: String, default: '' },
    sub: { type: String, default: '' },
    bg: { type: String, default: '#ffffff' },
    text: { type: String, default: '#000000' },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const siteSettingsSchema = new Schema<ISiteSettings>(
  {
    _id: { type: String, required: true },
    brand: {
      companyName: { type: String, default: '' },
      logoUrl: { type: String, default: '' },
      faviconUrl: { type: String, default: '' },
      ogImageUrl: { type: String, default: '' },
    },
    contact: {
      email: { type: String, default: '' },
      whatsappNumber: { type: String, default: '' },
      phones: { type: [phoneSchema], default: undefined },
    },
    offices: { type: [officeSchema], default: undefined },
    socials: { type: [socialSchema], default: undefined },
    payments: { type: [paymentSchema], default: undefined },
    notice: {
      enabled: { type: Boolean, default: false },
      text: { type: localizedSchema, default: () => ({}) },
      linkUrl: { type: String, default: '' },
      placements: { type: [String], enum: NOTICE_PLACEMENTS, default: undefined },
      startsAt: { type: String, default: '' },
      endsAt: { type: String, default: '' },
    },
    footer: {
      tagline: { type: localizedSchema, default: () => ({}) },
      paymentNote: { type: localizedSchema, default: () => ({}) },
      rights: { type: localizedSchema, default: () => ({}) },
      badgeLine: { type: localizedSchema, default: () => ({}) },
    },
    seo: {
      title: { type: localizedSchema, default: () => ({}) },
      description: { type: localizedSchema, default: () => ({}) },
    },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true, _id: false, minimize: false }
);

const SiteSettings: Model<ISiteSettings> =
  (mongoose.models.SiteSettings as Model<ISiteSettings>) ||
  mongoose.model<ISiteSettings>('SiteSettings', siteSettingsSchema);

export default SiteSettings;
```

`default: undefined` on the array fields is deliberate: it keeps Mongoose from writing `[]` for a section the admin has never touched, so `mergeSiteSettings` can supply the defaults instead. Once the admin *does* save an empty array, that empty array is stored and honoured.

- [ ] **Step 2: Verify**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add models/SiteSettings.ts
git commit -m "feat(settings): add SiteSettings mongoose model"
```

---

### Task 5: Service layer with the cache

The heart of the feature.

**Files:**
- Create: `lib/services/site-settings.ts`

**Interfaces:**
- Consumes: `SiteSettings` (Task 4), `DEFAULT_SITE_SETTINGS` + `mergeSiteSettings` (Task 2), `SITE_SETTINGS_TAG` + `SITE_SETTINGS_ID` (Task 1), `connectDB` from `@/lib/mongodb`
- Produces: `getSiteSettings(): Promise<SiteSettingsData>`, `saveSiteSettingsSection(section, value, updatedBy): Promise<void>`

Follows the `lib/services/hotels.ts` pattern.

- [ ] **Step 1: Create the service**

```ts
// lib/services/site-settings.ts
import 'server-only';
import { cache } from 'react';
import { unstable_cache, revalidateTag } from 'next/cache';
import { connectDB } from '@/lib/mongodb';
import SiteSettings from '@/models/SiteSettings';
import {
  SITE_SETTINGS_ID,
  SITE_SETTINGS_TAG,
  type SiteSettingsData,
} from '@/lib/site-settings-shared';
import { DEFAULT_SITE_SETTINGS, mergeSiteSettings } from '@/lib/site-settings-defaults';

/**
 * Reads the singleton document. Throws on database failure — the caller
 * decides how to degrade. Keeping the throw here means unstable_cache never
 * stores a failed read.
 */
async function fetchSiteSettings(): Promise<SiteSettingsData> {
  await connectDB();
  const doc = await SiteSettings.findById(SITE_SETTINGS_ID).lean().exec();
  if (!doc) return DEFAULT_SITE_SETTINGS;
  return mergeSiteSettings(DEFAULT_SITE_SETTINGS, doc);
}

/**
 * Persistent layer: Vercel's Data Cache, shared across every instance and
 * region. No `revalidate` is set, so this is invalidated *only* by an admin
 * save calling revalidateTag(SITE_SETTINGS_TAG). MongoDB therefore sees
 * roughly one query per edit rather than one per page view.
 */
const getCachedSiteSettings = unstable_cache(fetchSiteSettings, ['site-settings'], {
  tags: [SITE_SETTINGS_TAG],
});

/**
 * Per-render layer: React cache() dedupes so the layout, the footer and
 * generateMetadata share a single call within one render pass.
 *
 * The try/catch lives out here, *outside* unstable_cache, so a transient
 * MongoDB outage degrades to defaults for that request without poisoning the
 * cache. Were it inside, one blip would pin the site to defaults until the
 * next admin save — potentially forever, since there is no TTL.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettingsData> => {
  try {
    return await getCachedSiteSettings();
  } catch (error) {
    console.error('[site-settings] read failed, serving defaults', error);
    return DEFAULT_SITE_SETTINGS;
  }
});

/**
 * Upserts one section and publishes it. `value` must already be Zod-validated
 * by the caller.
 */
export async function saveSiteSettingsSection(
  section: string,
  value: unknown,
  updatedBy: string
): Promise<void> {
  await connectDB();
  await SiteSettings.findByIdAndUpdate(
    SITE_SETTINGS_ID,
    { $set: { [section]: value, updatedBy } },
    { upsert: true, new: true, setDefaultsOnInsert: false }
  ).exec();

  revalidateTag(SITE_SETTINGS_TAG);
}
```

Note the `offices`, `socials` and `payments` sections are stored at the document root as arrays, while their Zod schemas wrap them in an object (`{ offices: [...] }`). Task 6 unwraps before calling this — `saveSiteSettingsSection('offices', parsed.offices, …)`.

- [ ] **Step 2: Confirm `server-only` is installed**

```bash
node -e "require.resolve('server-only'); console.log('ok')"
```

If it throws, either `npm install server-only` (and commit the lockfile with this task) or delete the `import 'server-only';` line. Do not leave a broken import.

- [ ] **Step 3: Verify**

```bash
npm run typecheck
npm run lint
```

Expected: both PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/services/site-settings.ts package.json package-lock.json
git commit -m "feat(settings): add cached site settings service"
```

---

### Task 6: Server actions

**Files:**
- Create: `app/admin/(dashboard)/settings/actions.ts`

**Interfaces:**
- Consumes: `siteSettingsSectionSchemas` (Task 3), `saveSiteSettingsSection` (Task 5), `auth` from `@/lib/auth`
- Produces: `saveSiteSettings(prevState, formData): Promise<SettingsActionState>`, `type SettingsActionState`

Follows the `'use server'` + `auth()` guard pattern from `app/admin/(dashboard)/packages/actions.ts`.

The form serialises its section payload as a single JSON string field named `payload`. This avoids hand-rolling `FormData` parsing for nested arrays and localized objects.

- [ ] **Step 1: Create the action**

```ts
// app/admin/(dashboard)/settings/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { saveSiteSettingsSection } from '@/lib/services/site-settings';
import {
  siteSettingsSectionSchemas,
  type SiteSettingsSection,
} from '@/lib/validation/site-settings';

export interface SettingsActionState {
  ok: boolean;
  message: string;
  /** Field path -> first error message, e.g. { 'phones.0.tel': 'Dialable...' } */
  errors: Record<string, string>;
}

export const emptySettingsActionState: SettingsActionState = {
  ok: false,
  message: '',
  errors: {},
};

/** Sections whose schema wraps the array in an object of the same name. */
const WRAPPED_SECTIONS = new Set(['offices', 'socials', 'payments']);

export async function saveSiteSettings(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const session = await auth();
  if (!session) {
    return { ok: false, message: 'Unauthorized', errors: {} };
  }

  const section = String(formData.get('section') ?? '') as SiteSettingsSection;
  const schema = siteSettingsSectionSchemas[section];
  if (!schema) {
    return { ok: false, message: `Unknown settings section: ${section}`, errors: {} };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get('payload') ?? 'null'));
  } catch {
    return { ok: false, message: 'Could not read the submitted form data.', errors: {} };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.');
      if (!errors[path]) errors[path] = issue.message;
    }
    return { ok: false, message: 'Please fix the highlighted fields.', errors };
  }

  const value = WRAPPED_SECTIONS.has(section)
    ? (parsed.data as Record<string, unknown>)[section]
    : parsed.data;

  try {
    await saveSiteSettingsSection(section, value, session.user?.email ?? 'unknown');
  } catch (error) {
    console.error('[settings] save failed', error);
    return { ok: false, message: 'Could not save. Please try again.', errors: {} };
  }

  revalidatePath('/admin/settings');
  return { ok: true, message: 'Saved. The public site is updated.', errors: {} };
}
```

- [ ] **Step 2: Verify**

```bash
npm run typecheck
npm run lint
```

Expected: both PASS.

- [ ] **Step 3: Commit**

```bash
git add "app/admin/(dashboard)/settings/actions.ts"
git commit -m "feat(settings): add site settings server action"
```

---

### Task 7: Shared admin form components

**Files:**
- Create: `components/admin/LocalizedField.tsx`
- Create: `components/admin/RepeatableList.tsx`
- Create: `components/admin/ImageUploadField.tsx`

**Interfaces:**
- Consumes: `LOCALES`, `Localized` (Task 1)
- Produces:
  - `<LocalizedField label value onChange multiline? error? />` where `value: Localized`, `onChange: (next: Localized) => void`
  - `<RepeatableList items renderItem onAdd onRemove onMove addLabel emptyLabel />`
  - `<ImageUploadField label value onChange hint? />` where `value: string` (a URL)

All three are `'use client'`.

- [ ] **Step 1: Create LocalizedField**

```tsx
// components/admin/LocalizedField.tsx
'use client';

import { useState } from 'react';
import { LOCALES, type Locale, type Localized } from '@/lib/site-settings-shared';

const LOCALE_LABELS: Record<Locale, string> = { en: 'English', bn: 'বাংলা', ar: 'العربية' };

export default function LocalizedField({
  label,
  value,
  onChange,
  multiline = false,
  error,
}: {
  label: string;
  value: Localized;
  onChange: (next: Localized) => void;
  multiline?: boolean;
  error?: string;
}) {
  const [active, setActive] = useState<Locale>('en');
  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2d6a4f] focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]';

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex gap-1">
          {LOCALES.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => setActive(locale)}
              className={`px-2 py-0.5 text-xs rounded-md transition-colors ${
                active === locale
                  ? 'bg-[#2d6a4f] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {LOCALE_LABELS[locale]}
            </button>
          ))}
        </div>
      </div>

      {multiline ? (
        <textarea
          rows={3}
          dir={active === 'ar' ? 'rtl' : 'ltr'}
          className={inputClass}
          value={value[active] ?? ''}
          onChange={(e) => onChange({ ...value, [active]: e.target.value })}
        />
      ) : (
        <input
          type="text"
          dir={active === 'ar' ? 'rtl' : 'ltr'}
          className={inputClass}
          value={value[active] ?? ''}
          onChange={(e) => onChange({ ...value, [active]: e.target.value })}
        />
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {active !== 'en' && !value.en && (
        <p className="mt-1 text-xs text-amber-600">
          English is the fallback for every other language — fill it in first.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create RepeatableList**

```tsx
// components/admin/RepeatableList.tsx
'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

export default function RepeatableList<T>({
  items,
  renderItem,
  onAdd,
  onRemove,
  onMove,
  addLabel,
  emptyLabel,
  canAdd = true,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  addLabel: string;
  emptyLabel: string;
  canAdd?: boolean;
}) {
  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-sm text-gray-500 italic py-3">{emptyLabel}</p>
      )}

      {items.map((item, index) => (
        <div key={index} className="rounded-lg border border-gray-200 p-4 bg-gray-50/60">
          <div className="flex justify-end gap-1 mb-2">
            <button
              type="button"
              onClick={() => onMove(index, -1)}
              disabled={index === 0}
              aria-label="Move up"
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-30"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onMove(index, 1)}
              disabled={index === items.length - 1}
              aria-label="Move down"
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-30"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label="Remove"
              className="p-1.5 rounded-md text-red-500 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          {renderItem(item, index)}
        </div>
      ))}

      {canAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2d6a4f] hover:text-[#1b4332]"
        >
          <Plus className="w-4 h-4" /> {addLabel}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create ImageUploadField**

Reuses the existing `POST /api/upload` route, which returns `{ url, publicId }` and is already `auth()`-guarded.

```tsx
// components/admin/ImageUploadField.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';

export default function ImageUploadField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      onChange(data.url as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>

      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative w-20 h-20 rounded-lg border border-gray-200 bg-white overflow-hidden">
            <Image src={value} alt={label} fill sizes="80px" className="object-contain p-1" />
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="Remove image"
              className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-white/90 text-red-500 shadow"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="w-20 h-20 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-300">
            <Upload className="w-5 h-5" />
          </div>
        )}

        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading…' : 'Choose image'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      {hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Verify the Cloudinary URL is allowed by next/image**

`next.config.ts` already lists `res.cloudinary.com` under `images.remotePatterns`, so uploaded previews render. Confirm by reading lines 16-28 of `next.config.ts`. No change needed.

- [ ] **Step 5: Verify**

```bash
npm run typecheck
npm run lint
```

Expected: both PASS.

- [ ] **Step 6: Commit**

```bash
git add components/admin/LocalizedField.tsx components/admin/RepeatableList.tsx components/admin/ImageUploadField.tsx
git commit -m "feat(settings): add shared admin form components"
```

---

### Task 8: Admin settings form and tabbed page

The largest task. Split across two files so neither grows unwieldy: the page stays a server component that loads data, and the form is one client component.

**Files:**
- Create: `components/admin/SiteSettingsForm.tsx`
- Modify: `app/admin/(dashboard)/settings/page.tsx` (whole file rewritten)

**Interfaces:**
- Consumes: `getSiteSettings` (Task 5), `saveSiteSettings` + `emptySettingsActionState` (Task 6), the three components from Task 7, types from Task 1
- Produces: the admin UI; no exports other tasks depend on

- [ ] **Step 1: Create the form component**

```tsx
// components/admin/SiteSettingsForm.tsx
'use client';

import { useActionState, useState } from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import LocalizedField from '@/components/admin/LocalizedField';
import RepeatableList from '@/components/admin/RepeatableList';
import ImageUploadField from '@/components/admin/ImageUploadField';
import {
  saveSiteSettings,
  emptySettingsActionState,
  type SettingsActionState,
} from '@/app/admin/(dashboard)/settings/actions';
import {
  SOCIAL_PLATFORMS,
  SOCIAL_LABELS,
  NOTICE_PLACEMENTS,
  emptyLocalized,
  type NoticePlacement,
  type SiteSettingsData,
  type SocialPlatform,
} from '@/lib/site-settings-shared';

const INPUT =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2d6a4f] focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]';
const LABEL = 'block text-sm font-medium text-gray-700 mb-1.5';

function SaveBar({ state, pending }: { state: SettingsActionState; pending: boolean }) {
  return (
    <div className="flex items-center gap-3 pt-5 mt-5 border-t border-gray-100">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2d6a4f] text-white text-sm font-medium hover:bg-[#1b4332] disabled:opacity-60"
      >
        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        {pending ? 'Saving…' : 'Save changes'}
      </button>
      {state.message && (
        <span
          className={`inline-flex items-center gap-1.5 text-sm ${
            state.ok ? 'text-green-700' : 'text-red-600'
          }`}
        >
          {state.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {state.message}
        </span>
      )}
    </div>
  );
}

/** One tab = one <form> = one independent save. */
function SectionForm({
  section,
  payload,
  children,
}: {
  section: string;
  payload: unknown;
  children: (state: SettingsActionState) => React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(saveSiteSettings, emptySettingsActionState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="section" value={section} />
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />
      {children(state)}
      <SaveBar state={state} pending={pending} />
    </form>
  );
}

export default function SiteSettingsForm({ initial }: { initial: SiteSettingsData }) {
  const [tab, setTab] = useState<string>('brand');
  const [data, setData] = useState<SiteSettingsData>(initial);

  const set = <K extends keyof SiteSettingsData>(key: K, value: SiteSettingsData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  // Constrained to `{ order: number }` so the reindexing spread below stays
  // assignable to T[] — an unconstrained <T> would produce T & { order: number }
  // and fail typecheck.
  const move = <T extends { order: number }>(
    list: T[],
    index: number,
    direction: -1 | 1
  ): T[] => {
    const next = [...list];
    const target = index + direction;
    if (target < 0 || target >= next.length) return next;
    [next[index], next[target]] = [next[target], next[index]];
    return next.map((item, i) => ({ ...item, order: i }));
  };

  const TABS = [
    { id: 'brand', label: 'Brand' },
    { id: 'contact', label: 'Contact' },
    { id: 'offices', label: 'Offices' },
    { id: 'socials', label: 'Social' },
    { id: 'payments', label: 'Payments' },
    { id: 'notice', label: 'Notice' },
    { id: 'seo', label: 'SEO' },
    { id: 'footer', label: 'Footer text' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="flex flex-wrap gap-1 border-b border-gray-200 px-3 pt-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t.id
                ? 'bg-[#2d6a4f]/10 text-[#2d6a4f]'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {tab === 'brand' && (
          <SectionForm section="brand" payload={data.brand}>
            {() => (
              <>
                <div>
                  <label className={LABEL}>Company name</label>
                  <input
                    className={INPUT}
                    value={data.brand.companyName}
                    onChange={(e) => set('brand', { ...data.brand, companyName: e.target.value })}
                  />
                </div>
                <ImageUploadField
                  label="Logo"
                  value={data.brand.logoUrl}
                  onChange={(url) => set('brand', { ...data.brand, logoUrl: url })}
                  hint="Shown in the footer. Wide transparent PNG works best. Leave empty to use /ATHAR-NUR-Logo.png."
                />
                <ImageUploadField
                  label="Favicon"
                  value={data.brand.faviconUrl}
                  onChange={(url) => set('brand', { ...data.brand, faviconUrl: url })}
                  hint="Square PNG, 512×512. Leave empty to use the bundled /favicon.ico."
                />
                <ImageUploadField
                  label="Social share image"
                  value={data.brand.ogImageUrl}
                  onChange={(url) => set('brand', { ...data.brand, ogImageUrl: url })}
                  hint="Shown when a link is shared on Facebook or WhatsApp. 1200×630."
                />
              </>
            )}
          </SectionForm>
        )}

        {tab === 'contact' && (
          <SectionForm section="contact" payload={data.contact}>
            {(state) => (
              <>
                <div>
                  <label className={LABEL}>Contact email</label>
                  <input
                    className={INPUT}
                    value={data.contact.email}
                    onChange={(e) => set('contact', { ...data.contact, email: e.target.value })}
                  />
                  {state.errors.email && (
                    <p className="mt-1 text-xs text-red-600">{state.errors.email}</p>
                  )}
                </div>
                <div>
                  <label className={LABEL}>WhatsApp number (digits only)</label>
                  <input
                    className={INPUT}
                    value={data.contact.whatsappNumber}
                    onChange={(e) =>
                      set('contact', { ...data.contact, whatsappNumber: e.target.value })
                    }
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Drives the floating WhatsApp button, e.g. 966537311069 — no + and no spaces.
                  </p>
                  {state.errors.whatsappNumber && (
                    <p className="mt-1 text-xs text-red-600">{state.errors.whatsappNumber}</p>
                  )}
                </div>

                <div>
                  <label className={LABEL}>Phone numbers</label>
                  <RepeatableList
                    items={data.contact.phones}
                    addLabel="Add phone number"
                    emptyLabel="No phone numbers — the footer contact list will be empty."
                    onAdd={() =>
                      set('contact', {
                        ...data.contact,
                        phones: [
                          ...data.contact.phones,
                          {
                            number: '',
                            tel: '',
                            countryCode: '',
                            flag: '',
                            country: '',
                            enabled: true,
                            order: data.contact.phones.length,
                          },
                        ],
                      })
                    }
                    onRemove={(i) =>
                      set('contact', {
                        ...data.contact,
                        phones: data.contact.phones.filter((_, idx) => idx !== i),
                      })
                    }
                    onMove={(i, d) =>
                      set('contact', { ...data.contact, phones: move(data.contact.phones, i, d) })
                    }
                    renderItem={(phone, i) => (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500">Display text</label>
                          <input
                            className={INPUT}
                            placeholder="+88 01843 431743"
                            value={phone.number}
                            onChange={(e) => {
                              const phones = [...data.contact.phones];
                              phones[i] = { ...phone, number: e.target.value };
                              set('contact', { ...data.contact, phones });
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Dialable (tel:)</label>
                          <input
                            className={INPUT}
                            placeholder="+8801843431743"
                            value={phone.tel}
                            onChange={(e) => {
                              const phones = [...data.contact.phones];
                              phones[i] = { ...phone, tel: e.target.value };
                              set('contact', { ...data.contact, phones });
                            }}
                          />
                          {state.errors[`phones.${i}.tel`] && (
                            <p className="mt-1 text-xs text-red-600">
                              {state.errors[`phones.${i}.tel`]}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Flag emoji</label>
                          <input
                            className={INPUT}
                            placeholder="🇧🇩"
                            value={phone.flag}
                            onChange={(e) => {
                              const phones = [...data.contact.phones];
                              phones[i] = { ...phone, flag: e.target.value };
                              set('contact', { ...data.contact, phones });
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Country label</label>
                          <input
                            className={INPUT}
                            placeholder="BD"
                            value={phone.country}
                            onChange={(e) => {
                              const phones = [...data.contact.phones];
                              phones[i] = { ...phone, country: e.target.value };
                              set('contact', { ...data.contact, phones });
                            }}
                          />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={phone.enabled}
                            onChange={(e) => {
                              const phones = [...data.contact.phones];
                              phones[i] = { ...phone, enabled: e.target.checked };
                              set('contact', { ...data.contact, phones });
                            }}
                          />
                          Show on the website
                        </label>
                      </div>
                    )}
                  />
                </div>
              </>
            )}
          </SectionForm>
        )}

        {tab === 'offices' && (
          <SectionForm section="offices" payload={{ offices: data.offices }}>
            {() => (
              <RepeatableList
                items={data.offices}
                addLabel="Add office"
                emptyLabel="No offices — the footer address bar will be hidden."
                onAdd={() =>
                  set('offices', [
                    ...data.offices,
                    {
                      label: emptyLocalized(),
                      address: emptyLocalized(),
                      phone: '',
                      mapUrl: '',
                      order: data.offices.length,
                    },
                  ])
                }
                onRemove={(i) => set('offices', data.offices.filter((_, idx) => idx !== i))}
                onMove={(i, d) => set('offices', move(data.offices, i, d))}
                renderItem={(office, i) => (
                  <div className="space-y-3">
                    <LocalizedField
                      label="Office name"
                      value={office.label}
                      onChange={(label) => {
                        const offices = [...data.offices];
                        offices[i] = { ...office, label };
                        set('offices', offices);
                      }}
                    />
                    <LocalizedField
                      label="Address"
                      multiline
                      value={office.address}
                      onChange={(address) => {
                        const offices = [...data.offices];
                        offices[i] = { ...office, address };
                        set('offices', offices);
                      }}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500">Phone (optional)</label>
                        <input
                          className={INPUT}
                          value={office.phone}
                          onChange={(e) => {
                            const offices = [...data.offices];
                            offices[i] = { ...office, phone: e.target.value };
                            set('offices', offices);
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Map link (optional)</label>
                        <input
                          className={INPUT}
                          value={office.mapUrl}
                          onChange={(e) => {
                            const offices = [...data.offices];
                            offices[i] = { ...office, mapUrl: e.target.value };
                            set('offices', offices);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              />
            )}
          </SectionForm>
        )}

        {tab === 'socials' && (
          <SectionForm section="socials" payload={{ socials: data.socials }}>
            {() => (
              <RepeatableList
                items={data.socials}
                canAdd={data.socials.length < SOCIAL_PLATFORMS.length}
                addLabel="Add social link"
                emptyLabel="No social links."
                onAdd={() => {
                  const used = new Set(data.socials.map((s) => s.platform));
                  const next = SOCIAL_PLATFORMS.find((p) => !used.has(p));
                  if (!next) return;
                  set('socials', [
                    ...data.socials,
                    { platform: next, url: '', enabled: true, order: data.socials.length },
                  ]);
                }}
                onRemove={(i) => set('socials', data.socials.filter((_, idx) => idx !== i))}
                onMove={(i, d) => set('socials', move(data.socials, i, d))}
                renderItem={(social, i) => (
                  <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3 items-start">
                    <div>
                      <label className="text-xs text-gray-500">Platform</label>
                      <select
                        className={INPUT}
                        value={social.platform}
                        onChange={(e) => {
                          const socials = [...data.socials];
                          socials[i] = { ...social, platform: e.target.value as SocialPlatform };
                          set('socials', socials);
                        }}
                      >
                        {SOCIAL_PLATFORMS.map((p) => (
                          <option key={p} value={p}>
                            {SOCIAL_LABELS[p]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">URL</label>
                      <input
                        className={INPUT}
                        placeholder="https://…"
                        value={social.url}
                        onChange={(e) => {
                          const socials = [...data.socials];
                          socials[i] = { ...social, url: e.target.value };
                          set('socials', socials);
                        }}
                      />
                      <label className="mt-2 flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={social.enabled}
                          onChange={(e) => {
                            const socials = [...data.socials];
                            socials[i] = { ...social, enabled: e.target.checked };
                            set('socials', socials);
                          }}
                        />
                        Show on the website
                      </label>
                    </div>
                  </div>
                )}
              />
            )}
          </SectionForm>
        )}

        {tab === 'payments' && (
          <SectionForm section="payments" payload={{ payments: data.payments }}>
            {() => (
              <RepeatableList
                items={data.payments}
                addLabel="Add payment badge"
                emptyLabel="No payment badges."
                onAdd={() =>
                  set('payments', [
                    ...data.payments,
                    {
                      name: '',
                      label: '',
                      sub: '',
                      bg: '#2d6a4f',
                      text: '#ffffff',
                      enabled: true,
                      order: data.payments.length,
                    },
                  ])
                }
                onRemove={(i) => set('payments', data.payments.filter((_, idx) => idx !== i))}
                onMove={(i, d) => set('payments', move(data.payments, i, d))}
                renderItem={(pay, i) => {
                  const update = (patch: Partial<typeof pay>) => {
                    const payments = [...data.payments];
                    payments[i] = { ...pay, ...patch };
                    set('payments', payments);
                  };
                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-gray-500">Name (tooltip)</label>
                          <input
                            className={INPUT}
                            value={pay.name}
                            onChange={(e) => update({ name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Badge text</label>
                          <input
                            className={INPUT}
                            value={pay.label}
                            onChange={(e) => update({ label: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Small suffix</label>
                          <input
                            className={INPUT}
                            value={pay.sub}
                            onChange={(e) => update({ sub: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap items-end gap-4">
                        <div>
                          <label className="text-xs text-gray-500 block">Background</label>
                          <input
                            type="color"
                            className="h-9 w-16 rounded border border-gray-300"
                            value={pay.bg}
                            onChange={(e) => update({ bg: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block">Text</label>
                          <input
                            type="color"
                            className="h-9 w-16 rounded border border-gray-300"
                            value={pay.text}
                            onChange={(e) => update({ text: e.target.value })}
                          />
                        </div>
                        <div
                          className="flex items-center justify-center min-w-[68px] h-10 px-3 rounded-lg ring-1 ring-black/10 font-extrabold text-xs"
                          style={{ backgroundColor: pay.bg, color: pay.text }}
                        >
                          <span className="leading-none">{pay.label || '—'}</span>
                          {pay.sub && (
                            <span className="ml-1 text-[10px] font-semibold opacity-80 leading-none">
                              {pay.sub}
                            </span>
                          )}
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={pay.enabled}
                            onChange={(e) => update({ enabled: e.target.checked })}
                          />
                          Show
                        </label>
                      </div>
                    </div>
                  );
                }}
              />
            )}
          </SectionForm>
        )}

        {tab === 'notice' && (
          <SectionForm section="notice" payload={data.notice}>
            {(state) => (
              <>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={data.notice.enabled}
                    onChange={(e) => set('notice', { ...data.notice, enabled: e.target.checked })}
                  />
                  Show the notice on the website
                </label>

                <LocalizedField
                  label="Notice text"
                  multiline
                  value={data.notice.text}
                  onChange={(text) => set('notice', { ...data.notice, text })}
                  error={state.errors['text.en']}
                />

                <div>
                  <label className={LABEL}>Placement</label>
                  <div className="flex gap-4">
                    {NOTICE_PLACEMENTS.map((place) => (
                      <label key={place} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={data.notice.placements.includes(place)}
                          onChange={(e) => {
                            const placements = e.target.checked
                              ? [...data.notice.placements, place]
                              : data.notice.placements.filter((p) => p !== place);
                            set('notice', { ...data.notice, placements: placements as NoticePlacement[] });
                          }}
                        />
                        {place === 'top' ? 'Top bar (above the menu)' : 'Footer block'}
                      </label>
                    ))}
                  </div>
                  {state.errors.placements && (
                    <p className="mt-1 text-xs text-red-600">{state.errors.placements}</p>
                  )}
                </div>

                <div>
                  <label className={LABEL}>Link (optional)</label>
                  <input
                    className={INPUT}
                    placeholder="/en/hajj-2027-pre-registration"
                    value={data.notice.linkUrl}
                    onChange={(e) => set('notice', { ...data.notice, linkUrl: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Show from (optional)</label>
                    <input
                      type="date"
                      className={INPUT}
                      value={data.notice.startsAt}
                      onChange={(e) => set('notice', { ...data.notice, startsAt: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Show until (optional)</label>
                    <input
                      type="date"
                      className={INPUT}
                      value={data.notice.endsAt}
                      onChange={(e) => set('notice', { ...data.notice, endsAt: e.target.value })}
                    />
                    {state.errors.endsAt && (
                      <p className="mt-1 text-xs text-red-600">{state.errors.endsAt}</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </SectionForm>
        )}

        {tab === 'seo' && (
          <SectionForm section="seo" payload={data.seo}>
            {(state) => (
              <>
                <LocalizedField
                  label="Site title"
                  value={data.seo.title}
                  onChange={(title) => set('seo', { ...data.seo, title })}
                  error={state.errors['title.en']}
                />
                <LocalizedField
                  label="Meta description"
                  multiline
                  value={data.seo.description}
                  onChange={(description) => set('seo', { ...data.seo, description })}
                  error={state.errors['description.en']}
                />
                <p className="text-xs text-gray-500">
                  Pages with their own title (payment, Hajj 2027 pre-registration) keep it and gain
                  “ | {data.brand.companyName}” as a suffix.
                </p>
              </>
            )}
          </SectionForm>
        )}

        {tab === 'footer' && (
          <SectionForm section="footer" payload={data.footer}>
            {(state) => (
              <>
                <LocalizedField
                  label="Tagline"
                  multiline
                  value={data.footer.tagline}
                  onChange={(tagline) => set('footer', { ...data.footer, tagline })}
                  error={state.errors['tagline.en']}
                />
                <LocalizedField
                  label="Accreditation line"
                  value={data.footer.badgeLine}
                  onChange={(badgeLine) => set('footer', { ...data.footer, badgeLine })}
                />
                <LocalizedField
                  label="Payment note"
                  multiline
                  value={data.footer.paymentNote}
                  onChange={(paymentNote) => set('footer', { ...data.footer, paymentNote })}
                />
                <LocalizedField
                  label="Copyright line"
                  value={data.footer.rights}
                  onChange={(rights) => set('footer', { ...data.footer, rights })}
                  error={state.errors['rights.en']}
                />
              </>
            )}
          </SectionForm>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite the settings page**

Keep the existing integrations-health section verbatim as a "System" panel below the new form, with two changes: drop the `whatsapp` entry from `checkIntegrations()` (nothing reads `NEXT_PUBLIC_WHATSAPP_NUMBER` — see Task 10) and delete the trailing "Public WhatsApp Number" `<section>` at the bottom, now replaced by the Contact tab.

```tsx
// app/admin/(dashboard)/settings/page.tsx
import { auth } from '@/lib/auth';
import { CheckCircle2, XCircle, Settings as SettingsIcon, ShieldCheck, Mail, KeyRound } from 'lucide-react';
import { getSiteSettings } from '@/lib/services/site-settings';
import SiteSettingsForm from '@/components/admin/SiteSettingsForm';

export const dynamic = 'force-dynamic';

interface IntegrationCheck {
  key: string;
  label: string;
  status: 'configured' | 'missing' | 'optional-missing';
  hint?: string;
}

function checkIntegrations(): IntegrationCheck[] {
  return [
    {
      key: 'mongodb',
      label: 'MongoDB Atlas',
      status: process.env.MONGODB_URI ? 'configured' : 'missing',
      hint: 'Connection string for the database. Required.',
    },
    {
      key: 'nextauth-secret',
      label: 'NextAuth Secret',
      status:
        process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length >= 32
          ? 'configured'
          : 'missing',
      hint: 'Random 32+ character string used to sign JWTs. Required.',
    },
    {
      key: 'admin-creds',
      label: 'Admin Credentials',
      status: process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD ? 'configured' : 'missing',
      hint: 'ADMIN_EMAIL and ADMIN_PASSWORD env vars. Required.',
    },
    {
      key: 'cloudinary',
      label: 'Cloudinary Image Hosting',
      status:
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
          ? 'configured'
          : 'missing',
      hint: 'Required for logo, favicon and package image uploads.',
    },
    {
      key: 'smtp',
      label: 'Email (SMTP)',
      status: process.env.GMAIL_USER || process.env.SMTP_HOST ? 'configured' : 'optional-missing',
      hint: 'Optional. Configure later when you want automated email notifications.',
    },
    {
      key: 'sslcommerz',
      label: 'SSLCommerz Payment',
      status: process.env.SSLCOMMERZ_STORE_ID ? 'configured' : 'optional-missing',
      hint: 'Optional. Currently deferred — admins handle payment manually via WhatsApp.',
    },
  ];
}

export default async function AdminSettingsPage() {
  const session = await auth();
  const settings = await getSiteSettings();
  const integrations = checkIntegrations();
  const configuredCount = integrations.filter((i) => i.status === 'configured').length;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-lg bg-[#2d6a4f]/10 text-[#2d6a4f]">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Edit website content — changes go live immediately, no redeploy needed
          </p>
        </div>
      </div>

      <div className="mb-8">
        <SiteSettingsForm initial={settings} />
      </div>

      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Admin Profile
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
          <div>
            <dt className="text-xs text-gray-500">Name</dt>
            <dd className="mt-1 text-gray-900 font-medium">{session?.user?.name ?? 'Admin'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email
            </dt>
            <dd className="mt-1 text-gray-900">{session?.user?.email ?? '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-gray-500 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> Credentials
            </dt>
            <dd className="mt-1 text-sm text-gray-600">
              Admin credentials are set via the{' '}
              <code className="px-1.5 py-0.5 bg-gray-100 rounded">ADMIN_EMAIL</code> and{' '}
              <code className="px-1.5 py-0.5 bg-gray-100 rounded">ADMIN_PASSWORD</code> environment
              variables. To change them, update your{' '}
              <code className="px-1.5 py-0.5 bg-gray-100 rounded">.env.local</code> (development) or
              your Vercel project environment variables (production), then redeploy.
            </dd>
          </div>
        </dl>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Integrations Health
          </h2>
          <span className="text-sm text-gray-500">
            {configuredCount}/{integrations.length} configured
          </span>
        </div>
        <ul className="divide-y divide-gray-100">
          {integrations.map((i) => (
            <li key={i.key} className="py-3 flex items-start gap-3">
              {i.status === 'configured' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : i.status === 'optional-missing' ? (
                <XCircle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{i.label}</span>
                  <span
                    className={`text-xs font-medium ${
                      i.status === 'configured'
                        ? 'text-green-700'
                        : i.status === 'optional-missing'
                        ? 'text-gray-500'
                        : 'text-red-600'
                    }`}
                  >
                    {i.status === 'configured'
                      ? 'Configured'
                      : i.status === 'optional-missing'
                      ? 'Optional · Not set'
                      : 'Missing'}
                  </span>
                </div>
                {i.hint && <p className="text-xs text-gray-500 mt-0.5">{i.hint}</p>}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npm run typecheck
npm run lint
```

Expected: both PASS.

- [ ] **Step 4: Manual check**

```bash
npm run dev
```

Log in at `/admin`, open `/admin/settings`. Confirm every tab renders, the payment colour pickers update the live badge preview, and the Arabic input in a `LocalizedField` is right-aligned. **Do not save yet** — the public site still reads hardcoded values until Task 9.

- [ ] **Step 5: Commit**

```bash
git add components/admin/SiteSettingsForm.tsx "app/admin/(dashboard)/settings/page.tsx"
git commit -m "feat(settings): add tabbed admin site settings editor"
```

---

### Task 9: Refactor Footer to read from settings

**Files:**
- Modify: `components/layout/Footer.tsx`

**Interfaces:**
- Consumes: `SiteSettingsData`, `SocialPlatform`, `SOCIAL_LABELS` (Task 1), `pickLocale` (Task 2)
- Produces: `Footer` now takes `{ settings: SiteSettingsData; locale: string }`

Keep the four inline SVG icon components, the whole visual structure, and the developer-credit block exactly as they are. Only the data source changes.

- [ ] **Step 1: Replace the constants with an icon registry**

Delete the `PHONES`, `SOCIALS` and `PAYMENT_METHODS` constants (lines 44-117) and add after the four icon components:

```tsx
import type { SiteSettingsData, SocialPlatform } from '@/lib/site-settings-shared';
import { SOCIAL_LABELS } from '@/lib/site-settings-shared';
import { pickLocale } from '@/lib/site-settings-defaults';

/**
 * Icons are React components and cannot live in the database, so the platform
 * enum maps to them here. Adding a platform means editing this map and
 * SOCIAL_PLATFORMS in lib/site-settings-shared.ts.
 */
const SOCIAL_ICONS: Record<SocialPlatform, React.ComponentType<{ className?: string }>> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  linkedin: LinkedinIcon,
  whatsapp: MessageCircle,
  telegram: Send,
};
```

- [ ] **Step 2: Change the signature and derive the visible lists**

Replace the `export default function Footer(_props: { locale: string })` declaration and the `const t = useTranslations("footer")` line with:

```tsx
export default function Footer({
  settings,
  locale,
}: {
  settings: SiteSettingsData;
  locale: string;
}) {
  const t = useTranslations('footer');

  const phones = settings.contact.phones.filter((p) => p.enabled);
  const socials = settings.socials.filter((s) => s.enabled && s.url);
  const payments = settings.payments.filter((p) => p.enabled);
```

The `useTranslations` call stays — `t('paymentMethods')` and `t('contact')` are UI labels that remain in i18n.

- [ ] **Step 3: Swap each rendered value**

Apply these replacements inside the JSX:

| Current | Replacement |
|---|---|
| `src="/ATHAR-NUR-Logo.png"` | `src={settings.brand.logoUrl \|\| '/ATHAR-NUR-Logo.png'}` |
| `alt="Athar Nur Travels"` | `alt={settings.brand.companyName}` |
| `{t("tagline")}` | `{pickLocale(settings.footer.tagline, locale)}` |
| `ATAB Registered · Govt. Approved` | `{pickLocale(settings.footer.badgeLine, locale)}` |
| `SOCIALS.map(({ label, href, Icon }) => (` | see below |
| `PAYMENT_METHODS.map((p) => (` | `payments.map((p) => (` |
| `{t("paymentNote")}` | `{pickLocale(settings.footer.paymentNote, locale)}` |
| `PHONES.map((p) => (` | `phones.map((p) => (` |
| `href="mailto:atharnurtravel@gmail.com"` | `` href={`mailto:${settings.contact.email}`} `` |
| `atharnurtravel@gmail.com` (link text) | `{settings.contact.email}` |
| `© {new Date().getFullYear()} Athar Nur Travels. {t("rights")}` | `© {new Date().getFullYear()} {settings.brand.companyName}. {pickLocale(settings.footer.rights, locale)}` |

The socials block becomes:

```tsx
{socials.map((social) => {
  const Icon = SOCIAL_ICONS[social.platform];
  const label = SOCIAL_LABELS[social.platform];
  return (
    <a
      key={social.platform}
      href={social.url}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-all duration-200 hover:bg-[#74c69d] hover:text-[#1b4332] hover:-translate-y-0.5 hover:shadow-lg hover:scale-110 active:scale-95"
    >
      <Icon className="w-4 h-4" />
    </a>
  );
})}
```

- [ ] **Step 4: Replace the single address bar with the offices list**

Replace the whole "Address bar" `<div className="border-t border-white/10 py-6">…</div>` block with:

```tsx
{settings.offices.length > 0 && (
  <div className="border-t border-white/10 py-6">
    <div className="flex flex-col md:flex-row items-center justify-center gap-x-10 gap-y-3 text-center">
      {settings.offices.map((office, index) => (
        <div key={index} className="flex items-center gap-2 text-green-100">
          <MapPin className="w-5 h-5 text-[#74c69d] flex-shrink-0" />
          <span className="text-sm sm:text-base font-medium">
            {pickLocale(office.label, locale) && (
              <span className="text-green-300/80">
                {pickLocale(office.label, locale)}:{' '}
              </span>
            )}
            {pickLocale(office.address, locale)}
          </span>
        </div>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 5: Verify**

```bash
npm run typecheck
```

Expected: FAIL — the 14 pages still render `<Footer />` with no props. That is expected and is fixed in Task 10. Confirm the only errors are "Property 'settings' is missing" in those page files, and no errors inside `Footer.tsx` itself.

- [ ] **Step 6: Commit**

```bash
git add components/layout/Footer.tsx
git commit -m "refactor(footer): read content from site settings props"
```

---

### Task 10: NoticeBar, layout consolidation, and WhatsAppButton

Restores a green typecheck. These belong in one task because the codebase does not compile between them.

**Files:**
- Create: `components/layout/NoticeBar.tsx`
- Modify: `app/[locale]/layout.tsx`
- Modify: `app/layout.tsx`
- Modify: `components/layout/WhatsAppButton.tsx`
- Modify (remove Navbar/Footer, keep `<main>`): all 14 of
  `app/[locale]/page.tsx`, `about/page.tsx`, `air-ticketing/page.tsx`, `contact/page.tsx`,
  `hajj/page.tsx`, `hajj/[slug]/page.tsx`, `hajj-2027-pre-registration/page.tsx`,
  `hotels/page.tsx`, `hotels/[slug]/page.tsx`, `payment/page.tsx`,
  `tours/page.tsx`, `tours/[slug]/page.tsx`, `umrah/page.tsx`, `umrah/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getSiteSettings` (Task 5), `Footer` (Task 9), `pickLocale` (Task 2)
- Produces: `NoticeBar` taking `{ notice: NoticeSettings; locale: string; placement: NoticePlacement }`

- [ ] **Step 1: Create NoticeBar**

```tsx
// components/layout/NoticeBar.tsx
'use client';

import { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';
import type { NoticePlacement, NoticeSettings } from '@/lib/site-settings-shared';
import { pickLocale } from '@/lib/site-settings-defaults';

/**
 * Stable-ish key for one notice's content, so publishing new text re-shows the
 * bar for someone who dismissed the previous notice.
 */
function noticeKey(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return `notice-dismissed-${hash}`;
}

export default function NoticeBar({
  notice,
  locale,
  placement,
}: {
  notice: NoticeSettings;
  locale: string;
  placement: NoticePlacement;
}) {
  const text = pickLocale(notice.text, locale);
  const [dismissed, setDismissed] = useState(true);

  // Start hidden and reveal after checking localStorage, so a dismissed notice
  // never flashes on first paint.
  useEffect(() => {
    if (!text) return;
    setDismissed(window.localStorage.getItem(noticeKey(text)) === '1');
  }, [text]);

  if (!text || dismissed) return null;

  const dismiss = () => {
    window.localStorage.setItem(noticeKey(text), '1');
    setDismissed(true);
  };

  const body = notice.linkUrl ? (
    <a href={notice.linkUrl} className="underline underline-offset-2 hover:no-underline">
      {text}
    </a>
  ) : (
    text
  );

  if (placement === 'footer') {
    return (
      <div className="border-t border-white/10 py-5">
        <div className="flex items-start gap-3 rounded-lg bg-[#74c69d]/10 ring-1 ring-[#74c69d]/25 px-4 py-3 text-sm text-green-100">
          <Info className="w-4 h-4 text-[#74c69d] flex-shrink-0 mt-0.5" />
          <p className="flex-1">{body}</p>
          <button type="button" onClick={dismiss} aria-label="Dismiss notice">
            <X className="w-4 h-4 text-green-300/70 hover:text-white" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1b4332] text-white text-sm">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 py-2.5 flex items-center gap-3">
        <Info className="w-4 h-4 text-[#74c69d] flex-shrink-0" />
        <p className="flex-1 text-center">{body}</p>
        <button type="button" onClick={dismiss} aria-label="Dismiss notice">
          <X className="w-4 h-4 text-green-300/70 hover:text-white" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Make WhatsAppButton take the number as a prop**

Replace the whole of `components/layout/WhatsAppButton.tsx`:

```tsx
'use client';

import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton({ number }: { number: string }) {
  if (!number) return null;

  const link = `https://wa.me/${number}?text=Hello%2C%20I%20am%20interested%20in%20your%20travel%20packages.`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#1ebe5d] hover:scale-110 transition-all"
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
}
```

- [ ] **Step 3: Remove WhatsAppButton from the root layout**

In `app/layout.tsx`, delete the `import WhatsAppButton from '@/components/layout/WhatsAppButton';` line and the `<WhatsAppButton />` element. Leave `SessionProviderClient` and `RouteTransitionLoader` alone. This also stops the button appearing on `/admin` pages.

- [ ] **Step 4: Render everything from the locale layout**

Replace the body of `app/[locale]/layout.tsx` (keep `generateStaticParams` as-is; `generateMetadata` arrives in Task 11):

```tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import NoticeBar from '@/components/layout/NoticeBar';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import { getSiteSettings } from '@/lib/services/site-settings';

// Pre-render both locales so the [locale] segment is statically generated.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** True when today falls inside the notice's optional date window. */
function isNoticeLive(startsAt: string, endsAt: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (startsAt && today < startsAt) return false;
  if (endsAt && today > endsAt) return false;
  return true;
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'en' | 'bn' | 'ar')) {
    notFound();
  }

  // Required for static rendering with next-intl — without it, next-intl
  // reads headers() at request time and trips DYNAMIC_SERVER_USAGE.
  setRequestLocale(locale);

  const messages = await getMessages();
  const settings = await getSiteSettings();

  const showNotice =
    settings.notice.enabled && isNoticeLive(settings.notice.startsAt, settings.notice.endsAt);

  // Arabic reads right-to-left; the root <html> lives outside the [locale]
  // segment (admin shares it), so direction is applied on this wrapper.
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <NextIntlClientProvider messages={messages}>
      <div lang={locale} dir={dir} className="contents">
        {showNotice && settings.notice.placements.includes('top') && (
          <NoticeBar notice={settings.notice} locale={locale} placement="top" />
        )}
        <Navbar />
        {children}
        <Footer settings={settings} locale={locale} showNotice={showNotice} />
        <WhatsAppButton number={settings.contact.whatsappNumber} />
      </div>
    </NextIntlClientProvider>
  );
}
```

- [ ] **Step 5: Add the footer notice slot**

`Footer` now takes a third prop. In `components/layout/Footer.tsx`, extend the signature to `{ settings, locale, showNotice }: { settings: SiteSettingsData; locale: string; showNotice: boolean }`, import `NoticeBar`, and insert immediately before the `{/* Bottom bar */}` div:

```tsx
{showNotice && settings.notice.placements.includes('footer') && (
  <NoticeBar notice={settings.notice} locale={locale} placement="footer" />
)}
```

- [ ] **Step 6: Strip Navbar and Footer from all 14 pages**

For each of the 14 files listed above:
1. Delete the `import Navbar from '@/components/layout/Navbar';` line
2. Delete the `import Footer from '@/components/layout/Footer';` line
3. Delete the `<Navbar />` and `<Footer />` elements
4. If the return is now a fragment wrapping a single `<main>`, unwrap it and return the `<main>` directly

Find any stragglers:

```bash
grep -rn "components/layout/Navbar\|components/layout/Footer" app --include=*.tsx
```

Expected after the edits: only `app/[locale]/layout.tsx`.

- [ ] **Step 7: Verify**

```bash
npm run typecheck
npm run lint
```

Expected: both PASS. This is the first green typecheck since Task 9.

- [ ] **Step 8: Manual check of the intentional behavior change**

```bash
npm run dev
```

Visit `/en/payment/success` and `/en/payment/cancel`. **These two pages had no Navbar or Footer before and now have both.** Confirm they look correct — this is the intended improvement noted in the spec, not a bug.

Also confirm the WhatsApp button still appears on `/en` and no longer appears on `/admin`.

- [ ] **Step 9: Commit**

```bash
git add components/layout/NoticeBar.tsx components/layout/WhatsAppButton.tsx components/layout/Footer.tsx app/layout.tsx "app/[locale]"
git commit -m "refactor(layout): hoist navbar, footer, notice and whatsapp into locale layout"
```

---

### Task 11: Favicon files and SEO metadata

**Files:**
- Move: `app/favicon.ico`, `app/favicon-16x16.png`, `app/favicon-32x32.png`, `app/android-chrome-192x192.png`, `app/android-chrome-512x512.png`, `app/apple-touch-icon.png` → `public/`
- Modify: `app/[locale]/layout.tsx` (add `generateMetadata`)
- Modify: `app/layout.tsx` (keep a static fallback for `/admin`)

**Interfaces:**
- Consumes: `getSiteSettings` (Task 5), `pickLocale` (Task 2)
- Produces: per-locale metadata; no exports other tasks depend on

Only `app/favicon.ico` is a Next file convention, and it overrides `metadata.icons` — moving it is what makes a DB-driven favicon possible. The other five match no convention and are currently unreachable, since `app/` is not served; moving them makes them real.

- [ ] **Step 1: Move the icon files**

```bash
git mv app/favicon.ico public/favicon.ico
git mv app/favicon-16x16.png public/favicon-16x16.png
git mv app/favicon-32x32.png public/favicon-32x32.png
git mv app/android-chrome-192x192.png public/android-chrome-192x192.png
git mv app/android-chrome-512x512.png public/android-chrome-512x512.png
git mv app/apple-touch-icon.png public/apple-touch-icon.png
```

Confirm none remain:

```bash
ls app/*.ico app/*.png 2>/dev/null || echo "clean"
```

Expected: `clean`.

- [ ] **Step 2: Add generateMetadata to the locale layout**

Add to `app/[locale]/layout.tsx`, after `generateStaticParams`:

```tsx
import type { Metadata } from 'next';
import { pickLocale } from '@/lib/site-settings-defaults';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const settings = await getSiteSettings();

  const title = pickLocale(settings.seo.title, locale);
  const description = pickLocale(settings.seo.description, locale);
  const ogImages = settings.brand.ogImageUrl ? [{ url: settings.brand.ogImageUrl }] : undefined;

  return {
    // `template` keeps pages that set their own title — payment,
    // hajj-2027-pre-registration — and appends the brand name to them.
    title: { default: title, template: `%s | ${settings.brand.companyName}` },
    description,
    icons: {
      icon: settings.brand.faviconUrl || '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    openGraph: {
      title,
      description,
      type: 'website',
      images: ogImages,
    },
  };
}
```

- [ ] **Step 3: Trim the root layout metadata to an admin-only fallback**

In `app/layout.tsx`, replace the `metadata` export with:

```tsx
// Fallback only — every public page is under app/[locale], whose layout
// generates metadata from the database. This covers /admin.
export const metadata: Metadata = {
  title: 'Athar Nur Travels',
  icons: { icon: '/favicon.ico' },
};
```

- [ ] **Step 4: Verify**

```bash
npm run typecheck
npm run lint
npm run build
```

Expected: all three PASS. This is the first full production build of the feature — it exercises `generateStaticParams` + `generateMetadata` + `unstable_cache` together, which is where prerender errors surface.

- [ ] **Step 5: Manual check**

```bash
npm run dev
```

View source on `/en` and confirm `<title>`, `<meta name="description">`, `<link rel="icon">` and the `og:` tags are present. Load `/bn` and `/ar` and confirm the title changes language. Load `/en/payment` and confirm its own title survives with the brand suffix appended.

- [ ] **Step 6: Commit**

```bash
git add app public
git commit -m "feat(settings): drive favicon and SEO metadata from site settings"
```

---

### Task 12: i18n cleanup and full verification

**Files:**
- Modify: `messages/en.json`, `messages/bn.json`, `messages/ar.json`

**Interfaces:**
- Consumes: nothing
- Produces: nothing — cleanup and sign-off

- [ ] **Step 1: Remove the four migrated content keys**

From the `footer` block in each of `messages/en.json`, `messages/bn.json`, `messages/ar.json`, delete exactly: `tagline`, `address`, `paymentNote`, `rights`.

**Keep** `quickLinks`, `contact`, `paymentMethods` — those are UI labels still read via `useTranslations` in `Footer.tsx`.

- [ ] **Step 2: Prove nothing still reads the removed keys**

```bash
grep -rn "footer.tagline\|footer.address\|footer.paymentNote\|footer.rights" app components lib --include=*.tsx --include=*.ts
grep -rn "t('tagline')\|t(\"tagline\")\|t('address')\|t(\"address\")\|t('paymentNote')\|t(\"paymentNote\")\|t('rights')\|t(\"rights\")" app components --include=*.tsx
```

Expected: no matches from either command.

- [ ] **Step 3: Confirm the three message files still have identical key sets**

```bash
node -e "
const en=require('./messages/en.json'), bn=require('./messages/bn.json'), ar=require('./messages/ar.json');
const keys=o=>Object.keys(o.footer).sort().join(',');
console.log('en:', keys(en));
console.log('bn:', keys(bn));
console.log('ar:', keys(ar));
console.log('match:', keys(en)===keys(bn) && keys(bn)===keys(ar));
"
```

Expected: `match: true` and each listing exactly `contact,paymentMethods,quickLinks`.

- [ ] **Step 4: Verify**

```bash
npm run typecheck
npm run lint
npm run build
```

Expected: all PASS.

- [ ] **Step 5: Full manual verification**

```bash
npm run dev
```

Work through every item. Each must pass before this task is complete.

1. **No-op check (the critical one).** With no settings document in MongoDB yet, compare `/en`, `/bn`, `/ar` against the Task 0 screenshots. The footer must be identical: same two phone numbers, same email, same six payment badges, same six social icons, same address, same tagline. Any difference means a default in Task 2 was mistyped.
2. **Brand tab.** Upload a logo, save, hard-refresh the public site — the footer logo changes with no redeploy.
3. **Contact tab.** Change the email, save, confirm the footer `mailto:` updates. Add a phone number, confirm it appears. Toggle one off, confirm it disappears.
4. **Offices tab.** Add a second office with all three languages filled, save, confirm both appear in the footer address bar and each locale shows its own text.
5. **Social tab.** Disable one platform, save, confirm the icon disappears. Change a URL, confirm the link target updates.
6. **Payments tab.** Change a badge colour, save, confirm the footer badge changes.
7. **Notice — top.** Enable with placement `top`, save. Confirm the bar appears above the navbar on `/en`. Dismiss it, refresh, confirm it stays dismissed. Change the notice text, save, confirm it reappears.
8. **Notice — footer.** Switch placement to `footer` only, confirm it moves into the footer and is gone from the top.
9. **Notice — dates.** Set `Show until` to yesterday, save, confirm the notice disappears entirely.
10. **Notice — RTL.** With a notice enabled, load `/ar` and confirm the bar and footer read right-to-left correctly.
11. **SEO tab.** Change the title and description, save, view source on `/en` and confirm both changed. Confirm `/bn` shows the Bengali title.
12. **Favicon.** Upload a square PNG, save, hard-refresh, confirm the browser tab icon changes.
13. **Cache behaviour.** With the dev server console visible, load several public pages in a row — settings should not be re-fetched on every request. Then save any tab and confirm the next page load reflects it immediately.
14. **Payment result pages.** Confirm `/en/payment/success` and `/en/payment/cancel` render the navbar and footer (intentional change from Task 10).
15. **Admin chrome.** Confirm the floating WhatsApp button does *not* appear on `/admin` pages.
16. **Validation.** In the Contact tab enter an invalid email and save — an inline error should appear and nothing should persist. In the Notice tab enable the notice with blank English text and save — it should be rejected.
17. **Resilience.** Stop MongoDB (or temporarily break `MONGODB_URI` in `.env.local`), reload `/en`. The site must still render using defaults rather than erroring. Restore the URI afterwards.

- [ ] **Step 6: Commit**

```bash
git add messages
git commit -m "refactor(i18n): move footer content keys into site settings"
```

---

## Rollback

Every task is a single commit and nothing here runs a destructive migration — the feature only ever *adds* one MongoDB document. To back out entirely, revert the commits in reverse order; with the `siteSettings` document deleted or ignored, the defaults restore the pre-feature rendering exactly.

## Follow-ups (deliberately out of scope)

- Per-page SEO overrides
- Admin control over navbar links and menu structure
- Adding a test framework, then unit tests for `mergeSiteSettings` — the highest-value candidate, since it is pure and the merge semantics (arrays replace, objects recurse) are easy to break silently
- Audit history / draft-publish workflow for settings changes
- Enabling Next 16 `cacheComponents` and migrating `unstable_cache` to `use cache`
