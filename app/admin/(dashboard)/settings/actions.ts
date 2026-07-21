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
