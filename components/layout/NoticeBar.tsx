'use client';

import { useCallback, useSyncExternalStore } from 'react';
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

/**
 * Dismissal lives in localStorage, which React cannot observe on its own, so
 * it is read through useSyncExternalStore rather than copied into state by an
 * effect. The server snapshot reports "dismissed" so the bar stays hidden
 * through SSR and first paint — an already-dismissed notice never flashes.
 */
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  // Keep tabs in sync when the notice is dismissed in another one.
  window.addEventListener('storage', onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
}

function setDismissed(key: string): void {
  window.localStorage.setItem(key, '1');
  listeners.forEach((notify) => notify());
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

  const getSnapshot = useCallback(
    () => (text ? window.localStorage.getItem(noticeKey(text)) === '1' : true),
    [text]
  );
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, () => true);

  if (!text || dismissed) return null;

  const dismiss = () => setDismissed(noticeKey(text));

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
