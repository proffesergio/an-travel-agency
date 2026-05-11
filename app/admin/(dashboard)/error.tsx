'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[admin] uncaught error', error);
  }, [error]);

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto bg-white rounded-xl border border-red-200 p-8 mt-12">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-red-50 text-red-700">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-600 mb-4">
              {error.message || 'An unexpected error occurred while loading this page.'}
            </p>
            {error.digest && (
              <p className="text-xs text-gray-400 font-mono mb-4">Ref: {error.digest}</p>
            )}
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
