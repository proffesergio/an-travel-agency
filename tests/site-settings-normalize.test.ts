import { describe, it, expect } from 'vitest';
import { DEFAULT_SITE_SETTINGS } from '@/lib/site-settings-defaults';
import { normalizeSiteSettings } from '@/lib/site-settings-normalize';
import { LOCALES, SOCIAL_PLATFORMS, NOTICE_PLACEMENTS } from '@/lib/site-settings-shared';

/**
 * The contract this whole suite exists to enforce: whatever comes in — a
 * partial document, a hand-edit in Atlas, a stale cache entry written under an
 * older shape — what comes out is a complete, correctly typed SiteSettingsData.
 * No consumer should ever have to null-check it.
 */
function expectCompleteShape(s: ReturnType<typeof normalizeSiteSettings>) {
  expect(typeof s.brand.companyName).toBe('string');
  expect(typeof s.brand.logoUrl).toBe('string');
  expect(typeof s.brand.faviconUrl).toBe('string');
  expect(typeof s.brand.ogImageUrl).toBe('string');

  expect(typeof s.contact.email).toBe('string');
  expect(typeof s.contact.whatsappNumber).toBe('string');
  expect(Array.isArray(s.contact.phones)).toBe(true);
  for (const p of s.contact.phones) {
    expect(typeof p.number).toBe('string');
    expect(typeof p.tel).toBe('string');
    expect(typeof p.enabled).toBe('boolean');
    expect(Number.isInteger(p.order)).toBe(true);
  }

  expect(Array.isArray(s.offices)).toBe(true);
  for (const o of s.offices) {
    for (const l of LOCALES) {
      expect(typeof o.label[l]).toBe('string');
      expect(typeof o.address[l]).toBe('string');
    }
    expect(typeof o.phone).toBe('string');
    expect(typeof o.mapUrl).toBe('string');
    expect(Number.isInteger(o.order)).toBe(true);
  }

  expect(Array.isArray(s.socials)).toBe(true);
  for (const soc of s.socials) {
    expect(SOCIAL_PLATFORMS).toContain(soc.platform);
    expect(typeof soc.url).toBe('string');
    expect(typeof soc.enabled).toBe('boolean');
  }

  expect(Array.isArray(s.payments)).toBe(true);
  for (const p of s.payments) {
    expect(typeof p.name).toBe('string');
    expect(typeof p.label).toBe('string');
    expect(typeof p.bg).toBe('string');
    expect(typeof p.text).toBe('string');
  }

  expect(typeof s.notice.enabled).toBe('boolean');
  expect(Array.isArray(s.notice.placements)).toBe(true);
  for (const pl of s.notice.placements) expect(NOTICE_PLACEMENTS).toContain(pl);
  expect(typeof s.notice.linkUrl).toBe('string');
  expect(typeof s.notice.startsAt).toBe('string');
  expect(typeof s.notice.endsAt).toBe('string');

  for (const l of LOCALES) {
    expect(typeof s.notice.text[l]).toBe('string');
    expect(typeof s.footer.tagline[l]).toBe('string');
    expect(typeof s.footer.paymentNote[l]).toBe('string');
    expect(typeof s.footer.rights[l]).toBe('string');
    expect(typeof s.footer.badgeLine[l]).toBe('string');
    expect(typeof s.seo.title[l]).toBe('string');
    expect(typeof s.seo.description[l]).toBe('string');
  }
}

describe('normalizeSiteSettings — hostile inputs', () => {
  const hostile: [string, unknown][] = [
    ['undefined', undefined],
    ['null', null],
    ['empty object', {}],
    ['a string', 'not settings'],
    ['a number', 42],
    ['an array', []],
    ['a boolean', true],
    ['every section null', {
      brand: null, contact: null, offices: null, socials: null,
      payments: null, notice: null, footer: null, seo: null,
    }],
    ['every section a string', {
      brand: 'x', contact: 'x', offices: 'x', socials: 'x',
      payments: 'x', notice: 'x', footer: 'x', seo: 'x',
    }],
    ['objects where arrays belong', { offices: {}, socials: {}, payments: {} }],
    ['arrays where objects belong', { brand: [], contact: [], notice: [], footer: [], seo: [] }],
  ];

  for (const [name, input] of hostile) {
    it(`returns a complete shape for ${name}`, () => {
      expectCompleteShape(normalizeSiteSettings(input));
    });
  }

  it('is exactly the defaults when there is nothing to merge', () => {
    expect(normalizeSiteSettings({})).toEqual(DEFAULT_SITE_SETTINGS);
    expect(normalizeSiteSettings(undefined)).toEqual(DEFAULT_SITE_SETTINGS);
  });

  it('reproduces the reported crash: a document with no brand section', () => {
    // The exact shape that made the Settings tab throw
    // "Cannot read properties of undefined (reading 'companyName')".
    const settings = normalizeSiteSettings({ contact: { email: 'a@b.com' } });
    expect(settings.brand.companyName).toBe(DEFAULT_SITE_SETTINGS.brand.companyName);
  });
});

describe('normalizeSiteSettings — field-level fallbacks', () => {
  it('keeps valid values and defaults only the invalid siblings', () => {
    const s = normalizeSiteSettings({
      brand: { companyName: 'New Name', logoUrl: 42, faviconUrl: null },
    });
    expect(s.brand.companyName).toBe('New Name');
    expect(s.brand.logoUrl).toBe(DEFAULT_SITE_SETTINGS.brand.logoUrl);
    expect(s.brand.faviconUrl).toBe(DEFAULT_SITE_SETTINGS.brand.faviconUrl);
  });

  it('falls back per locale, not per field', () => {
    const s = normalizeSiteSettings({ seo: { title: { en: 'Mine' } } });
    expect(s.seo.title.en).toBe('Mine');
    expect(s.seo.title.bn).toBe(DEFAULT_SITE_SETTINGS.seo.title.bn);
    expect(s.seo.title.ar).toBe(DEFAULT_SITE_SETTINGS.seo.title.ar);
  });

  it('accepts an empty string as a deliberate blank, not a missing value', () => {
    const s = normalizeSiteSettings({ brand: { companyName: '', logoUrl: '' } });
    expect(s.brand.companyName).toBe('');
    expect(s.brand.logoUrl).toBe('');
  });

  it('strips keys that are not part of the contract', () => {
    const s = normalizeSiteSettings({
      brand: { companyName: 'X', evil: 'yes' },
      bogusSection: { a: 1 },
    });
    expect(s.brand).not.toHaveProperty('evil');
    expect(s).not.toHaveProperty('bogusSection');
  });

  it('ignores __proto__ and constructor keys without polluting Object.prototype', () => {
    normalizeSiteSettings(JSON.parse('{"brand":{"__proto__":{"polluted":true}}}'));
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe('normalizeSiteSettings — arrays', () => {
  it('preserves a deliberately emptied array instead of resurrecting defaults', () => {
    // An admin who deletes every phone number must get an empty footer list.
    expect(normalizeSiteSettings({ contact: { phones: [] } }).contact.phones).toEqual([]);
    expect(normalizeSiteSettings({ offices: [] }).offices).toEqual([]);
    expect(normalizeSiteSettings({ socials: [] }).socials).toEqual([]);
    expect(normalizeSiteSettings({ payments: [] }).payments).toEqual([]);
  });

  it('falls back to defaults when the array is the wrong type entirely', () => {
    expect(normalizeSiteSettings({ contact: { phones: 'nope' } }).contact.phones).toEqual(
      DEFAULT_SITE_SETTINGS.contact.phones
    );
    expect(normalizeSiteSettings({ offices: 'nope' }).offices).toEqual(
      DEFAULT_SITE_SETTINGS.offices
    );
  });

  it('drops non-object rows rather than rendering them', () => {
    const s = normalizeSiteSettings({ offices: [null, 'x', 5, { phone: '123' }] });
    expect(s.offices).toHaveLength(1);
    expect(s.offices[0].phone).toBe('123');
  });

  it('drops socials with an unknown platform', () => {
    const s = normalizeSiteSettings({
      socials: [
        { platform: 'facebook', url: 'https://fb.com/x' },
        { platform: 'myspace', url: 'https://myspace.com/x' },
        { platform: 42, url: 'https://x.com' },
      ],
    });
    expect(s.socials.map((x) => x.platform)).toEqual(['facebook']);
  });

  it('filters notice placements down to the known enum', () => {
    const s = normalizeSiteSettings({
      notice: { placements: ['top', 'sidebar', 7, 'footer'] },
    });
    expect(s.notice.placements).toEqual(['top', 'footer']);
  });

  it('coerces a bad order into a usable integer', () => {
    const s = normalizeSiteSettings({
      payments: [
        { name: 'A', label: 'A', order: 'first' },
        { name: 'B', label: 'B', order: -3 },
        { name: 'C', label: 'C', order: 1.7 },
      ],
    });
    for (const p of s.payments) {
      expect(Number.isInteger(p.order)).toBe(true);
      expect(p.order).toBeGreaterThanOrEqual(0);
    }
  });

  it('fills missing row fields from that row type\'s blank, not from index 0 of the defaults', () => {
    const s = normalizeSiteSettings({ contact: { phones: [{ number: '+880 1' }] } });
    expect(s.contact.phones).toHaveLength(1);
    expect(s.contact.phones[0].number).toBe('+880 1');
    expect(s.contact.phones[0].tel).toBe('');
    expect(s.contact.phones[0].enabled).toBe(true);
  });
});

describe('normalizeSiteSettings — purity', () => {
  it('never mutates DEFAULT_SITE_SETTINGS', () => {
    const before = JSON.stringify(DEFAULT_SITE_SETTINGS);
    const s = normalizeSiteSettings({ brand: { companyName: 'Mutant' } });
    s.contact.phones.push({
      number: 'x', tel: 'x', countryCode: '', flag: '', country: '', enabled: true, order: 9,
    });
    s.offices.length = 0;
    expect(JSON.stringify(DEFAULT_SITE_SETTINGS)).toBe(before);
  });

  it('returns arrays that are copies, not shared references to the defaults', () => {
    const a = normalizeSiteSettings({});
    const b = normalizeSiteSettings({});
    expect(a.contact.phones).not.toBe(b.contact.phones);
    expect(a.contact.phones).toEqual(b.contact.phones);
  });

  it('is idempotent', () => {
    const once = normalizeSiteSettings({ brand: { companyName: 'X' }, socials: [] });
    expect(normalizeSiteSettings(once)).toEqual(once);
  });
});
