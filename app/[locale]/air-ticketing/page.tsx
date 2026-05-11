'use client';

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Plane, Send } from 'lucide-react';
import { useParams } from 'next/navigation';

const AIRLINES = [
  'Biman Bangladesh Airlines',
  'Air Arabia',
  'flydubai',
  'IndiGo',
  'Qatar Airways',
  'Emirates',
  'Saudia',
  'Malindo Air',
  'Air Asia',
  'Thai Airways',
];

export default function AirTicketingPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    from: '', to: '', date: '',
    returnDate: '', passengers: '1', tripType: 'one-way', message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, category: 'air-ticketing', packageTitle: `${form.from} → ${form.to}` }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <div className="bg-[#1b4332] text-white py-16 px-4">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#2d6a4f] flex items-center justify-center">
              <Plane className="w-7 h-7 text-[#74c69d]" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">Air Ticketing</h1>
              <p className="text-green-200 mt-1">
                Best fares on domestic & international flights — we do the searching for you
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 lg:grid-cols-2 gap-14">
          {/* Left: Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Ticketing Service</h2>
              <p className="text-gray-600 leading-relaxed">
                Athar Nur Travels is an authorised ticketing agent for major international and domestic
                airlines. Our experienced team searches across multiple carriers to find you the best
                available fares — whether you are flying for Hajj, Umrah, business, or leisure.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Airline Partners</h3>
              <div className="flex flex-wrap gap-2">
                {AIRLINES.map((airline) => (
                  <span key={airline} className="bg-green-50 text-[#2d6a4f] text-sm font-medium px-3 py-1.5 rounded-full border border-green-100">
                    {airline}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <h3 className="font-bold text-amber-800 mb-2">Special Hajj Flights</h3>
              <p className="text-amber-700 text-sm">
                We offer dedicated Hajj flight packages on Biman Bangladesh Airlines and Saudia
                with group discounts for Hajj season. Contact us early as seats are limited.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Call / WhatsApp', value: '+88 01843 431743' },
                { label: 'Saudi Office', value: '+966 5373 11069' },
                { label: 'Office Hours', value: 'Sat–Thu: 9am–6pm' },
                { label: 'Location', value: '55 Purana Paltan, Dhaka' },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                  <div className="font-semibold text-gray-800 text-sm">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Request a Fare Quote</h2>

            {status === 'success' ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Quote Requested!</h3>
                <p className="text-green-700 text-sm">We will call you within 2 hours with the best available fares.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input name="name" value={form.name} onChange={handleChange} required placeholder="Your name" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input name="phone" value={form.phone} onChange={handleChange} required placeholder="+88 01XXXXXXXXX" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trip Type</label>
                  <select name="tripType" value={form.tripType} onChange={handleChange} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#2d6a4f] outline-none text-sm bg-white">
                    <option value="one-way">One Way</option>
                    <option value="round-trip">Round Trip</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From *</label>
                    <input name="from" value={form.from} onChange={handleChange} required placeholder="e.g. Dhaka (DAC)" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To *</label>
                    <input name="to" value={form.to} onChange={handleChange} required placeholder="e.g. Dubai (DXB)" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departure Date *</label>
                    <input type="date" name="date" value={form.date} onChange={handleChange} required className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
                    <select name="passengers" value={form.passengers} onChange={handleChange} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#2d6a4f] outline-none text-sm bg-white">
                      {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                  <textarea name="message" value={form.message} onChange={handleChange} rows={2} placeholder="Preferred airline, class, or any other requirements" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none text-sm resize-none" />
                </div>

                {status === 'error' && (
                  <p className="text-red-600 text-sm">Something went wrong. Please call us directly.</p>
                )}

                <button type="submit" disabled={status === 'loading'} className="w-full py-3 rounded-full bg-[#2d6a4f] text-white font-bold hover:bg-[#1b4332] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  {status === 'loading' ? 'Sending...' : 'Get Fare Quote'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer locale={locale} />
    </>
  );
}
