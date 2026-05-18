'use client';

import { useEffect, useRef, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  Sparkles,
  User as UserIcon,
  X,
} from 'lucide-react';

type Mode = 'signin' | 'register';

interface AuthModalProps {
  open: boolean;
  initialMode?: Mode;
  onClose: () => void;
}

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" {...props}>
    <path
      fill="#FFC107"
      d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5 44.5 36.3 44.5 25c0-1.5-.2-3-.5-4.5z"
    />
    <path
      fill="#FF3D00"
      d="M6.3 14.7l6.6 4.8C14.7 15.3 19 12.5 24 12.5c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 16.3 4.5 9.6 8.6 6.3 14.7z"
    />
    <path
      fill="#4CAF50"
      d="M24 45.5c5.4 0 10.4-2.1 14-5.4l-6.5-5.5c-2 1.4-4.6 2.4-7.5 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5c3.3 6.1 9.9 11.5 17.8 11.5z"
    />
    <path
      fill="#1976D2"
      d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.5 5.5c-.5.5 7-5.1 7-14.1 0-1.5-.2-3-.5-4.5z"
    />
  </svg>
);

interface FormState {
  // sign in
  identifier: string;
  // register
  name: string;
  email: string;
  phone: string;
  password: string;
}

const EMPTY: FormState = {
  identifier: '',
  name: '',
  email: '',
  phone: '',
  password: '',
};

export default function AuthModal({ open, initialMode = 'signin', onClose }: AuthModalProps) {
  const t = useTranslations('auth');
  const [mode, setMode] = useState<Mode>(initialMode);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setStatus('idle');
      setErrorMessage('');
      setShowPassword(false);
      requestAnimationFrame(() => firstInputRef.current?.focus());
    }
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');
    try {
      const result = await signIn('credentials', {
        identifier: form.identifier,
        password: form.password,
        redirect: false,
      });
      if (!result || result.error) {
        setStatus('error');
        setErrorMessage('Invalid email/phone or password.');
        return;
      }
      setStatus('success');
      setTimeout(() => {
        onClose();
        if (typeof window !== 'undefined') window.location.reload();
      }, 600);
    } catch {
      setStatus('error');
      setErrorMessage('Sign in failed. Please try again.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setErrorMessage(json.error ?? 'Could not create account.');
        return;
      }
      // auto sign-in after register
      const result = await signIn('credentials', {
        identifier: form.email,
        password: form.password,
        redirect: false,
      });
      if (!result || result.error) {
        setStatus('success');
        setErrorMessage('');
        setMode('signin');
        return;
      }
      setStatus('success');
      setTimeout(() => {
        onClose();
        if (typeof window !== 'undefined') window.location.reload();
      }, 600);
    } catch {
      setStatus('error');
      setErrorMessage('Could not create account. Please try again.');
    }
  };

  const handleGoogle = async () => {
    setStatus('submitting');
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch {
      setStatus('error');
      setErrorMessage('Google sign-in is not configured.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header gradient */}
        <div className="relative bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#1b4332] px-7 pt-8 pb-14 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <Sparkles className="absolute top-4 right-8 w-4 h-4 text-amber-200 animate-twinkle" />
            <Sparkles
              className="absolute bottom-4 left-12 w-3 h-3 text-amber-200 animate-twinkle"
              style={{ animationDelay: '0.8s' }}
            />
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <h2 id="auth-modal-title" className="text-2xl font-bold relative">
            {mode === 'signin' ? t('signInTitle') : t('registerTitle')}
          </h2>
          <p className="text-sm text-green-100/80 mt-1 relative">
            {mode === 'signin' ? t('signInSubtitle') : t('registerSubtitle')}
          </p>
        </div>

        {/* Floating tab pill */}
        <div className="relative -mt-6 mx-6 mb-2 bg-white rounded-full p-1 shadow-md flex border border-gray-100">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${
              mode === 'signin'
                ? 'bg-[#2d6a4f] text-white shadow-sm'
                : 'text-gray-600 hover:text-[#2d6a4f]'
            }`}
          >
            {t('submitSignIn')}
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${
              mode === 'register'
                ? 'bg-[#2d6a4f] text-white shadow-sm'
                : 'text-gray-600 hover:text-[#2d6a4f]'
            }`}
          >
            {t('submitRegister')}
          </button>
        </div>

        {/* Form body */}
        <div className="px-7 pt-2 pb-7">
          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <Field label={t('identifier')} htmlFor="identifier" Icon={Mail}>
                <input
                  ref={firstInputRef}
                  id="identifier"
                  required
                  value={form.identifier}
                  onChange={(e) => updateField('identifier', e.target.value)}
                  placeholder="you@example.com or 01XXXXXXXXX"
                  className="auth-input"
                  autoComplete="username"
                />
              </Field>
              <Field label={t('password')} htmlFor="password" Icon={Lock}>
                <div className="relative">
                  <input
                    id="password"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="••••••••"
                    className="auth-input pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              {status === 'error' && (
                <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-r from-[#2d6a4f] to-[#1b4332] text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-60 transition-all"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('submitting')}
                  </>
                ) : (
                  t('submitSignIn')
                )}
              </button>

              <Divider label={t('orContinue')} />

              <button
                type="button"
                onClick={handleGoogle}
                disabled={status === 'submitting'}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-white border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                <GoogleIcon className="w-5 h-5" />
                {t('google')}
              </button>

              <p className="text-center text-xs text-gray-500 pt-3">
                {t('noAccount')}{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-[#2d6a4f] font-semibold hover:underline"
                >
                  {t('createOne')}
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <Field label={t('name')} htmlFor="name" Icon={UserIcon}>
                <input
                  ref={firstInputRef}
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Mohammad Karim"
                  className="auth-input"
                  autoComplete="name"
                />
              </Field>
              <Field label={`${t('phone')} *`} htmlFor="phone" Icon={Phone} hint={t('phoneHint')}>
                <input
                  id="phone"
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+88 01XXXXXXXXX"
                  className="auth-input"
                  autoComplete="tel"
                />
              </Field>
              <Field label={t('email')} htmlFor="email" Icon={Mail}>
                <input
                  id="email"
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="you@example.com"
                  className="auth-input"
                  autoComplete="email"
                />
              </Field>
              <Field label={t('password')} htmlFor="password-new" Icon={Lock} hint={t('passwordHint')}>
                <div className="relative">
                  <input
                    id="password-new"
                    required
                    type={showPassword ? 'text' : 'password'}
                    minLength={8}
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="••••••••"
                    className="auth-input pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              {status === 'error' && (
                <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {status === 'success' && (
                <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Account created.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-r from-[#2d6a4f] to-[#1b4332] text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-60 transition-all"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('submitting')}
                  </>
                ) : (
                  t('submitRegister')
                )}
              </button>

              <Divider label={t('orContinue')} />

              <button
                type="button"
                onClick={handleGoogle}
                disabled={status === 'submitting'}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-white border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                <GoogleIcon className="w-5 h-5" />
                {t('google')}
              </button>

              <p className="text-center text-xs text-gray-500 pt-3">
                {t('haveAccount')}{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-[#2d6a4f] font-semibold hover:underline"
                >
                  {t('switchToSignIn')}
                </button>
              </p>

              <p className="text-center text-[11px] text-gray-400 pt-1">{t('agreeTerms')}</p>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        :global(.auth-input) {
          width: 100%;
          padding: 0.7rem 1rem 0.7rem 2.5rem;
          border: 1px solid rgb(226 232 226);
          border-radius: 0.75rem;
          font-size: 0.875rem;
          outline: none;
          transition: border 0.2s, box-shadow 0.2s;
          background: white;
        }
        :global(.auth-input:focus) {
          border-color: #2d6a4f;
          box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.15);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  Icon,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  Icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-semibold text-gray-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
        {children}
      </div>
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="relative py-1">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-3 text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
          {label}
        </span>
      </div>
    </div>
  );
}
