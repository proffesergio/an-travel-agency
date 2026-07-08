'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CalendarCheck, Send } from 'lucide-react';

const inputCls =
  'w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none';

interface RoomOption {
  name: string;
  nameBn: string;
}

export default function HotelBookingForm({
  locale,
  hotelId,
  hotelName,
  rooms,
  initialRoom = '',
  initialCheckIn = '',
  initialCheckOut = '',
  initialRooms = 1,
  initialAdults = 2,
  initialChildren = 0,
}: {
  locale: string;
  hotelId: string;
  hotelName: string;
  rooms: RoomOption[];
  initialRoom?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialRooms?: number;
  initialAdults?: number;
  initialChildren?: number;
}) {
  const isBn = locale === 'bn';
  const formRef = useRef<HTMLDivElement>(null);
  const [roomType, setRoomType] = useState(initialRoom || rooms[0]?.name || '');
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [roomsCount, setRoomsCount] = useState(initialRooms);
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Let RoomCard "Book This Room" buttons select a room and scroll here.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) setRoomType(detail);
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.addEventListener('hotel-book-room', handler);
    return () => window.removeEventListener('hotel-book-room', handler);
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          category: 'hotel',
          hotelId,
          hotelName,
          roomType,
          checkIn,
          checkOut,
          roomsCount,
          guests: { adults, children },
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setDone(true);
      toast.success(
        isBn ? 'বুকিং অনুরোধ পাঠানো হয়েছে!' : 'Booking request sent! We will contact you shortly.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div
        ref={formRef}
        id="booking-form"
        className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center"
      >
        <CalendarCheck className="w-10 h-10 text-[#2d6a4f] mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-[#1b4332]">
          {isBn ? 'অনুরোধ গৃহীত হয়েছে!' : 'Request received!'}
        </h3>
        <p className="text-gray-600 text-sm mt-1">
          {isBn
            ? 'আমরা শীঘ্রই আপনার সাথে হোয়াটসঅ্যাপ বা ফোনে যোগাযোগ করব।'
            : 'Our team will confirm availability and contact you via WhatsApp or phone shortly.'}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={formRef}
      id="booking-form"
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
    >
      <h2 className="text-xl font-bold text-gray-900 mb-1">
        {isBn ? 'বুকিং অনুরোধ' : 'Booking Request'}
      </h2>
      <p className="text-sm text-gray-500 mb-5">
        {isBn
          ? 'কোনো অগ্রিম পেমেন্ট লাগবে না — আমরা প্রাপ্যতা নিশ্চিত করে যোগাযোগ করব।'
          : 'No advance payment needed — we confirm availability first, then arrange payment.'}
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isBn ? 'রুম টাইপ' : 'Room Type'} *
          </label>
          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            required
            className={`${inputCls} bg-white`}
          >
            {rooms.map((r) => (
              <option key={r.name} value={r.name}>
                {isBn ? r.nameBn || r.name : r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isBn ? 'চেক ইন' : 'Check In'} *
          </label>
          <input
            type="date"
            value={checkIn}
            min={today}
            onChange={(e) => setCheckIn(e.target.value)}
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isBn ? 'চেক আউট' : 'Check Out'} *
          </label>
          <input
            type="date"
            value={checkOut}
            min={checkIn || today}
            onChange={(e) => setCheckOut(e.target.value)}
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isBn ? 'রুম' : 'Rooms'}
          </label>
          <select
            value={roomsCount}
            onChange={(e) => setRoomsCount(Number(e.target.value))}
            className={`${inputCls} bg-white`}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isBn ? 'প্রাপ্তবয়স্ক' : 'Adults'}
          </label>
          <select
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            className={`${inputCls} bg-white`}
          >
            {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isBn ? 'শিশু' : 'Children'}
          </label>
          <select
            value={children}
            onChange={(e) => setChildren(Number(e.target.value))}
            className={`${inputCls} bg-white`}
          >
            {[0, 1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isBn ? 'আপনার নাম' : 'Your Name'} *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputCls}
            placeholder={isBn ? 'পূর্ণ নাম' : 'Full name'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isBn ? 'ফোন / হোয়াটসঅ্যাপ' : 'Phone / WhatsApp'} *
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className={inputCls}
            placeholder="01XXXXXXXXX"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isBn ? 'ইমেইল (ঐচ্ছিক)' : 'Email (optional)'}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            placeholder="you@email.com"
          />
        </div>
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isBn ? 'বার্তা (ঐচ্ছিক)' : 'Message (optional)'}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            className={`${inputCls} resize-none`}
            placeholder={isBn ? 'বিশেষ অনুরোধ...' : 'Special requests...'}
          />
        </div>
        <div className="md:col-span-3 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] transition-colors font-semibold disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            {loading
              ? isBn
                ? 'পাঠানো হচ্ছে...'
                : 'Sending...'
              : isBn
                ? 'বুকিং অনুরোধ পাঠান'
                : 'Send Booking Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
