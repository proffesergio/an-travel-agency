import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Code, Heart, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.43-4.92 8.43-9.94z" />
  </svg>
);
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
  </svg>
);
const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23.5 6.5a3 3 0 0 0-2.1-2.12C19.55 4 12 4 12 4s-7.55 0-9.4.38A3 3 0 0 0 .5 6.5C.12 8.35.12 12 .12 12s0 3.65.38 5.5a3 3 0 0 0 2.1 2.12C4.45 20 12 20 12 20s7.55 0 9.4-.38a3 3 0 0 0 2.1-2.12c.38-1.85.38-5.5.38-5.5s0-3.65-.38-5.5zM9.75 15.5v-7l6.25 3.5-6.25 3.5z" />
  </svg>
);
const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.47v6.27zM5.34 7.43A2.06 2.06 0 1 1 5.34 3.3a2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
  </svg>
);

const PHONES = [
  { number: '+966 5373 11069', countryCode: '+966', tel: '+966537311069', flag: '🇸🇦', country: 'KSA' },
  { number: '+88 01843 431743', countryCode: '+880', tel: '+8801843431743', flag: '🇧🇩', country: 'BD' },
  { number: '01846-805281', countryCode: '+880', tel: '+8801846805281', flag: '🇧🇩', country: 'BD' },
];

const SOCIALS = [
  { label: 'Facebook', href: 'https://facebook.com/atharnurtravels', Icon: FacebookIcon },
  { label: 'Instagram', href: 'https://instagram.com/atharnurtravels', Icon: InstagramIcon },
  { label: 'YouTube', href: 'https://youtube.com/@atharnurtravels', Icon: YoutubeIcon },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/atharnurtravels', Icon: LinkedinIcon },
  { label: 'WhatsApp', href: 'https://wa.me/8801843431743', Icon: MessageCircle },
  { label: 'Telegram', href: 'https://t.me/atharnurtravels', Icon: Send },
];

export default function Footer({ locale }: { locale: string }) {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');

  const services = [
    { href: `/${locale}/hajj`, label: nav('hajj') },
    { href: `/${locale}/umrah`, label: nav('umrah') },
    { href: `/${locale}/tours`, label: nav('tours') },
    { href: `/${locale}/air-ticketing`, label: nav('airTicketing') },
    { href: `/${locale}/hajj-2027-pre-registration`, label: 'হজ্ব ২০২৭' },
  ];

  const company = [
    { href: `/${locale}/about`, label: nav('about') },
    { href: `/${locale}/contact`, label: nav('contact') },
  ];

  return (
    <footer className="relative bg-[#0f2d23] text-white overflow-hidden">
      {/* subtle gravitational dot background */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(116,198,157,0.18) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top: brand + links */}
        <div className="py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Brand */}
          <div className="lg:col-span-4">
            <div className="inline-flex items-center bg-white rounded-2xl px-4 py-2 mb-5 shadow-lg ring-1 ring-white/10">
              <Image
                src="/ATHAR-NUR-Logo.png"
                alt="Athar Nur Travels"
                width={180}
                height={60}
                className="h-12 w-auto"
              />
            </div>
            <p className="text-green-200/90 text-sm leading-relaxed max-w-sm">
              {t('tagline')}
            </p>
            <p className="mt-4 text-xs text-green-300/70 uppercase tracking-widest font-semibold">
              ATAB Registered · Govt. Approved
            </p>

            {/* Social icons */}
            <div className="mt-6 flex flex-wrap gap-2.5">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#74c69d] hover:text-[#1b4332] flex items-center justify-center transition-all hover:-translate-y-0.5"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div className="lg:col-span-2">
            <h3 className="font-semibold text-green-200 uppercase tracking-wider text-xs mb-4">
              Services
            </h3>
            <ul className="space-y-2.5">
              {services.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-green-100/80 text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="lg:col-span-2">
            <h3 className="font-semibold text-green-200 uppercase tracking-wider text-xs mb-4">
              Company
            </h3>
            <ul className="space-y-2.5">
              {company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-green-100/80 text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-4">
            <h3 className="font-semibold text-green-200 uppercase tracking-wider text-xs mb-4">
              {t('contact')}
            </h3>
            <ul className="space-y-3">
              {PHONES.map((p) => (
                <li key={p.tel}>
                  <a
                    href={`tel:${p.tel}`}
                    className="flex items-center gap-3 text-green-100/90 text-sm hover:text-white transition-colors group"
                  >
                    <span
                      className="text-xl leading-none flex-shrink-0"
                      role="img"
                      aria-label={p.country}
                    >
                      {p.flag}
                    </span>
                    <span className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#74c69d] group-hover:scale-110 transition-transform" />
                      {p.number}
                    </span>
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="mailto:info@atharnurtravels.com"
                  className="flex items-center gap-3 text-green-100/90 text-sm hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4 text-[#74c69d]" />
                  info@atharnurtravels.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Address bar */}
        <div className="border-t border-white/10 py-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-center">
            <div className="flex items-center gap-2 text-green-100">
              <MapPin className="w-5 h-5 text-[#74c69d]" />
              <span className="text-sm sm:text-base font-medium">
                {t('address')}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-green-300/70">
          <span>
            © {new Date().getFullYear()} Athar Nur Travels. {t('rights')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#74c69d]/15 text-[#74c69d] animate-dev-blink">
              <Code className="w-3 h-3" />
            </span>
            <span>Developed with</span>
            <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400 animate-dev-heartbeat" />
            <span>by</span>
            <a
              href="https://next-portfolio-ruby-nine.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="dev-credit-name font-bold tracking-wide text-white relative"
            >
              Hossain Billal
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
