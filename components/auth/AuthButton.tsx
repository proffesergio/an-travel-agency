'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { ChevronDown, LogOut, UserCircle } from 'lucide-react';
import AuthModal from './AuthModal';

type Mode = 'signin' | 'register';

export default function AuthButton() {
  const t = useTranslations('nav');
  const ta = useTranslations('auth');
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('register');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpen]);

  const openRegister = () => {
    setMode('register');
    setOpen(true);
  };

  if (status === 'loading') {
    return (
      <div className="hidden md:flex h-9 w-32 rounded-full bg-gray-100 animate-pulse" />
    );
  }

  if (session?.user) {
    const initial = session.user.name?.[0]?.toUpperCase() ?? 'U';
    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((s) => !s);
          }}
          className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-gray-200 hover:border-[#2d6a4f] hover:bg-green-50/60 transition-colors"
        >
          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2d6a4f] to-[#1b4332] text-white text-xs font-bold flex items-center justify-center">
            {initial}
          </span>
          <span className="hidden sm:inline text-sm font-semibold text-gray-700 max-w-[110px] truncate">
            {session.user.name ?? 'Account'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>
        {menuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                {ta('signedInAs')}
              </p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
            </div>
            <button
              onClick={() => {
                setMenuOpen(false);
                signOut({ callbackUrl: '/' });
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {t('signOut')}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={openRegister}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#2d6a4f] to-[#1b4332] text-white text-sm font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
      >
        <UserCircle className="w-4 h-4" />
        {t('register')}
      </button>
      <AuthModal open={open} initialMode={mode} onClose={() => setOpen(false)} />
    </>
  );
}
