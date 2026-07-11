'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { MessageCircle, Send } from 'lucide-react';

const WHATSAPP_NUMBER = '966537311069';

export default function CtaBanner() {
  const t = useTranslations('cta');
  const pathname = usePathname();
  const locale = pathname.startsWith('/bn')
    ? 'bn'
    : pathname.startsWith('/ar')
      ? 'ar'
      : 'en';

  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=Hello%2C%20I%20am%20interested%20in%20your%20travel%20packages.`;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#2d6a4f] to-[#1b4332] rounded-3xl px-8 py-14 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {t('title')}
          </h2>
          <p className="text-green-200 text-base max-w-lg mx-auto mb-10">
            {t('subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#25D366] text-white font-bold hover:bg-[#1ebe5d] transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              {t('whatsapp')}
            </a>
            <Link
              href={`/${locale}/contact`}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#f4a261] text-white font-bold hover:bg-[#e8894a] transition-colors"
            >
              <Send className="w-5 h-5" />
              {t('enquire')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
