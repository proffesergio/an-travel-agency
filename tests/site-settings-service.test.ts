import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEFAULT_SITE_SETTINGS } from '@/lib/site-settings-defaults';
import { SITE_SETTINGS_TAG } from '@/lib/site-settings-shared';

/**
 * `unstable_cache` is replaced with a real cache so these tests can do the
 * thing that actually broke production: serve a *stale* entry whose shape
 * predates the current contract. The read path must survive it.
 */
const cacheStore = new Map<string, unknown>();
/** The key the service registered — captured so a test can poison that entry. */
let cacheKey = '';

const revalidateTag = vi.fn();

vi.mock('next/cache', () => ({
  unstable_cache: (fn: () => Promise<unknown>, keyParts: string[]) => {
    cacheKey = keyParts.join(':');
    const key = cacheKey;
    return async () => {
      if (cacheStore.has(key)) return cacheStore.get(key);
      const value = await fn();
      cacheStore.set(key, value);
      return value;
    };
  },
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
}));

const connectDB = vi.fn(async () => undefined);
vi.mock('@/lib/mongodb', () => ({ connectDB: () => connectDB() }));

let leanResult: unknown = null;
let leanError: Error | null = null;
const findByIdAndUpdate = vi.fn();

vi.mock('@/models/SiteSettings', () => ({
  default: {
    findById: () => ({
      select: () => ({
        lean: () => ({
          exec: async () => {
            if (leanError) throw leanError;
            return leanResult;
          },
        }),
      }),
    }),
    findByIdAndUpdate: (...args: unknown[]) => {
      findByIdAndUpdate(...args);
      return { exec: async () => undefined };
    },
  },
}));

/** The service memoizes per-render via React `cache()`, so each test needs a
 *  fresh module instance as well as a fresh cache store. */
async function loadService() {
  vi.resetModules();
  cacheStore.clear();
  return import('@/lib/services/site-settings');
}

beforeEach(() => {
  leanResult = null;
  leanError = null;
  revalidateTag.mockClear();
  findByIdAndUpdate.mockClear();
});

describe('getSiteSettings — database shapes', () => {
  it('returns the defaults when no document exists', async () => {
    const { getSiteSettings } = await loadService();
    leanResult = null;
    await expect(getSiteSettings()).resolves.toEqual(DEFAULT_SITE_SETTINGS);
  });

  it('merges a partial document over the defaults', async () => {
    const { getSiteSettings } = await loadService();
    leanResult = { brand: { companyName: 'Renamed Co' } };
    const settings = await getSiteSettings();
    expect(settings.brand.companyName).toBe('Renamed Co');
    expect(settings.brand.logoUrl).toBe(DEFAULT_SITE_SETTINGS.brand.logoUrl);
    expect(settings.seo).toEqual(DEFAULT_SITE_SETTINGS.seo);
  });

  it('survives a hand-corrupted document', async () => {
    const { getSiteSettings } = await loadService();
    leanResult = { brand: 'oops', offices: {}, socials: [{ platform: 'myspace' }] };
    const settings = await getSiteSettings();
    expect(settings.brand.companyName).toBe(DEFAULT_SITE_SETTINGS.brand.companyName);
    expect(Array.isArray(settings.offices)).toBe(true);
    expect(settings.socials).toEqual([]);
  });

  it('degrades to the defaults when the database is unreachable', async () => {
    const { getSiteSettings } = await loadService();
    leanError = new Error('ECONNREFUSED');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(getSiteSettings()).resolves.toEqual(DEFAULT_SITE_SETTINGS);
    spy.mockRestore();
  });

  it('does not cache a failed read', async () => {
    const { getSiteSettings } = await loadService();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    leanError = new Error('ECONNREFUSED');
    await getSiteSettings();
    spy.mockRestore();

    // The outage clears; a fresh render must see real data, not a pinned default.
    leanError = null;
    leanResult = { brand: { companyName: 'Back Online' } };
    const { getSiteSettings: freshGet } = await loadService();
    expect((await freshGet()).brand.companyName).toBe('Back Online');
  });
});

describe('getSiteSettings — poisoned cache entry', () => {
  /**
   * The reported production crash. The Data Cache is persistent and, before
   * the TTL was added, immortal — an entry written under an older shape
   * outlived every deploy. Normalizing only inside the cached function was
   * not enough: the cached *result* has to be normalized on the way out too.
   */
  it('repairs a cached value that is missing whole sections', async () => {
    const { getSiteSettings } = await loadService();
    // A stale entry written by an earlier deploy: no `brand` at all.
    cacheStore.set(cacheKey, { contact: { email: 'x@y.com' }, seo: {} });

    const settings = await getSiteSettings();
    expect(settings.brand).toBeDefined();
    expect(settings.brand.companyName).toBe(DEFAULT_SITE_SETTINGS.brand.companyName);
    expect(settings.contact.email).toBe('x@y.com');
  });

  it.each([undefined, null, 'garbage', [], 0])('repairs a cached value of %o', async (poison) => {
    const { getSiteSettings } = await loadService();
    cacheStore.set(cacheKey, poison);
    const settings = await getSiteSettings();
    expect(settings.brand.companyName).toBe(DEFAULT_SITE_SETTINGS.brand.companyName);
    expect(Array.isArray(settings.contact.phones)).toBe(true);
  });
});

describe('saveSiteSettingsSection', () => {
  it('writes only the named section and publishes immediately', async () => {
    const { saveSiteSettingsSection } = await loadService();
    await saveSiteSettingsSection('brand', { companyName: 'X' }, 'admin@site.com');

    const [, update] = findByIdAndUpdate.mock.calls[0] as [string, Record<string, unknown>];
    expect(update).toEqual({ $set: { brand: { companyName: 'X' }, updatedBy: 'admin@site.com' } });
    expect(revalidateTag).toHaveBeenCalledWith(SITE_SETTINGS_TAG, { expire: 0 });
  });

  it('refuses a section name outside the contract', async () => {
    const { saveSiteSettingsSection } = await loadService();
    await expect(
      saveSiteSettingsSection('__proto__' as never, { polluted: true }, 'admin@site.com')
    ).rejects.toThrow();
    expect(findByIdAndUpdate).not.toHaveBeenCalled();
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
