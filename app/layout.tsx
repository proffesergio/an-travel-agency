import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import SessionProviderClient from '@/components/auth/SessionProviderClient';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import RouteTransitionLoader from '@/components/layout/RouteTransitionLoader';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: 'Athar Nur Travels | Hajj, Umrah & International Tours',
  description: 'Bangladesh\'s trusted travel agency for Hajj, Umrah, international tours and air ticketing.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-white text-gray-900 antialiased font-sans">
        <SessionProviderClient>
          {children}
          <WhatsAppButton />
          <RouteTransitionLoader />
        </SessionProviderClient>
      </body>
    </html>
  );
}
