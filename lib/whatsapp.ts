export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('0')) return `880${digits.slice(1)}`;
  return digits;
}

export function buildWhatsAppLink(phone: string, message?: string): string {
  const normalized = normalizePhone(phone);
  if (!normalized) return '';
  const base = `https://wa.me/${normalized}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function defaultEnquiryGreeting(name: string, packageTitle?: string): string {
  const greeting = `Assalamu Alaikum ${name},\n\nThank you for your enquiry with Athar Nur Travels`;
  const context = packageTitle ? ` about "${packageTitle}"` : '';
  return `${greeting}${context}. How can we help you today?`;
}
