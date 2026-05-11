import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Phone, MapPin, Mail } from 'lucide-react';

export default function Footer({ locale }: { locale: string }) {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');

  const navLinks = [
    { href: `/${locale}/hajj`, label: nav('hajj') },
    { href: `/${locale}/umrah`, label: nav('umrah') },
    { href: `/${locale}/tours`, label: nav('tours') },
    { href: `/${locale}/air-ticketing`, label: nav('airTicketing') },
    { href: `/${locale}/about`, label: nav('about') },
    { href: `/${locale}/contact`, label: nav('contact') },
  ];

  return (
    <footer className="bg-[#1b4332] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <Image
              src="/ATHAR-NUR-Logo.png"
              alt="Athar Nur Travels"
              width={160}
              height={50}
              className="h-12 w-auto mb-4 brightness-0 invert"
            />
            <p className="text-green-200 text-sm leading-relaxed">{t('tagline')}</p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-semibold text-green-300 uppercase tracking-wider text-xs mb-4">
              {t('quickLinks')}
            </h3>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-green-200 text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-green-300 uppercase tracking-wider text-xs mb-4">
              {t('contact')}
            </h3>
            <ul className="space-y-3 text-sm text-green-200">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-400" />
                <span>{t('address')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0 text-green-400" />
                <span>+966 5373 11069</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0 text-green-400" />
                <span>+88 01843 431743</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0 text-green-400" />
                <span>01846-805281</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-green-800 flex flex-col sm:flex-row items-center justify-between text-xs text-green-400">
          <span>
            © {new Date().getFullYear()} Athar Nur Travels. {t('rights')}
          </span>
          <span className="mt-2 sm:mt-0">
            atharnurtravels.com
          </span>
        </div>
      </div>
    </footer>
  );
}
