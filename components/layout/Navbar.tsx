'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronDown, Globe, Menu, Phone, Sparkles, X } from 'lucide-react';
import AuthButton from '@/components/auth/AuthButton';

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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const currentLocale = pathname.startsWith('/bn') ? 'bn' : 'en';

  const serviceLinks = [
    { href: '/hajj', label: t('hajj') },
    { href: '/umrah', label: t('umrah') },
    { href: '/tours', label: t('tours') },
    { href: '/air-ticketing', label: t('airTicketing') },
  ];

  const secondaryLinks = [
    { href: '/about', label: t('about') },
    { href: '/contact', label: t('contact') },
  ];

  const featuredLink = {
    href: '/hajj-2027-pre-registration',
    label: t('hajj2027'),
    badge: 'NEW',
  };

  const switchLocale = (locale: string) => {
    const segments = pathname.split('/');
    segments[1] = locale;
    router.push(segments.join('/') || `/${locale}`);
    setLangOpen(false);
  };

  const getLocalizedHref = (href: string) => `/${currentLocale}${href}`;

  const isActive = (href: string) =>
    pathname.startsWith(`/${currentLocale}${href}`);

  return (
    <header className="sticky top-0 z-50 w-full">
      <nav
        className={`transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100'
            : 'bg-white shadow-sm border-b border-transparent'
        }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo — flush to the leftmost edge */}
            <Link
              href={`/${currentLocale}`}
              className="flex-shrink-0 flex items-center gap-2 group transition-transform hover:scale-[1.03]"
            >
              <Image
                src="/ATHAR-NUR-Logo.png"
                alt="Athar Nur Travels"
                width={180}
                height={56}
                priority
                className="h-10 sm:h-12 w-auto transition-transform group-hover:rotate-[-2deg]"
              />
            </Link>

            {/* Right cluster — nav links + featured + auth + language + mobile toggle */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Desktop nav — bold text links with active underline + hover sweep */}
              <div className="hidden lg:flex items-center gap-1">
                {serviceLinks.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={getLocalizedHref(link.href)}
                      className={`nav-link group/nav relative px-3.5 py-2 text-[13px] font-extrabold tracking-tight uppercase rounded-md transition-all duration-200 ${
                        active ? 'text-[#1b4332]' : 'text-gray-700 hover:text-[#1b4332]'
                      }`}
                    >
                      <span className="relative z-10 whitespace-nowrap">{link.label}</span>
                      <span
                        className={`absolute left-3 right-3 -bottom-0.5 h-[3px] rounded-full bg-[#2d6a4f] transition-transform duration-300 origin-left ${
                          active
                            ? 'scale-x-100'
                            : 'scale-x-0 group-hover/nav:scale-x-100'
                        }`}
                      />
                    </Link>
                  );
                })}

                <div className="mx-2 h-6 w-px bg-gray-200" />

                {secondaryLinks.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={getLocalizedHref(link.href)}
                      className={`nav-link group/nav relative px-3 py-2 text-[13px] font-extrabold tracking-tight uppercase rounded-md transition-all duration-200 ${
                        active ? 'text-[#1b4332]' : 'text-gray-700 hover:text-[#1b4332]'
                      }`}
                    >
                      <span className="relative z-10 whitespace-nowrap">{link.label}</span>
                      <span
                        className={`absolute left-3 right-3 -bottom-0.5 h-[3px] rounded-full bg-[#2d6a4f] transition-transform duration-300 origin-left ${
                          active
                            ? 'scale-x-100'
                            : 'scale-x-0 group-hover/nav:scale-x-100'
                        }`}
                      />
                    </Link>
                  );
                })}
              </div>

              <div className="hidden lg:block mx-1 h-6 w-px bg-gray-200" />

              {/* Featured Hajj 2027 — desktop pill */}
              <Link
                href={getLocalizedHref(featuredLink.href)}
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-[#1b4332] text-xs font-extrabold uppercase tracking-tight shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:from-amber-500 hover:to-amber-600 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {featuredLink.label}
                <span className="px-1.5 py-0.5 rounded-full bg-white/40 text-[9px] font-extrabold tracking-wider">
                  {featuredLink.badge}
                </span>
              </Link>

              {/* Auth button */}
              <AuthButton />

              {/* Language switcher */}
              <div className="relative">
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-green-50 hover:border-[#2d6a4f]/40 hover:shadow-sm active:scale-95"
                  aria-label="Switch language"
                >
                  <Globe className="w-4 h-4 text-[#2d6a4f]" />
                  <span className="hidden sm:inline">
                    {LOCALES.find((l) => l.code === currentLocale)?.label}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
                </button>
                {langOpen && (
                  <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                    {LOCALES.map((locale) => (
                      <button
                        key={locale.code}
                        onClick={() => switchLocale(locale.code)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 transition-colors ${
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

              {/* Mobile hamburger */}
              <button
                className="lg:hidden p-2 rounded-md text-gray-700 transition-colors hover:bg-gray-100 active:scale-95"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
              >
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white animate-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-4">
              <div className="grid grid-cols-2 gap-2 mb-3">
                {serviceLinks.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={getLocalizedHref(link.href)}
                      onClick={() => setMenuOpen(false)}
                      className={`py-3 px-3 rounded-xl text-sm font-extrabold uppercase tracking-tight text-center border-2 transition-all duration-200 active:scale-95 ${
                        active
                          ? 'bg-[#2d6a4f] text-white border-[#2d6a4f] shadow-md'
                          : 'border-gray-200 text-gray-800 hover:border-[#2d6a4f] hover:text-[#1b4332] hover:-translate-y-0.5 hover:shadow-sm'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              <Link
                href={getLocalizedHref(featuredLink.href)}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 mb-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-[#1b4332] font-extrabold text-sm uppercase tracking-tight"
              >
                <span>{featuredLink.label}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/40 text-[10px] font-extrabold tracking-wider">
                  {featuredLink.badge}
                </span>
              </Link>

              <div className="border-t border-gray-100 pt-2 grid grid-cols-2 gap-2">
                {secondaryLinks.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={getLocalizedHref(link.href)}
                      onClick={() => setMenuOpen(false)}
                      className={`px-3 py-2.5 rounded-md text-sm font-extrabold uppercase tracking-tight text-center transition-colors duration-200 active:scale-95 ${
                        active
                          ? 'text-[#1b4332] bg-green-50'
                          : 'text-gray-700 hover:text-[#1b4332] hover:bg-green-50'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              <a
                href="tel:+8801843431743"
                className="mt-3 flex items-center justify-center gap-2 w-full py-3 rounded-full bg-[#2d6a4f] text-white font-bold text-sm"
              >
                <Phone className="w-4 h-4" />
                +88 01843 431743
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
