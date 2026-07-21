'use client';

import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton({ number }: { number: string }) {
  if (!number) return null;

  const link = `https://wa.me/${number}?text=Hello%2C%20I%20am%20interested%20in%20your%20travel%20packages.`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#1ebe5d] hover:scale-110 transition-all"
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
}
