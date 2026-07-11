import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

// Pre-render both locales so the [locale] segment is statically generated.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'en' | 'bn' | 'ar')) {
    notFound();
  }

  // Required for static rendering with next-intl — without it, next-intl
  // reads headers() at request time and trips DYNAMIC_SERVER_USAGE.
  setRequestLocale(locale);

  const messages = await getMessages();

  // Arabic reads right-to-left; the root <html> lives outside the [locale]
  // segment (admin shares it), so direction is applied on this wrapper.
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <NextIntlClientProvider messages={messages}>
      <div lang={locale} dir={dir} className="contents">
        {children}
      </div>
    </NextIntlClientProvider>
  );
}
