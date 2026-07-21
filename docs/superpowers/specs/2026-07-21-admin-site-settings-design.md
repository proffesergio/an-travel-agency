# Admin Site Settings — Design

**Date:** 2026-07-21
**Status:** Approved
**Goal:** Let an admin edit site-wide content (contact details, logo, favicon, offices, socials, payment badges, announcement notice, SEO defaults) from the admin panel, persisted to MongoDB, instead of editing hardcoded values in the codebase.

## Problem

Site-wide content lives in three disconnected places today:

1. **`messages/en.json` / `bn.json` / `ar.json`** — translatable text (`footer.tagline`, `footer.address`, `footer.paymentNote`, `footer.rights`)
2. **Hardcoded constants in `components/layout/Footer.tsx`** — `PHONES`, `SOCIALS`, `PAYMENT_METHODS`, the `mailto:` address, the logo `<Image>`
3. **Environment variables** — `NEXT_PUBLIC_WHATSAPP_NUMBER`

Changing a phone number therefore requires a code edit, a commit, and a deploy. The uncommitted working change to `Footer.tsx` (commenting out a phone number, swapping the contact email) is a live example of exactly this friction.

`app/admin/(dashboard)/settings/page.tsx` exists but is entirely read-only — it displays environment-variable health and edits nothing.

## Deployment context

The site deploys on **Vercel only**. cPanel deployment is paused. `next.config.ts` already branches on `process.env.VERCEL === '1'`, applying `distDir: 'build'` / `output: 'standalone'` only off-Vercel; that branch stays as-is.

This matters for cache design: Vercel's Data Cache is durable and shared across all instances and regions, and `revalidateTag` propagates globally. A multi-instance in-memory cache would not have been reliable.

**Stack:** Next.js 16.2.4, React 19.2.4, Mongoose 9, Zod 4, next-intl 4.

> Per `AGENTS.md`: this Next.js version has breaking changes versus older conventions. Consult `node_modules/next/dist/docs/` before writing code, and heed deprecation notices.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Translatable content | Per-language `{ en, bn, ar }` in the DB | Single source of truth; admin can change any language without a code change |
| Storage shape | Single MongoDB singleton document | Content is read together on every page; one doc = one cache entry |
| Propagation | `unstable_cache` tagged `site-settings` + `revalidateTag` on save | Keeps contact details server-rendered for SEO and keeps pages fast |
| Notice placement | Admin picks per-notice: top bar, footer, or both | Flexibility without a second content type |
| SEO scope | Site-wide defaults + OG image | Per-page overrides deferred to v2 (YAGNI) |

### Rejected alternatives

- **`force-dynamic` on every public page** — simple and always fresh, but adds a DB round-trip per page view and destroys static rendering for `/about`, `/contact`, `/air-ticketing`.
- **Client-side fetch from `/api/site-settings`** — phone, email, and address would be invisible to search engines, costing local-SEO value, plus layout shift.
- **Per-page SEO override table** — significant extra surface (sub-collection, route picker UI, merge logic in every page) for speculative benefit.

## Data model

New `models/SiteSettings.ts`, validated by `lib/validation/site-settings.ts` (following the existing `lib/validation/hotel.ts` pattern).

```ts
type Localized = { en: string; bn: string; ar: string };

{
  _id: 'singleton',
  brand:    { companyName, logoUrl, faviconUrl, ogImageUrl },
  contact:  { email, whatsappNumber,
              phones: [{ number, tel, countryCode, flag, country, enabled, order }] },
  offices:  [{ label: Localized, address: Localized, phone?, mapUrl?, order }],
  socials:  [{ platform, url, enabled, order }],
  payments: [{ name, label, sub?, bg, text, enabled, order }],
  notice:   { enabled, text: Localized, linkUrl?,
              placements: ('top' | 'footer')[], startsAt?, endsAt? },
  footer:   { tagline: Localized, paymentNote: Localized,
              rights: Localized, badgeLine: Localized },
  seo:      { title: Localized, description: Localized },
  updatedAt, updatedBy
}
```

Existing models use a flat two-language convention (`name` / `nameBn`) that predates Arabic support. The `Localized` object is a deliberate departure: this content is genuinely tri-lingual, and a flat `taglineBn` / `taglineAr` scheme would not extend cleanly. Existing models are left alone.

`badgeLine` captures the `ATAB Registered · Govt. Approved` string currently hardcoded as English inside `Footer.tsx` and therefore shown untranslated to Bengali and Arabic visitors.

**Icons stay in code.** `socials[].platform` is a fixed enum (`facebook | instagram | youtube | linkedin | whatsapp | telegram`) that maps to the existing inline SVG components in `Footer.tsx` via a lookup table. The admin edits the URL and the enabled flag, not the icon — React components cannot be persisted, and letting admins supply arbitrary SVG markup would be an XSS vector. Adding a new platform remains a code change.

Payment badges are the inverse: `bg` and `text` are plain hex strings already, so those are safely editable. Both are validated as `#rrggbb` by Zod.

### Safe defaults — the key correctness property

`DEFAULT_SITE_SETTINGS` holds today's exact values: the current `PHONES`, `SOCIALS`, and `PAYMENT_METHODS` arrays, plus the `en`/`bn`/`ar` footer strings lifted from `messages/*.json`. `getSiteSettings()` deep-merges the DB document over these defaults.

Consequence: the feature ships and renders **byte-identical to today** with no document present, no seed script, and no broken-deploy window. The uncommitted `Footer.tsx` values (single BD phone number, `atharnurtravel@gmail.com`) are folded into the defaults so nothing regresses.

## Cache layer

```
Request → React cache()              ← dedupes within one render pass:
             ↓ miss                    Navbar + Footer + generateMetadata
          unstable_cache                = 1 call, not 3
          tag: 'site-settings'       ← Vercel Data Cache: durable, shared
             ↓ miss                    across all instances and regions
          MongoDB
```

`lib/services/site-settings.ts`:

```ts
export const getSiteSettings = cache(
  unstable_cache(_fetchSettings, ['site-settings'], {
    tags: ['site-settings'],   // no time-based revalidate
  })
);
```

There is deliberately **no TTL**. The cache is invalidated only by an admin save calling `revalidateTag('site-settings')`. MongoDB therefore sees roughly one query per edit rather than one per page view — the first visitor after a save warms the cache and everyone after is served from it.

**Errors are never cached.** The DB read throws on failure; the `try/catch` that falls back to `DEFAULT_SITE_SETTINGS` sits *outside* `unstable_cache`, so a transient MongoDB outage returns defaults for that request without poisoning the cache. Were the catch inside, a single blip would pin the site to defaults until the next admin save — which, with no TTL, could be indefinitely.

`unstable_cache` is chosen over the newer `use cache` directive because `use cache` requires enabling Next 16's `cacheComponents` flag, which changes rendering semantics app-wide. That migration is out of scope; `unstable_cache` remains supported in 16.2.4.

## Admin UI

`app/admin/(dashboard)/settings/page.tsx` becomes tabbed:

- **System** — the existing read-only integrations-health view, preserved
- **Brand** — company name, logo, favicon, OG image (uploads via existing `app/api/upload` + `lib/cloudinary.ts`)
- **Contact** — email, WhatsApp number, repeatable phone list
- **Offices** — repeatable list with localized label and address, optional phone and map link
- **Social & Payments** — URLs and payment badges with show/hide toggles
- **Notice** — localized text, enable toggle, placement checkboxes, link, date window
- **SEO** — localized title and description

Each tab saves independently via its own Server Action in `settings/actions.ts`:

```
auth() guard → Zod parse → upsert singleton
  → revalidateTag('site-settings')      // public site goes live
  → revalidatePath('/admin/settings')   // admin form reflects the save
```

Per-section saves rather than one monolithic form: smaller payloads, targeted validation errors, and no risk of one tab's stale values clobbering another's.

Two shared components carry most of the work:

- **`<LocalizedField>`** — EN/BN/AR tabs over one logical field, `dir="rtl"` on the Arabic input
- **`<RepeatableList>`** — add/remove/reorder rows, following the rooms-editor pattern already in `components/admin/HotelForm.tsx`

## Public wiring

**Layout consolidation.** `Navbar` and `Footer` are imported by exactly 14 pages under `app/[locale]/` — the same 14 for both, each rendering `<Navbar /> <main>…</main> <Footer />`. Both move into `app/[locale]/layout.tsx`, which calls `getSiteSettings()` once and passes props down. The 14 pairs of imports are deleted and each page returns just its `<main>`.

**Intentional behavior change:** two pages under `app/[locale]/` do *not* render `Navbar`/`Footer` today — `payment/success` and `payment/cancel`. Hoisting into the layout gives them both. This is judged an improvement (a payment result page with no navigation is a dead end), but it is a visible change and must be confirmed during verification rather than discovered later.

**`WhatsAppButton` reality check:** the spec originally assumed this read `NEXT_PUBLIC_WHATSAPP_NUMBER`. It does not — `components/layout/WhatsAppButton.tsx:5` hardcodes `const WHATSAPP_NUMBER = '966537311069'`. The admin settings page's claim that the env var drives it is therefore inaccurate today. That number becomes the `contact.whatsappNumber` default, and the env var is dropped from the integrations-health list since nothing consumes it.

**`Footer.tsx`** drops the `PHONES` / `SOCIALS` / `PAYMENT_METHODS` constants and the `mailto:` literal, accepting a `settings` prop instead.

**`NoticeBar`** — new `components/layout/NoticeBar.tsx`. Rendered above `Navbar` when `placements` includes `'top'`, and inside the footer for `'footer'`. Date-window filtering happens server-side. Dismissal persists in `localStorage` keyed by a hash of the notice text, so a newly published notice reappears for users who dismissed the previous one.

**`WhatsAppButton`** moves from the root `app/layout.tsx` into `app/[locale]/layout.tsx` to receive the DB-backed number as a prop. Side benefit: it currently renders on `/admin` pages because the root layout wraps everything; this fixes that. Root layout retains `SessionProviderClient` and `RouteTransitionLoader`.

## Favicon and SEO

`app/` currently holds six icon files: `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`, `apple-touch-icon.png`.

Only **`app/favicon.ico`** is a Next file convention, and it is auto-injected in a way that overrides `metadata.icons` — moving it out is required for a DB-driven favicon to work at all. The other five match no Next convention and, because `app/` is not a served directory, are currently unreachable dead files: nothing links to `/favicon-16x16.png` today.

All six move to `public/`, where `favicon.ico` becomes the fallback when no favicon has been uploaded and the rest finally become reachable for the manifest/apple-touch links.

`app/[locale]/layout.tsx` gains `generateMetadata()` returning:

- `title` as `{ default, template }` — the template preserves the brand suffix so pages with their own metadata (`app/[locale]/payment/page.tsx`, `app/[locale]/hajj-2027-pre-registration/page.tsx`) keep their titles and simply gain the suffix
- `description` for the active locale
- `icons` pointing at the uploaded favicon, falling back to `/favicon.ico`
- `openGraph` with the uploaded OG image

`generateStaticParams` stays. Root `app/layout.tsx` keeps a static metadata export as the fallback for `/admin` routes.

## i18n cleanup

Only **content** leaves `messages/*.json`:

- Removed: `footer.tagline`, `footer.address`, `footer.paymentNote`, `footer.rights`
- Retained: `footer.quickLinks`, `footer.contact`, `footer.paymentMethods` — these are interface labels, not admin-editable content

## Verification

Manual, performed by the user. The implementation plan will carry this checklist:

1. **No-op check** — with no settings document present, every public page renders identically to the current production site
2. **Round-trip per tab** — edit a value, save, confirm it appears on the public site without a redeploy
3. **Cache behavior** — repeated page loads do not produce repeated MongoDB queries; a save invalidates promptly
4. **Locales** — EN, BN, and AR all render their own values; Arabic notice bar and footer respect RTL
5. **SEO** — page source shows the configured title, description, favicon link, and OG tags; pages with their own metadata still show their own titles
6. **Admin chrome** — `WhatsAppButton` no longer appears on `/admin` pages
7. `npm run lint` and `npm run build` pass

## Out of scope

- Per-page SEO overrides (v2)
- Editing navbar links or menu structure
- Enabling Next 16 `cacheComponents` / `use cache`
- Migrating existing models off the `name` / `nameBn` convention
- Audit history or draft/publish workflow for settings changes
