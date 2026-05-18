import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import SessionProviderClient from '@/components/auth/SessionProviderClient';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: 'Athar Nur Travels | Hajj, Umrah & International Tours',
  description: 'Bangladesh\'s trusted travel agency for Hajj, Umrah, international tours and air ticketing.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-white text-gray-900 antialiased">
        <SessionProviderClient>
          {children}
          <WhatsAppButton />
        </SessionProviderClient>
      </body>
    </html>
  );
}
