'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, MessageCircle, RotateCcw } from 'lucide-react';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[locale error boundary]', error);
    }
  }, [error]);

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '8801843431743';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-stone-50 via-white to-green-50 px-4 py-16">
      <div className="max-w-lg w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-6">
          <AlertTriangle className="w-10 h-10 text-amber-600" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-2">
          We hit an unexpected error loading this page. Our team has been notified.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Please try again, or contact us directly — we're happy to help over WhatsApp or phone.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2d6a4f] text-white font-semibold text-sm hover:bg-[#1b4332] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go home
          </Link>
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1da851] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp us
          </a>
        </div>

        {error.digest && (
          <p className="mt-8 text-xs text-gray-400 font-mono">Reference: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
