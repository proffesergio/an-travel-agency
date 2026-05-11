'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Menu, X, Phone, Globe } from 'lucide-react';

const LOCALES = [
  { code: 'en', label: 'EN', fullLabel: 'English' },
  { code: 'bn', label: 'বাং', fullLabel: 'বাংলা' },
];

export default function Navbar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  // Detect current locale from path
  const currentLocale = pathname.startsWith('/bn') ? 'bn' : 'en';

  const navLinks = [
    { href: '/hajj', label: t('hajj') },
    { href: '/umrah', label: t('umrah') },
    { href: '/tours', label: t('tours') },
    { href: '/air-ticketing', label: t('airTicketing') },
    { href: '/about', label: t('about') },
    { href: '/contact', label: t('contact') },
  ];

  const switchLocale = (locale: string) => {
    // Replace locale prefix in path
    const segments = pathname.split('/');
    segments[1] = locale;
    router.push(segments.join('/') || `/${locale}`);
    setLangOpen(false);
  };

  const getLocalizedHref = (href: string) => `/${currentLocale}${href}`;

  const isActive = (href: string) =>
    pathname.startsWith(`/${currentLocale}${href}`);

  return (
    <header className="w-full">
      {/* Top bar */}
      <div className="bg-[#1b4332] text-white text-sm py-1.5 px-4 hidden md:flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5" />
          +966 5373 11069 &nbsp;|&nbsp; +88 01843 431743 &nbsp;|&nbsp; 01846-805281
        </span>
        <span className="text-green-300">
          Azad Centre, 55 Purana Paltan (14th Floor), Dhaka-1000
        </span>
      </div>

      {/* Main navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href={`/${currentLocale}`} className="flex-shrink-0">
              <Image
                src="/ATHAR-NUR-Logo.png"
                alt="Athar Nur Travels"
                width={160}
                height={50}
                priority
                className="h-12 w-auto"
              />
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={getLocalizedHref(link.href)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-[#2d6a4f] bg-green-50 font-semibold'
                      : 'text-gray-700 hover:text-[#2d6a4f] hover:bg-green-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right side: language switcher + mobile menu */}
            <div className="flex items-center gap-2">
              {/* Language switcher */}
              <div className="relative">
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Globe className="w-4 h-4 text-[#2d6a4f]" />
                  {LOCALES.find((l) => l.code === currentLocale)?.label}
                </button>
                {langOpen && (
                  <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                    {LOCALES.map((locale) => (
                      <button
                        key={locale.code}
                        onClick={() => switchLocale(locale.code)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-green-50 transition-colors ${
                          currentLocale === locale.code
                            ? 'text-[#2d6a4f] font-semibold bg-green-50'
                            : 'text-gray-700'
                        }`}
                      >
                        {locale.fullLabel}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* CTA button */}
              <Link
                href={getLocalizedHref('/contact')}
                className="hidden md:inline-flex items-center px-4 py-2 rounded-full bg-[#2d6a4f] text-white text-sm font-semibold hover:bg-[#1b4332] transition-colors"
              >
                {t('contact')}
              </Link>

              {/* Mobile hamburger */}
              <button
                className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={getLocalizedHref(link.href)}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${
                    isActive(link.href)
                      ? 'text-[#2d6a4f] bg-green-50 font-semibold'
                      : 'text-gray-700 hover:text-[#2d6a4f] hover:bg-green-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {/* Mobile contact info */}
              <div className="pt-3 border-t border-gray-100 text-xs text-gray-500">
                <p className="flex items-center gap-1">
                  <Phone className="w-3 h-3" /> +88 01843 431743
                </p>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
