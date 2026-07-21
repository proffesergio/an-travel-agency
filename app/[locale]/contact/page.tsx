'use client';

import { useState } from 'react';
import { MapPin, Phone, Clock, Send, MessageCircle } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, category: 'general', packageTitle: 'General Enquiry', passengers: 1 }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <main className="flex-1">
      {/* Hero */}
        <div className="bg-[#1b4332] text-white py-16 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-3">Contact Us</h1>
            <p className="text-green-200">
              We're here to help with your Hajj, Umrah, tour, or ticketing enquiry.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-14">
          {/* Left: Contact info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Get In Touch</h2>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-[#2d6a4f]" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Office Address</div>
                    <div className="text-gray-600 text-sm mt-1">
                      Azad Centre, 55 Purana Paltan (14th Floor)<br />
                      Dhaka-1000, Bangladesh
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-[#2d6a4f]" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Phone Numbers</div>
                    <div className="space-y-1 mt-1">
                      <a href="tel:+966537311069" className="block text-gray-600 text-sm hover:text-[#2d6a4f]">+966 5373 11069 (Saudi Arabia)</a>
                      <a href="tel:+8801843431743" className="block text-gray-600 text-sm hover:text-[#2d6a4f]">+88 01843 431743</a>
                      <a href="tel:01846805281" className="block text-gray-600 text-sm hover:text-[#2d6a4f]">01846-805281</a>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-[#2d6a4f]" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Office Hours</div>
                    <div className="text-gray-600 text-sm mt-1">
                      Saturday – Thursday: 9:00 AM – 6:00 PM<br />
                      Friday: Closed
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/966537311069?text=Hello%2C%20I%20need%20information%20about%20your%20travel%20packages."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-[#25D366] text-white px-6 py-4 rounded-2xl font-bold hover:bg-[#1ebe5d] transition-colors w-full"
            >
              <MessageCircle className="w-6 h-6" />
              <div>
                <div>Chat on WhatsApp</div>
                <div className="text-xs font-normal opacity-90">Usually responds within minutes</div>
              </div>
            </a>

            {/* Map */}
            <div className="rounded-2xl overflow-hidden h-64 bg-gray-200">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3652.0!2d90.4076!3d23.7270!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDQzJzM3LjIiTiA5MMKwMjQnMjcuNCJF!5e0!3m2!1sen!2sbd!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Athar Nur Travels Location — 55 Purana Paltan, Dhaka"
              />
            </div>
          </div>

          {/* Right: Contact form */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Send Us a Message</h2>

            {status === 'success' ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Message Sent!</h3>
                <p className="text-green-700 text-sm">Thank you! Our team will get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} required placeholder="Your full name" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input name="phone" value={form.phone} onChange={handleChange} required placeholder="+88 01XXXXXXXXX" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                  <textarea name="message" value={form.message} onChange={handleChange} required rows={5} placeholder="Tell us about your travel plans or ask any questions..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none text-sm resize-none" />
                </div>
                {status === 'error' && (
                  <p className="text-red-600 text-sm">Something went wrong. Please call us directly.</p>
                )}
                <button type="submit" disabled={status === 'loading'} className="w-full py-3 rounded-full bg-[#2d6a4f] text-white font-bold hover:bg-[#1b4332] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  {status === 'loading' ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
      </div>
    </main>
  );
}
