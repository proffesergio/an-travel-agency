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
import { normalizeSiteSettings } from '@/lib/site-settings-normalize';

/**
 * The eight sections of the typed contract, and nothing else. Driving the
 * Mongo `.select()` off this list (rather than hand-typing a select string
 * at the query site) keeps the projection in one place. The `satisfies`
 * clause below catches a typo'd/stale key at compile time; the
 * `_assertAllSectionKeysListed` check catches the opposite drift — a key
 * added to `SiteSettingsData` but forgotten here — since the plain
 * assignment (no `as` cast) fails to typecheck unless every key is covered.
 */
const SITE_SETTINGS_SECTION_KEYS = [
  'brand',
  'contact',
  'offices',
  'socials',
  'payments',
  'notice',
  'footer',
  'seo',
] as const satisfies readonly (keyof SiteSettingsData)[];

type _AllSectionKeysListed = keyof SiteSettingsData extends (typeof SITE_SETTINGS_SECTION_KEYS)[number]
  ? true
  : never;
const _assertAllSectionKeysListed: _AllSectionKeysListed = true;
void _assertAllSectionKeysListed;

/**
 * Reads the singleton document. Throws on database failure — the caller
 * decides how to degrade. Keeping the throw here means unstable_cache never
 * stores a failed read.
 */
async function fetchSiteSettings(): Promise<SiteSettingsData> {
  await connectDB();
  // `.select(...)` projects the query down to exactly the SiteSettingsData
  // sections, so Mongo-internal fields (_id, createdAt, updatedAt,
  // updatedBy, __v) never come back. Projection does not materialize a
  // field: a section that's absent in the document (untouched by any admin
  // save, per the `default: undefined` sub-schemas in models/SiteSettings.ts)
  // stays absent here too, so normalizeSiteSettings falls back to
  // DEFAULT_SITE_SETTINGS for it. Passing a missing document (null) through
  // the same normalizer needs no special case.
  const doc = await SiteSettings.findById(SITE_SETTINGS_ID)
    .select(`${SITE_SETTINGS_SECTION_KEYS.join(' ')} -_id`)
    .lean()
    .exec();
  return normalizeSiteSettings(doc);
}

/**
 * Bumped whenever SiteSettingsData changes shape. The Data Cache is
 * persistent and survives deploys, so without a version in the key an entry
 * written under an older contract is served indefinitely to new code. That is
 * exactly what took the admin Settings tab down: a cached value with no
 * `brand` section reached the form and `data.brand.companyName` threw.
 * normalizeSiteSettings below now repairs such an entry regardless, but
 * versioning the key means the stale value is never even read.
 */
const SHAPE_VERSION = 'v2';

/**
 * Persistent layer: Vercel's Data Cache, shared across every instance and
 * region. Invalidated *instantly* by an admin save calling
 * revalidateTag(SITE_SETTINGS_TAG, { expire: 0 }) — that path is unaffected
 * by the `revalidate` below. The bounded TTL exists for a different reason:
 * every `[locale]` route is statically prerendered, and some rendering
 * derived from this data is time-dependent rather than edit-dependent —
 * notice.startsAt/endsAt windows (app/[locale]/layout.tsx) and the footer's
 * copyright year (components/layout/Footer.tsx) both change with the
 * calendar, not with an admin save. Without a TTL those would drift forever
 * between saves (a notice could sit expired for months, the year could
 * freeze). One hour bounds that drift while still keeping MongoDB reads rare.
 */
const getCachedSiteSettings = unstable_cache(fetchSiteSettings, [SITE_SETTINGS_TAG, SHAPE_VERSION], {
  tags: [SITE_SETTINGS_TAG],
  revalidate: 3600,
});

/**
 * Per-render layer: React cache() dedupes so the layout, the footer and
 * generateMetadata share a single call within one render pass.
 *
 * The try/catch lives out here, *outside* unstable_cache, so a transient
 * MongoDB outage degrades to defaults for that request without poisoning the
 * cache. Were it inside, one blip would pin the site to defaults until either
 * the next admin save or the hour-long TTL above — a long time to serve the
 * wrong phone number for what may have been a two-second blip.
 *
 * The cached value is normalized *again* on the way out. It was already
 * normalized on the way in, but the two happen in different processes and
 * potentially different deploys: whatever fetchSiteSettings stored may have
 * been shaped by code that no longer exists. This is the boundary that lets
 * every caller — the locale layout, the footer, generateMetadata, the admin
 * form — read `settings.brand.companyName` without a null check.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettingsData> => {
  try {
    return normalizeSiteSettings(await getCachedSiteSettings());
  } catch (error) {
    console.error('[site-settings] read failed, serving defaults', error);
    return normalizeSiteSettings(undefined);
  }
});

/**
 * Upserts one section and publishes it. `value` must already be Zod-validated
 * by the caller.
 */
export async function saveSiteSettingsSection(
  section: keyof SiteSettingsData,
  value: unknown,
  updatedBy: string
): Promise<void> {
  // `section` is interpolated into a Mongo update path, so it is re-checked
  // here rather than trusted from the caller. The server action already
  // rejects unknown sections, but this function is exported and the type
  // annotation vanishes at runtime — a bad `section` must not be able to
  // reach `$set` and write an arbitrary field (or `__proto__`).
  if (!(SITE_SETTINGS_SECTION_KEYS as readonly string[]).includes(section)) {
    throw new Error(`Refusing to write unknown settings section: ${String(section)}`);
  }

  await connectDB();
  await SiteSettings.findByIdAndUpdate(
    SITE_SETTINGS_ID,
    { $set: { [section]: value, updatedBy } },
    { upsert: true, new: true, setDefaultsOnInsert: false }
  ).exec();

  // Next 16's revalidateTag requires a second `profile` argument — the
  // single-arg form used by the plan no longer type-checks (it's a required
  // parameter in next/dist/server/web/spec-extension/revalidate.d.ts, not
  // merely deprecated-but-optional). `profile: 'max'` gives
  // stale-while-revalidate semantics (serves stale once more, revalidates in
  // the background), which contradicts this feature's "publish instantly"
  // requirement. `{ expire: 0 }` is the documented equivalent of the old
  // immediate-expiry behavior, so admin saves are visible on the very next
  // request.
  revalidateTag(SITE_SETTINGS_TAG, { expire: 0 });
}
