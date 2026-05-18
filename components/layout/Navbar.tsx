'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  CalendarHeart,
  ChevronDown,
  Globe,
  Info,
  Menu,
  MoonStar,
  Phone,
  Plane,
  PlaneTakeoff,
  Ticket,
  X,
} from 'lucide-react';
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
    { href: '/hajj', label: t('hajj'), icon: MoonStar },
    { href: '/umrah', label: t('umrah'), icon: Plane },
    { href: '/tours', label: t('tours'), icon: PlaneTakeoff },
    { href: '/air-ticketing', label: t('airTicketing'), icon: Ticket },
  ];

  const secondaryLinks = [
    { href: '/about', label: t('about'), icon: Info },
    { href: '/contact', label: t('contact'), icon: Phone },
  ];

  const featuredLink = {
    href: '/hajj-2027-pre-registration',
    label: t('hajj2027'),
    icon: CalendarHeart,
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href={`/${currentLocale}`} className="flex-shrink-0 flex items-center gap-2">
              <Image
                src="/ATHAR-NUR-Logo.png"
                alt="Athar Nur Travels"
                width={180}
                height={56}
                priority
                className="h-10 sm:h-12 w-auto"
              />
            </Link>

            {/* Desktop icon nav */}
            <div className="hidden lg:flex items-center gap-1">
              {serviceLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={getLocalizedHref(link.href)}
                    className={`group flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? 'text-[#2d6a4f] bg-green-50'
                        : 'text-gray-600 hover:text-[#2d6a4f] hover:bg-green-50/60'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mb-0.5 transition-transform group-hover:-translate-y-0.5 ${
                        active ? 'text-[#2d6a4f]' : 'text-gray-500 group-hover:text-[#2d6a4f]'
                      }`}
                    />
                    <span className="leading-tight whitespace-nowrap">{link.label}</span>
                  </Link>
                );
              })}

              <div className="mx-2 h-8 w-px bg-gray-200" />

              {secondaryLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={getLocalizedHref(link.href)}
                    className={`group flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? 'text-[#2d6a4f] bg-green-50'
                        : 'text-gray-600 hover:text-[#2d6a4f] hover:bg-green-50/60'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-0.5" />
                    <span className="leading-tight">{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Featured Hajj 2027 — desktop pill */}
              <Link
                href={getLocalizedHref(featuredLink.href)}
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-[#1b4332] text-xs font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <featuredLink.icon className="w-4 h-4" />
                {featuredLink.label}
                <span className="px-1.5 py-0.5 rounded-full bg-white/40 text-[9px] font-extrabold tracking-wider">
                  {featuredLink.badge}
                </span>
              </Link>

              {/* Auth button */}
              <AuthButton />

              {/* Language switcher — RIGHTMOST */}
              <div className="relative">
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  aria-label="Switch language"
                >
                  <Globe className="w-4 h-4 text-[#2d6a4f]" />
                  <span className="hidden sm:inline">
                    {LOCALES.find((l) => l.code === currentLocale)?.label}
                  </span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
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
                className="lg:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
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
            <div className="px-4 py-3">
              <div className="grid grid-cols-4 gap-2 mb-3">
                {serviceLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={getLocalizedHref(link.href)}
                      onClick={() => setMenuOpen(false)}
                      className={`flex flex-col items-center gap-1 py-3 px-1 rounded-xl text-[11px] font-semibold text-center ${
                        active
                          ? 'bg-green-50 text-[#2d6a4f]'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="leading-tight">{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              <Link
                href={getLocalizedHref(featuredLink.href)}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 mb-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-[#1b4332] font-bold text-sm"
              >
                <span className="flex items-center gap-2">
                  <featuredLink.icon className="w-4 h-4" />
                  {featuredLink.label}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/40 text-[10px] font-extrabold tracking-wider">
                  {featuredLink.badge}
                </span>
              </Link>

              <div className="border-t border-gray-100 pt-2 space-y-1">
                {secondaryLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={getLocalizedHref(link.href)}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium ${
                        active
                          ? 'text-[#2d6a4f] bg-green-50 font-semibold'
                          : 'text-gray-700 hover:text-[#2d6a4f] hover:bg-green-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              <a
                href="tel:+8801843431743"
                className="mt-3 flex items-center justify-center gap-2 w-full py-3 rounded-full bg-[#2d6a4f] text-white font-semibold text-sm"
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
