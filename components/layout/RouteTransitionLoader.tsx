'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import AtomLoader from './AtomLoader';

const HIDE_DELAY_MS = 380;
const SAFETY_TIMEOUT_MS = 6000;

export default function RouteTransitionLoader() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const prevPath = useRef(pathname);
  const hideTimer = useRef<number | null>(null);
  const safetyTimer = useRef<number | null>(null);

  useEffect(() => {
    const clear = (ref: React.MutableRefObject<number | null>) => {
      if (ref.current !== null) {
        window.clearTimeout(ref.current);
        ref.current = null;
      }
    };

    const startLoader = () => {
      clear(hideTimer);
      clear(safetyTimer);
      setActive(true);
      safetyTimer.current = window.setTimeout(() => {
        setActive(false);
      }, SAFETY_TIMEOUT_MS);
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;
      if (
        href.startsWith('#') ||
        href.startsWith('tel:') ||
        href.startsWith('mailto:') ||
        href.startsWith('javascript:')
      ) {
        return;
      }

      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }
      startLoader();
    };

    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      clear(hideTimer);
      clear(safetyTimer);
    };
  }, []);

  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      setActive(false);
    }, HIDE_DELAY_MS);
  }, [pathname]);

  if (!active) return null;
  return <AtomLoader />;
}
