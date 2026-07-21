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
import { normalizeSiteSettings } from '@/lib/site-settings-normalize';

const INPUT =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2d6a4f] focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]';
const LABEL = 'block text-sm font-medium text-gray-700 mb-1.5';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

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

  // Every field below reads `state.errors.<path>`, so a state without an
  // `errors` object throws the same "cannot read properties of undefined"
  // that a missing settings section does — and it would surface *after* a
  // save, when the admin has unsaved work on screen. The action always sets
  // `errors` today; this makes that a local guarantee rather than a
  // cross-module assumption.
  const safeState: SettingsActionState = {
    ok: Boolean(state?.ok),
    message: state?.message ?? '',
    errors: state?.errors ?? {},
  };

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="section" value={section} />
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />
      {children(safeState)}
      <SaveBar state={safeState} pending={pending} />
    </form>
  );
}

/** Client-generated id for a repeatable-list row, stable across reorders. */
const makeRowKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function SiteSettingsForm({ initial }: { initial: SiteSettingsData }) {
  const [tab, setTab] = useState<string>('brand');

  /**
   * `initial` is re-normalized even though the service already normalized it.
   * The prop has crossed a persistent cache and an RSC serialization boundary
   * on its way here, and every field below dereferences it two levels deep
   * (`data.brand.companyName`) — a single missing section takes the whole
   * admin panel down behind the error boundary, which is precisely how this
   * form broke in production. The cost is one pure function call per mount.
   */
  const [data, setData] = useState<SiteSettingsData>(() => normalizeSiteSettings(initial));

  // Offices rows nest LocalizedField, which holds local state for the
  // selected locale tab. Without a stable key independent of array position,
  // deleting or reordering a row leaves that tab-selection state attached to
  // the wrong row. This id is generated client-side, never sent to the
  // server (RepeatableList only reads it for React's `key`), and kept in
  // lockstep with `data.offices` by every handler that changes the array's
  // shape or order.
  const [officeKeys, setOfficeKeys] = useState<string[]>(() =>
    normalizeSiteSettings(initial).offices.map(makeRowKey)
  );

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

  /** Applies the same swap `move` performs, kept in sync with officeKeys. */
  const moveKeys = (keys: string[], index: number, direction: -1 | 1): string[] => {
    const next = [...keys];
    const target = index + direction;
    if (target < 0 || target >= next.length) return next;
    [next[index], next[target]] = [next[target], next[index]];
    return next;
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
            {(state) => (
              <>
                <div>
                  <label className={LABEL}>Company name</label>
                  <input
                    className={INPUT}
                    value={data.brand.companyName}
                    onChange={(e) => set('brand', { ...data.brand, companyName: e.target.value })}
                  />
                  <FieldError message={state.errors.companyName} />
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
                  <FieldError message={state.errors.email} />
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
                  <FieldError message={state.errors.whatsappNumber} />
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
                          <FieldError message={state.errors[`phones.${i}.number`]} />
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
                          <FieldError message={state.errors[`phones.${i}.tel`]} />
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
            {(state) => (
              <RepeatableList
                items={data.offices}
                addLabel="Add office"
                emptyLabel="No offices — the footer address bar will be hidden."
                getKey={(_, i) => officeKeys[i] ?? `office-${i}`}
                onAdd={() => {
                  set('offices', [
                    ...data.offices,
                    {
                      label: emptyLocalized(),
                      address: emptyLocalized(),
                      phone: '',
                      mapUrl: '',
                      order: data.offices.length,
                    },
                  ]);
                  setOfficeKeys((keys) => [...keys, makeRowKey()]);
                }}
                onRemove={(i) => {
                  set('offices', data.offices.filter((_, idx) => idx !== i));
                  setOfficeKeys((keys) => keys.filter((_, idx) => idx !== i));
                }}
                onMove={(i, d) => {
                  set('offices', move(data.offices, i, d));
                  setOfficeKeys((keys) => moveKeys(keys, i, d));
                }}
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
                      error={state.errors[`offices.${i}.label.en`]}
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
                      error={state.errors[`offices.${i}.address.en`]}
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
            {(state) => (
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
                      <FieldError message={state.errors[`socials.${i}.url`]} />
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
            {(state) => (
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
                          <FieldError message={state.errors[`payments.${i}.name`]} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Badge text</label>
                          <input
                            className={INPUT}
                            value={pay.label}
                            onChange={(e) => update({ label: e.target.value })}
                          />
                          <FieldError message={state.errors[`payments.${i}.label`]} />
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
                          <FieldError message={state.errors[`payments.${i}.bg`]} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block">Text</label>
                          <input
                            type="color"
                            className="h-9 w-16 rounded border border-gray-300"
                            value={pay.text}
                            onChange={(e) => update({ text: e.target.value })}
                          />
                          <FieldError message={state.errors[`payments.${i}.text`]} />
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
                  <FieldError message={state.errors.placements} />
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
                    <FieldError message={state.errors.endsAt} />
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
