'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

/**
 * Responsive admin chrome: permanent sidebar on desktop, slide-in drawer
 * behind a hamburger top bar on mobile. The sidebar content is rendered by
 * the server layout (it holds the session info + sign-out server action)
 * and passed in as a node.
 */
export default function AdminShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer when the route changes (e.g. after tapping a nav link).
  // State is adjusted during render instead of in an effect so the closed
  // drawer paints in the same pass as the new page.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (open) setOpen(false);
  }

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="min-h-screen bg-gray-100 lg:flex">
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-[#1b4332] text-white shadow-md">
        <Link href="/admin" className="flex items-center gap-2">
          <Image
            src="/ATHAR-NUR-Logo.png"
            alt="Athar Nur Travels"
            width={100}
            height={32}
            className="h-7 w-auto brightness-0 invert"
          />
          <span className="text-green-300 text-xs font-medium border-l border-green-600 pl-2">
            Admin
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="p-2 -mr-2 rounded-lg hover:bg-green-800 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar: fixed drawer on mobile, static column on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] bg-[#1b4332] text-white flex flex-col transform transition-transform duration-200 lg:static lg:translate-x-0 lg:transform-none lg:transition-none ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="lg:hidden absolute top-3 right-3 p-2 rounded-lg text-green-100 hover:bg-green-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 flex flex-col overflow-y-auto">{sidebar}</div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
