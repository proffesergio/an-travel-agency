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
  // updatedBy, __v) never come back — mergeSiteSettings only ever sees keys
  // that belong in the typed contract. Projection does not materialize a
  // field: a section that's absent in the document (untouched by any admin
  // save, per the `default: undefined` sub-schemas in models/SiteSettings.ts)
  // stays absent here too, so mergeSiteSettings still falls back to
  // DEFAULT_SITE_SETTINGS for it.
  const doc = await SiteSettings.findById(SITE_SETTINGS_ID)
    .select(`${SITE_SETTINGS_SECTION_KEYS.join(' ')} -_id`)
    .lean()
    .exec();
  if (!doc) return DEFAULT_SITE_SETTINGS;
  return mergeSiteSettings(DEFAULT_SITE_SETTINGS, doc);
}

/**
 * Persistent layer: Vercel's Data Cache, shared across every instance and
 * region. No `revalidate` is set, so this is invalidated *only* by an admin
 * save calling revalidateTag(SITE_SETTINGS_TAG). MongoDB therefore sees
 * roughly one query per edit rather than one per page view.
 */
const getCachedSiteSettings = unstable_cache(fetchSiteSettings, [SITE_SETTINGS_TAG], {
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
