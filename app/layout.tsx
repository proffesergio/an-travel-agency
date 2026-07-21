import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import SessionProviderClient from '@/components/auth/SessionProviderClient';
import RouteTransitionLoader from '@/components/layout/RouteTransitionLoader';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
});

// Fallback only — every public page is under app/[locale], whose layout
// generates metadata from the database. This covers /admin.
export const metadata: Metadata = {
  title: 'Athar Nur Travels',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-white text-gray-900 antialiased font-sans">
        <SessionProviderClient>
          {children}
          <RouteTransitionLoader />
        </SessionProviderClient>
      </body>
    </html>
  );
}
