// lib/site-settings-normalize.ts
import { DEFAULT_SITE_SETTINGS } from '@/lib/site-settings-defaults';
import {
  LOCALES,
  NOTICE_PLACEMENTS,
  SOCIAL_PLATFORMS,
  emptyLocalized,
  type Localized,
  type NoticePlacement,
  type OfficeEntry,
  type PaymentEntry,
  type PhoneEntry,
  type SiteSettingsData,
  type SocialEntry,
  type SocialPlatform,
} from '@/lib/site-settings-shared';

/**
 * Turns anything at all into a complete, correctly typed SiteSettingsData.
 *
 * This replaces the old generic deep merge, which was shape-blind: it copied
 * whatever the database held into the typed slot, so a document with
 * `brand: "oops"` (or no `brand` at all) produced a value that lied about its
 * type and crashed at the first property read — `data.brand.companyName` in
 * the admin Settings form, `settings.brand.companyName` in the locale layout.
 *
 * Every consumer is entitled to assume the result is fully populated, so this
 * is the single place that guarantees it. Run it on *every* boundary a
 * settings object crosses: the database read, the cache read (a cache entry
 * can predate the current shape), and the client form's `initial` prop.
 *
 * Rules:
 *  - An absent or wrongly typed value falls back to DEFAULT_SITE_SETTINGS.
 *  - An empty string is a deliberate blank and is kept.
 *  - An empty array is a deliberate deletion and is kept; only a non-array
 *    falls back to the default list.
 *  - Rows that aren't objects, and socials with an unknown platform, are
 *    dropped rather than rendered.
 *  - Keys outside the contract are stripped, so a hand-edited document can
 *    never smuggle extra fields through to a consumer.
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Reads an own, enumerable property. `Object.hasOwn` keeps inherited keys out,
 * so a JSON payload carrying `__proto__` or `constructor` can neither be read
 * from the prototype chain nor pollute it — every object built below is a
 * fresh literal, never a mutation of the input.
 */
function own(source: unknown, key: string): unknown {
  return isPlainObject(source) && Object.hasOwn(source, key) ? source[key] : undefined;
}

function str(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/** Orders are array indices: a non-negative integer, or the fallback. */
function order(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  const rounded = Math.trunc(value);
  return rounded < 0 ? fallback : rounded;
}

function localized(value: unknown, fallback: Localized): Localized {
  const out = {} as Localized;
  for (const locale of LOCALES) out[locale] = str(own(value, locale), fallback[locale]);
  return out;
}

function list<T>(value: unknown, fallback: T[], row: (raw: Record<string, unknown>) => T | null): T[] {
  // Not an array at all — the field is corrupt, so show the defaults.
  if (!Array.isArray(value)) return fallback.map((item) => structuredClone(item));
  // An array, possibly empty: the admin's own list, minus unrenderable rows.
  return value.filter(isPlainObject).map(row).filter((item): item is T => item !== null);
}

const BLANK_PHONE: PhoneEntry = {
  number: '', tel: '', countryCode: '', flag: '', country: '', enabled: true, order: 0,
};

const BLANK_PAYMENT: PaymentEntry = {
  name: '', label: '', sub: '', bg: '#ffffff', text: '#000000', enabled: true, order: 0,
};

function phone(raw: Record<string, unknown>, index: number): PhoneEntry {
  return {
    number: str(own(raw, 'number'), BLANK_PHONE.number),
    tel: str(own(raw, 'tel'), BLANK_PHONE.tel),
    countryCode: str(own(raw, 'countryCode'), BLANK_PHONE.countryCode),
    flag: str(own(raw, 'flag'), BLANK_PHONE.flag),
    country: str(own(raw, 'country'), BLANK_PHONE.country),
    enabled: bool(own(raw, 'enabled'), BLANK_PHONE.enabled),
    order: order(own(raw, 'order'), index),
  };
}

function office(raw: Record<string, unknown>, index: number): OfficeEntry {
  return {
    label: localized(own(raw, 'label'), emptyLocalized()),
    address: localized(own(raw, 'address'), emptyLocalized()),
    phone: str(own(raw, 'phone'), ''),
    mapUrl: str(own(raw, 'mapUrl'), ''),
    order: order(own(raw, 'order'), index),
  };
}

/** Returns null for an unknown platform: the icon is a code-level mapping, so
 *  a platform with no icon has nothing to render. */
function social(raw: Record<string, unknown>, index: number): SocialEntry | null {
  const platform = own(raw, 'platform');
  if (!SOCIAL_PLATFORMS.includes(platform as SocialPlatform)) return null;
  return {
    platform: platform as SocialPlatform,
    url: str(own(raw, 'url'), ''),
    enabled: bool(own(raw, 'enabled'), true),
    order: order(own(raw, 'order'), index),
  };
}

function payment(raw: Record<string, unknown>, index: number): PaymentEntry {
  return {
    name: str(own(raw, 'name'), BLANK_PAYMENT.name),
    label: str(own(raw, 'label'), BLANK_PAYMENT.label),
    sub: str(own(raw, 'sub'), BLANK_PAYMENT.sub),
    bg: str(own(raw, 'bg'), BLANK_PAYMENT.bg),
    text: str(own(raw, 'text'), BLANK_PAYMENT.text),
    enabled: bool(own(raw, 'enabled'), BLANK_PAYMENT.enabled),
    order: order(own(raw, 'order'), index),
  };
}

export function normalizeSiteSettings(input: unknown): SiteSettingsData {
  const d = DEFAULT_SITE_SETTINGS;

  const brandRaw = own(input, 'brand');
  const contactRaw = own(input, 'contact');
  const noticeRaw = own(input, 'notice');
  const footerRaw = own(input, 'footer');
  const seoRaw = own(input, 'seo');

  const placementsRaw = own(noticeRaw, 'placements');

  return {
    brand: {
      companyName: str(own(brandRaw, 'companyName'), d.brand.companyName),
      logoUrl: str(own(brandRaw, 'logoUrl'), d.brand.logoUrl),
      faviconUrl: str(own(brandRaw, 'faviconUrl'), d.brand.faviconUrl),
      ogImageUrl: str(own(brandRaw, 'ogImageUrl'), d.brand.ogImageUrl),
    },
    contact: {
      email: str(own(contactRaw, 'email'), d.contact.email),
      whatsappNumber: str(own(contactRaw, 'whatsappNumber'), d.contact.whatsappNumber),
      phones: list(own(contactRaw, 'phones'), d.contact.phones, (raw) => phone(raw, 0)).map(
        (p, i) => ({ ...p, order: order(p.order, i) })
      ),
    },
    offices: list(own(input, 'offices'), d.offices, (raw) => office(raw, 0)).map((o, i) => ({
      ...o,
      order: order(o.order, i),
    })),
    socials: list(own(input, 'socials'), d.socials, (raw) => social(raw, 0)),
    payments: list(own(input, 'payments'), d.payments, (raw) => payment(raw, 0)),
    notice: {
      enabled: bool(own(noticeRaw, 'enabled'), d.notice.enabled),
      text: localized(own(noticeRaw, 'text'), d.notice.text),
      linkUrl: str(own(noticeRaw, 'linkUrl'), d.notice.linkUrl),
      placements: Array.isArray(placementsRaw)
        ? (placementsRaw.filter((p): p is NoticePlacement =>
            NOTICE_PLACEMENTS.includes(p as NoticePlacement)
          ))
        : [...d.notice.placements],
      startsAt: str(own(noticeRaw, 'startsAt'), d.notice.startsAt),
      endsAt: str(own(noticeRaw, 'endsAt'), d.notice.endsAt),
    },
    footer: {
      tagline: localized(own(footerRaw, 'tagline'), d.footer.tagline),
      paymentNote: localized(own(footerRaw, 'paymentNote'), d.footer.paymentNote),
      rights: localized(own(footerRaw, 'rights'), d.footer.rights),
      badgeLine: localized(own(footerRaw, 'badgeLine'), d.footer.badgeLine),
    },
    seo: {
      title: localized(own(seoRaw, 'title'), d.seo.title),
      description: localized(own(seoRaw, 'description'), d.seo.description),
    },
  };
}
