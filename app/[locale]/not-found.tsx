import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

export default function LocaleNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-stone-50 via-white to-green-50 px-4 py-16">
      <div className="max-w-lg w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
          <Compass className="w-10 h-10 text-[#2d6a4f]" />
        </div>
        <p className="text-sm font-semibold tracking-widest uppercase text-[#2d6a4f]">404</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Page not found
        </h1>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2d6a4f] text-white font-semibold text-sm hover:bg-[#1b4332] transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
