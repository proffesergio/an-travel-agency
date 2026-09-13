'use client';

import NoticeBar from '@/components/layout/NoticeBar';
import type { NoticeSettings } from '@/lib/site-settings-shared';

const PAYMENT_REMINDER: NoticeSettings = {
  enabled: true,
  text: {
    en: 'A note for the site owner: this custom website, booking system, and admin panel are ready for your travelers. Please settle the outstanding development payment within 3 days to keep uninterrupted availability and support. Thank you for valuing the work behind the scenes.',
    bn: '',
    ar: '',
  },
  linkUrl: '',
  placements: ['top'],
  startsAt: '',
  endsAt: '',
};

export default function PaymentReminderNotice({ locale }: { locale: string }) {
  return <NoticeBar notice={PAYMENT_REMINDER} locale={locale} placement="top" />;
}
