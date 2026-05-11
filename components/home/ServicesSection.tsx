import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Moon, Globe, Plane, Compass } from 'lucide-react';

const SERVICES = [
  {
    key: 'hajj',
    icon: Moon,
    href: '/hajj',
    color: 'bg-emerald-50 text-emerald-700',
    iconBg: 'bg-emerald-100',
  },
  {
    key: 'umrah',
    icon: Compass,
    href: '/umrah',
    color: 'bg-teal-50 text-teal-700',
    iconBg: 'bg-teal-100',
  },
  {
    key: 'tours',
    icon: Globe,
    href: '/tours',
    color: 'bg-blue-50 text-blue-700',
    iconBg: 'bg-blue-100',
  },
  {
    key: 'airTicketing',
    icon: Plane,
    href: '/air-ticketing',
    color: 'bg-orange-50 text-orange-700',
    iconBg: 'bg-orange-100',
  },
];

export default function ServicesSection({ locale }: { locale: string }) {
  const t = useTranslations('services');

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <span className="text-[#2d6a4f] text-sm font-semibold uppercase tracking-widest">
            {t('title')}
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">
            {t('subtitle')}
          </h2>
        </div>

        {/* Service cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map(({ key, icon: Icon, href, color, iconBg }) => (
            <Link
              key={key}
              href={`/${locale}${href}`}
              className={`group flex flex-col items-start p-6 rounded-2xl border border-transparent hover:border-[#2d6a4f]/20 hover:shadow-md transition-all ${color}`}
            >
              <div className={`p-3 rounded-xl mb-4 ${iconBg}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">
                {t(`${key}.title`)}
              </h3>
              <p className="text-sm leading-relaxed opacity-80">
                {t(`${key}.desc`)}
              </p>
              <span className="mt-4 text-sm font-semibold group-hover:underline">
                Learn more →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
