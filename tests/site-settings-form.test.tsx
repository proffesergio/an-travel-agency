import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SiteSettingsForm from '@/components/admin/SiteSettingsForm';
import { DEFAULT_SITE_SETTINGS } from '@/lib/site-settings-defaults';
import type { SiteSettingsData } from '@/lib/site-settings-shared';

// The section save is a server action; the form only needs it to be a
// callable that returns an action state.
const saveSiteSettings = vi.fn(async () => ({ ok: true, message: 'Saved.', errors: {} }));
vi.mock('@/app/admin/(dashboard)/settings/actions', () => ({
  saveSiteSettings: (...args: unknown[]) => saveSiteSettings(...(args as [])),
  emptySettingsActionState: { ok: false, message: '', errors: {} },
}));

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element -- jsdom has no next/image runtime
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const TABS = ['Brand', 'Contact', 'Offices', 'Social', 'Payments', 'Notice', 'SEO', 'Footer text'];

/** Reads the hidden JSON payload of the currently rendered section form. */
function payload(): unknown {
  const input = document.querySelector<HTMLInputElement>('input[name="payload"]');
  return JSON.parse(input!.value);
}

function section(): string {
  return document.querySelector<HTMLInputElement>('input[name="section"]')!.value;
}

beforeEach(() => saveSiteSettings.mockClear());

describe('SiteSettingsForm — renders every tab from good data', () => {
  it('opens on Brand with the current company name', () => {
    render(<SiteSettingsForm initial={DEFAULT_SITE_SETTINGS} />);
    expect(screen.getByDisplayValue(DEFAULT_SITE_SETTINGS.brand.companyName)).toBeInTheDocument();
    expect(section()).toBe('brand');
  });

  it.each(TABS)('renders the %s tab without throwing', async (label) => {
    const user = userEvent.setup();
    render(<SiteSettingsForm initial={DEFAULT_SITE_SETTINGS} />);
    await user.click(screen.getByRole('button', { name: label }));
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('sends each tab its own section name and payload', async () => {
    const user = userEvent.setup();
    render(<SiteSettingsForm initial={DEFAULT_SITE_SETTINGS} />);

    await user.click(screen.getByRole('button', { name: 'Offices' }));
    expect(section()).toBe('offices');
    // offices/socials/payments wrap the array in an object of the same name,
    // matching the zod schema for that section.
    expect(payload()).toEqual({ offices: DEFAULT_SITE_SETTINGS.offices });

    await user.click(screen.getByRole('button', { name: 'SEO' }));
    expect(section()).toBe('seo');
    expect(payload()).toEqual(DEFAULT_SITE_SETTINGS.seo);
  });
});

describe('SiteSettingsForm — malformed initial data', () => {
  /**
   * The production crash, at the component boundary: the form was given a
   * settings object with no `brand`, and `data.brand.companyName` threw before
   * anything rendered. The form must repair its own props — the RSC payload it
   * receives has crossed a cache and a serialization boundary.
   */
  const broken: [string, unknown][] = [
    ['no brand section', { contact: { email: 'a@b.com' } }],
    ['no sections at all', {}],
    ['null', null],
    ['undefined', undefined],
    ['offices is not an array', { offices: 'nope' }],
    ['every section null', {
      brand: null, contact: null, offices: null, socials: null,
      payments: null, notice: null, footer: null, seo: null,
    }],
    ['sections of the wrong type', { brand: 'x', contact: 42, notice: [], seo: true }],
  ];

  for (const [name, initial] of broken) {
    it(`renders every tab when initial has ${name}`, async () => {
      const user = userEvent.setup();
      render(<SiteSettingsForm initial={initial as SiteSettingsData} />);
      for (const label of TABS) {
        await user.click(screen.getByRole('button', { name: label }));
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      }
    });
  }

  it('falls back to the default company name rather than rendering blank', () => {
    render(<SiteSettingsForm initial={{ contact: {} } as SiteSettingsData} />);
    expect(screen.getByDisplayValue(DEFAULT_SITE_SETTINGS.brand.companyName)).toBeInTheDocument();
  });

  it('never submits a repaired-away section as undefined', async () => {
    const user = userEvent.setup();
    render(<SiteSettingsForm initial={{} as SiteSettingsData} />);
    for (const [label, key] of [
      ['Brand', 'brand'],
      ['Contact', 'contact'],
      ['Notice', 'notice'],
      ['SEO', 'seo'],
      ['Footer text', 'footer'],
    ] as const) {
      await user.click(screen.getByRole('button', { name: label }));
      expect(payload()).toEqual(DEFAULT_SITE_SETTINGS[key]);
    }
  });
});

describe('SiteSettingsForm — editing', () => {
  it('tracks typing in the payload that will be submitted', async () => {
    const user = userEvent.setup();
    render(<SiteSettingsForm initial={DEFAULT_SITE_SETTINGS} />);

    const input = screen.getByDisplayValue(DEFAULT_SITE_SETTINGS.brand.companyName);
    await user.clear(input);
    await user.type(input, 'New Travels Ltd');

    expect(payload()).toMatchObject({ companyName: 'New Travels Ltd' });
  });

  it('adds and removes a phone row, keeping order contiguous', async () => {
    const user = userEvent.setup();
    render(<SiteSettingsForm initial={DEFAULT_SITE_SETTINGS} />);
    await user.click(screen.getByRole('button', { name: 'Contact' }));

    const startCount = DEFAULT_SITE_SETTINGS.contact.phones.length;
    await user.click(screen.getByRole('button', { name: /add phone number/i }));
    expect((payload() as { phones: unknown[] }).phones).toHaveLength(startCount + 1);

    await user.click(screen.getAllByRole('button', { name: 'Remove' })[0]);
    const phones = (payload() as { phones: { order: number }[] }).phones;
    expect(phones).toHaveLength(startCount);
  });

  it('reindexes order when a row moves', async () => {
    const user = userEvent.setup();
    render(<SiteSettingsForm initial={DEFAULT_SITE_SETTINGS} />);
    await user.click(screen.getByRole('button', { name: 'Payments' }));

    const firstNameBefore = DEFAULT_SITE_SETTINGS.payments[0].name;
    await user.click(screen.getAllByRole('button', { name: 'Move down' })[0]);

    const payments = (payload() as { payments: { name: string; order: number }[] }).payments;
    expect(payments[1].name).toBe(firstNameBefore);
    expect(payments.map((p) => p.order)).toEqual(payments.map((_, i) => i));
  });

  it('offers only unused platforms when adding a social link', async () => {
    const user = userEvent.setup();
    render(
      <SiteSettingsForm
        initial={{ ...DEFAULT_SITE_SETTINGS, socials: [] } as SiteSettingsData}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Social' }));
    await user.click(screen.getByRole('button', { name: /add social link/i }));

    const socials = (payload() as { socials: { platform: string }[] }).socials;
    expect(socials).toHaveLength(1);
    expect(socials[0].platform).toBe('facebook');
  });

  it('toggles a notice placement without dropping the other one', async () => {
    const user = userEvent.setup();
    render(<SiteSettingsForm initial={DEFAULT_SITE_SETTINGS} />);
    await user.click(screen.getByRole('button', { name: 'Notice' }));

    await user.click(screen.getByRole('checkbox', { name: /footer block/i }));
    expect((payload() as { placements: string[] }).placements).toEqual(
      expect.arrayContaining(['top', 'footer'])
    );

    await user.click(screen.getByRole('checkbox', { name: /top bar/i }));
    expect((payload() as { placements: string[] }).placements).toEqual(['footer']);
  });

  it('keeps each tab’s edits when switching away and back', async () => {
    const user = userEvent.setup();
    render(<SiteSettingsForm initial={DEFAULT_SITE_SETTINGS} />);

    const input = screen.getByDisplayValue(DEFAULT_SITE_SETTINGS.brand.companyName);
    await user.clear(input);
    await user.type(input, 'Persisted Co');

    await user.click(screen.getByRole('button', { name: 'Contact' }));
    await user.click(screen.getByRole('button', { name: 'Brand' }));

    expect(screen.getByDisplayValue('Persisted Co')).toBeInTheDocument();
  });
});

describe('SiteSettingsForm — office row identity', () => {
  it('keeps a row’s locale tab attached to its own data after a delete', async () => {
    const user = userEvent.setup();
    const initial: SiteSettingsData = {
      ...DEFAULT_SITE_SETTINGS,
      offices: [
        { ...DEFAULT_SITE_SETTINGS.offices[0], phone: 'FIRST', order: 0 },
        { ...DEFAULT_SITE_SETTINGS.offices[0], phone: 'SECOND', order: 1 },
      ],
    };
    render(<SiteSettingsForm initial={initial} />);
    await user.click(screen.getByRole('button', { name: 'Offices' }));

    await user.click(screen.getAllByRole('button', { name: 'Remove' })[0]);

    const offices = (payload() as { offices: { phone: string }[] }).offices;
    expect(offices).toHaveLength(1);
    expect(offices[0].phone).toBe('SECOND');
    expect(screen.getByDisplayValue('SECOND')).toBeInTheDocument();
  });
});

describe('SiteSettingsForm — server-side field errors', () => {
  it('shows the error the action returns next to the field', async () => {
    const user = userEvent.setup();
    saveSiteSettings.mockResolvedValueOnce({
      ok: false,
      message: 'Please fix the highlighted fields.',
      errors: { companyName: 'Company name is required' },
    });

    render(<SiteSettingsForm initial={DEFAULT_SITE_SETTINGS} />);
    const form = document.querySelector('form')!;
    await user.click(within(form).getByRole('button', { name: /save changes/i }));

    expect(await screen.findByText('Company name is required')).toBeInTheDocument();
  });

  it('survives an action state with no errors object', async () => {
    const user = userEvent.setup();
    // A thrown-then-caught action, or an older cached action state, can come
    // back without `errors` — reading state.errors.companyName must not throw.
    saveSiteSettings.mockResolvedValueOnce({ ok: true, message: 'Saved.' } as never);

    render(<SiteSettingsForm initial={DEFAULT_SITE_SETTINGS} />);
    const form = document.querySelector('form')!;
    await user.click(within(form).getByRole('button', { name: /save changes/i }));

    expect(await screen.findByText('Saved.')).toBeInTheDocument();
  });
});
