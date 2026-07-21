import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEFAULT_SITE_SETTINGS } from '@/lib/site-settings-defaults';
import { SITE_SETTINGS_SECTIONS } from '@/lib/validation/site-settings';

const saveSiteSettingsSection = vi.fn(async () => undefined);
vi.mock('@/lib/services/site-settings', () => ({
  saveSiteSettingsSection: (...args: unknown[]) => saveSiteSettingsSection(...(args as [])),
}));

let session: unknown = { user: { email: 'admin@site.com', role: 'admin' } };
vi.mock('@/lib/auth', () => ({ auth: async () => session }));
vi.mock('@/lib/auth-guards', () => ({
  isAdminSession: (s: unknown) => Boolean((s as { user?: unknown } | null)?.user),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { saveSiteSettings, emptySettingsActionState } = await import(
  '@/app/admin/(dashboard)/settings/actions'
);

function submit(sectionName: string, payload: unknown) {
  const fd = new FormData();
  fd.set('section', sectionName);
  fd.set('payload', JSON.stringify(payload));
  return saveSiteSettings(emptySettingsActionState, fd);
}

beforeEach(() => {
  saveSiteSettingsSection.mockClear();
  session = { user: { email: 'admin@site.com', role: 'admin' } };
});

describe('saveSiteSettings — authorization', () => {
  it('rejects a signed-out visitor without touching the database', async () => {
    session = null;
    const result = await submit('brand', { companyName: 'Hacked' });
    expect(result.ok).toBe(false);
    expect(result.message).toBe('Unauthorized');
    expect(saveSiteSettingsSection).not.toHaveBeenCalled();
  });
});

describe('saveSiteSettings — section routing', () => {
  it('accepts every section the form can submit', async () => {
    // The admin panel is only "full control" if every tab actually saves.
    const valid: Record<string, unknown> = {
      brand: DEFAULT_SITE_SETTINGS.brand,
      contact: DEFAULT_SITE_SETTINGS.contact,
      offices: { offices: DEFAULT_SITE_SETTINGS.offices },
      socials: { socials: DEFAULT_SITE_SETTINGS.socials },
      payments: { payments: DEFAULT_SITE_SETTINGS.payments },
      notice: DEFAULT_SITE_SETTINGS.notice,
      footer: DEFAULT_SITE_SETTINGS.footer,
      seo: DEFAULT_SITE_SETTINGS.seo,
    };
    for (const name of SITE_SETTINGS_SECTIONS) {
      const result = await submit(name, valid[name]);
      expect(result, `section ${name}`).toMatchObject({ ok: true });
    }
    expect(saveSiteSettingsSection).toHaveBeenCalledTimes(SITE_SETTINGS_SECTIONS.length);
  });

  it('unwraps the array sections before writing', async () => {
    await submit('offices', { offices: DEFAULT_SITE_SETTINGS.offices });
    const [name, value] = saveSiteSettingsSection.mock.calls[0] as unknown as [string, unknown];
    expect(name).toBe('offices');
    expect(value).toEqual(DEFAULT_SITE_SETTINGS.offices);
  });

  it('rejects an unknown section', async () => {
    const result = await submit('nonsense', {});
    expect(result.ok).toBe(false);
    expect(saveSiteSettingsSection).not.toHaveBeenCalled();
  });

  it('rejects __proto__ as a section without polluting Object.prototype', async () => {
    const result = await submit('__proto__', { polluted: true });
    expect(result.ok).toBe(false);
    expect(saveSiteSettingsSection).not.toHaveBeenCalled();
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('rejects a payload that is not valid JSON', async () => {
    const fd = new FormData();
    fd.set('section', 'brand');
    fd.set('payload', '{not json');
    const result = await saveSiteSettings(emptySettingsActionState, fd);
    expect(result.ok).toBe(false);
    expect(saveSiteSettingsSection).not.toHaveBeenCalled();
  });
});

describe('saveSiteSettings — validation feedback', () => {
  it('reports a blank company name against its own field', async () => {
    const result = await submit('brand', { ...DEFAULT_SITE_SETTINGS.brand, companyName: '' });
    expect(result.ok).toBe(false);
    expect(result.errors.companyName).toMatch(/required/i);
    expect(saveSiteSettingsSection).not.toHaveBeenCalled();
  });

  it('keys array errors by index so the right row highlights', async () => {
    const result = await submit('contact', {
      ...DEFAULT_SITE_SETTINGS.contact,
      phones: [DEFAULT_SITE_SETTINGS.contact.phones[0], { ...DEFAULT_SITE_SETTINGS.contact.phones[1], tel: 'not-a-number' }],
    });
    expect(result.ok).toBe(false);
    expect(result.errors['phones.1.tel']).toBeTruthy();
    expect(result.errors['phones.0.tel']).toBeUndefined();
  });

  it('rejects a javascript: URL in a social link', async () => {
    const result = await submit('socials', {
      socials: [{ platform: 'facebook', url: 'javascript:alert(1)', enabled: true, order: 0 }],
    });
    expect(result.ok).toBe(false);
    expect(saveSiteSettingsSection).not.toHaveBeenCalled();
  });

  it('rejects a javascript: URL in the notice link', async () => {
    const result = await submit('notice', {
      ...DEFAULT_SITE_SETTINGS.notice,
      linkUrl: 'javascript:alert(1)',
    });
    expect(result.ok).toBe(false);
  });

  it('allows an internal path as the notice link', async () => {
    const result = await submit('notice', {
      ...DEFAULT_SITE_SETTINGS.notice,
      enabled: true,
      text: { en: 'Hajj 2027 open', bn: '', ar: '' },
      placements: ['top'],
      linkUrl: '/en/hajj-2027-pre-registration',
    });
    expect(result).toMatchObject({ ok: true });
  });

  it('refuses to enable a notice with no English text', async () => {
    const result = await submit('notice', {
      ...DEFAULT_SITE_SETTINGS.notice,
      enabled: true,
      placements: ['top'],
    });
    expect(result.ok).toBe(false);
    expect(result.errors['text.en']).toBeTruthy();
  });

  it('refuses a notice whose end date precedes its start date', async () => {
    const result = await submit('notice', {
      ...DEFAULT_SITE_SETTINGS.notice,
      enabled: true,
      text: { en: 'x', bn: '', ar: '' },
      placements: ['top'],
      startsAt: '2026-08-01',
      endsAt: '2026-07-01',
    });
    expect(result.ok).toBe(false);
    expect(result.errors.endsAt).toBeTruthy();
  });

  it('rejects a non-hex payment colour', async () => {
    const result = await submit('payments', {
      payments: [{ name: 'VISA', label: 'VISA', sub: '', bg: 'red', text: '#ffffff', enabled: true, order: 0 }],
    });
    expect(result.ok).toBe(false);
    expect(result.errors['payments.0.bg']).toBeTruthy();
  });

  it('rejects an invalid contact email', async () => {
    const result = await submit('contact', { ...DEFAULT_SITE_SETTINGS.contact, email: 'not-an-email' });
    expect(result.ok).toBe(false);
    expect(result.errors.email).toBeTruthy();
  });

  it('rejects a WhatsApp number with a leading +', async () => {
    const result = await submit('contact', {
      ...DEFAULT_SITE_SETTINGS.contact,
      whatsappNumber: '+966537311069',
    });
    expect(result.ok).toBe(false);
    expect(result.errors.whatsappNumber).toBeTruthy();
  });

  it('strips unknown keys instead of writing them to the document', async () => {
    await submit('brand', { ...DEFAULT_SITE_SETTINGS.brand, evil: 'payload' });
    const [, value] = saveSiteSettingsSection.mock.calls[0] as unknown as [string, object];
    expect(value).not.toHaveProperty('evil');
  });

  it('surfaces a database failure as a retryable message, not a crash', async () => {
    saveSiteSettingsSection.mockRejectedValueOnce(new Error('write concern failed'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await submit('brand', DEFAULT_SITE_SETTINGS.brand);
    spy.mockRestore();
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/try again/i);
    expect(result.errors).toEqual({});
  });
});

describe('saveSiteSettings — round trip', () => {
  it('produces a value the normalizer accepts unchanged', async () => {
    const { normalizeSiteSettings } = await import('@/lib/site-settings-normalize');
    await submit('brand', { ...DEFAULT_SITE_SETTINGS.brand, companyName: 'Round Trip Co' });
    const [, value] = saveSiteSettingsSection.mock.calls[0] as unknown as [string, object];

    // What the action writes must survive the read path byte-for-byte,
    // otherwise a save appears to succeed and then renders as something else.
    const readBack = normalizeSiteSettings({ brand: value });
    expect(readBack.brand).toEqual({ ...DEFAULT_SITE_SETTINGS.brand, companyName: 'Round Trip Co' });
  });
});
