'use client';

import { useState } from 'react';
import { LOCALES, type Locale, type Localized } from '@/lib/site-settings-shared';

const LOCALE_LABELS: Record<Locale, string> = { en: 'English', bn: 'বাংলা', ar: 'العربية' };

export default function LocalizedField({
  label,
  value,
  onChange,
  multiline = false,
  error,
}: {
  label: string;
  value: Localized;
  onChange: (next: Localized) => void;
  multiline?: boolean;
  error?: string;
}) {
  const [active, setActive] = useState<Locale>('en');
  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2d6a4f] focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]';

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex gap-1">
          {LOCALES.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => setActive(locale)}
              className={`px-2 py-0.5 text-xs rounded-md transition-colors ${
                active === locale
                  ? 'bg-[#2d6a4f] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {LOCALE_LABELS[locale]}
            </button>
          ))}
        </div>
      </div>

      {multiline ? (
        <textarea
          rows={3}
          dir={active === 'ar' ? 'rtl' : 'ltr'}
          className={inputClass}
          value={value[active] ?? ''}
          onChange={(e) => onChange({ ...value, [active]: e.target.value })}
        />
      ) : (
        <input
          type="text"
          dir={active === 'ar' ? 'rtl' : 'ltr'}
          className={inputClass}
          value={value[active] ?? ''}
          onChange={(e) => onChange({ ...value, [active]: e.target.value })}
        />
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {active !== 'en' && !value.en && (
        <p className="mt-1 text-xs text-amber-600">
          English is the fallback for every other language — fill it in first.
        </p>
      )}
    </div>
  );
}
