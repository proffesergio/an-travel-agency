import { useTranslations } from 'next-intl';

const STATS = [
  { value: '5,000+', key: 'pilgrims' },
  { value: '15+', key: 'years' },
  { value: '20+', key: 'destinations' },
  { value: '24/7', key: 'support' },
];

export default function StatsSection() {
  const t = useTranslations('stats');

  return (
    <section className="bg-[#2d6a4f] py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {STATS.map(({ value, key }) => (
            <div key={key}>
              <div className="text-4xl font-extrabold text-white">{value}</div>
              <div className="mt-1 text-green-200 text-sm">{t(key as 'pilgrims' | 'years' | 'destinations' | 'support')}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
