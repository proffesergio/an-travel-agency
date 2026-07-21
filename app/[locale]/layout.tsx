import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import NoticeBar from '@/components/layout/NoticeBar';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import { getSiteSettings } from '@/lib/services/site-settings';
import { pickLocale } from '@/lib/site-settings-defaults';

// Pre-render both locales so the [locale] segment is statically generated.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const settings = await getSiteSettings();

  const title = pickLocale(settings.seo.title, locale);
  const description = pickLocale(settings.seo.description, locale);
  const ogImages = settings.brand.ogImageUrl ? [{ url: settings.brand.ogImageUrl }] : undefined;

  return {
    // `template` keeps pages that set their own title — payment,
    // hajj-2027-pre-registration — and appends the brand name to them.
    title: { default: title, template: `%s | ${settings.brand.companyName}` },
    description,
    icons: {
      icon: settings.brand.faviconUrl || '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    openGraph: {
      title,
      description,
      type: 'website',
      images: ogImages,
    },
  };
}

/** True when today falls inside the notice's optional date window. */
function isNoticeLive(startsAt: string, endsAt: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (startsAt && today < startsAt) return false;
  if (endsAt && today > endsAt) return false;
  return true;
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
  const settings = await getSiteSettings();

  const showNotice =
    settings.notice.enabled && isNoticeLive(settings.notice.startsAt, settings.notice.endsAt);

  // Arabic reads right-to-left; the root <html> lives outside the [locale]
  // segment (admin shares it), so direction is applied on this wrapper.
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <NextIntlClientProvider messages={messages}>
      <div lang={locale} dir={dir} className="contents">
        {showNotice && settings.notice.placements.includes('top') && (
          <NoticeBar notice={settings.notice} locale={locale} placement="top" />
        )}
        <Navbar />
        {children}
        <Footer settings={settings} locale={locale} showNotice={showNotice} />
        <WhatsAppButton number={settings.contact.whatsappNumber} />
      </div>
    </NextIntlClientProvider>
  );
}
