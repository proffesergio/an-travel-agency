'use client';

import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '966537311069';

export default function WhatsAppButton() {
  const link = `https://wa.me/${WHATSAPP_NUMBER}?text=Hello%2C%20I%20am%20interested%20in%20your%20travel%20packages.`;

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
