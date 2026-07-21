'use client';

import { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';
import type { NoticePlacement, NoticeSettings } from '@/lib/site-settings-shared';
import { pickLocale } from '@/lib/site-settings-defaults';

/**
 * Stable-ish key for one notice's content, so publishing new text re-shows the
 * bar for someone who dismissed the previous notice.
 */
function noticeKey(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return `notice-dismissed-${hash}`;
}

export default function NoticeBar({
  notice,
  locale,
  placement,
}: {
  notice: NoticeSettings;
  locale: string;
  placement: NoticePlacement;
}) {
  const text = pickLocale(notice.text, locale);
  const [dismissed, setDismissed] = useState(true);

  // Start hidden and reveal after checking localStorage, so a dismissed notice
  // never flashes on first paint.
  useEffect(() => {
    if (!text) return;
    setDismissed(window.localStorage.getItem(noticeKey(text)) === '1');
  }, [text]);

  if (!text || dismissed) return null;

  const dismiss = () => {
    window.localStorage.setItem(noticeKey(text), '1');
    setDismissed(true);
  };

  const body = notice.linkUrl ? (
    <a href={notice.linkUrl} className="underline underline-offset-2 hover:no-underline">
      {text}
    </a>
  ) : (
    text
  );

  if (placement === 'footer') {
    return (
      <div className="border-t border-white/10 py-5">
        <div className="flex items-start gap-3 rounded-lg bg-[#74c69d]/10 ring-1 ring-[#74c69d]/25 px-4 py-3 text-sm text-green-100">
          <Info className="w-4 h-4 text-[#74c69d] flex-shrink-0 mt-0.5" />
          <p className="flex-1">{body}</p>
          <button type="button" onClick={dismiss} aria-label="Dismiss notice">
            <X className="w-4 h-4 text-green-300/70 hover:text-white" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1b4332] text-white text-sm">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 py-2.5 flex items-center gap-3">
        <Info className="w-4 h-4 text-[#74c69d] flex-shrink-0" />
        <p className="flex-1 text-center">{body}</p>
        <button type="button" onClick={dismiss} aria-label="Dismiss notice">
          <X className="w-4 h-4 text-green-300/70 hover:text-white" />
        </button>
      </div>
    </div>
  );
}
