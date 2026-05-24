'use client';

import { useState } from 'react';
import { FileText, IdCard, Send, Upload, X } from 'lucide-react';

interface BookingEnquiryFormProps {
  packageTitle: string;
  packageId: string;
  category: string;
}

export default function BookingEnquiryForm({
  packageTitle,
  packageId,
  category,
}: BookingEnquiryFormProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    passengers: '1',
    passportNumber: '',
    message: '',
  });
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const onPassportFile = (file: File | null) => {
    setPassportFile(file);
    setPassportPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const composedMessage = [
        form.passportNumber ? `Passport No: ${form.passportNumber}` : null,
        passportFile ? `Passport image attached at enquiry: ${passportFile.name}` : null,
        form.message ? form.message : null,
      ]
        .filter(Boolean)
        .join('\n');

      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          passengers: parseInt(form.passengers),
          message: composedMessage,
          packageId,
          packageTitle,
          category,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
      setForm({ name: '', email: '', phone: '', passengers: '1', passportNumber: '', message: '' });
      onPassportFile(null);
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-green-800 mb-2">Enquiry Submitted!</h3>
        <p className="text-green-700">
          Thank you! Our team will contact you within 24 hours to confirm your booking.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="e.g. Mohammad Karim"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
            placeholder="+88 01XXXXXXXXX"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="your@email.com"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Number of Passengers *</label>
        <select
          name="passengers"
          value={form.passengers}
          onChange={handleChange}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none text-sm bg-white"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <option key={n} value={n}>{n} {n === 1 ? 'Passenger' : 'Passengers'}</option>
          ))}
          <option value="11">10+ (Group)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
            <IdCard className="w-3.5 h-3.5 text-[#2d6a4f]" />
            Passport Number
          </label>
          <input
            name="passportNumber"
            value={form.passportNumber}
            onChange={(e) => setForm({ ...form, passportNumber: e.target.value.toUpperCase() })}
            placeholder="e.g. A01234567"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none text-sm uppercase tracking-wider"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Passport Image</label>
          <label
            htmlFor="enq-passport-file"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
              passportFile
                ? 'border-[#74c69d] bg-green-50/60'
                : 'border-stone-300 bg-white hover:border-[#74c69d] hover:bg-green-50/30'
            }`}
          >
            {passportPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={passportPreview}
                alt="Passport preview"
                className="w-10 h-10 rounded-md object-cover flex-shrink-0"
              />
            ) : (
              <span className="w-10 h-10 rounded-md bg-stone-100 flex items-center justify-center flex-shrink-0">
                {passportFile ? (
                  <FileText className="w-5 h-5 text-[#2d6a4f]" />
                ) : (
                  <Upload className="w-5 h-5 text-gray-400" />
                )}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">
                {passportFile ? passportFile.name : 'Upload passport copy'}
              </p>
              <p className="text-[11px] text-gray-500">
                {passportFile
                  ? `${(passportFile.size / 1024).toFixed(0)} KB`
                  : 'JPG, PNG or PDF · Max 5MB'}
              </p>
            </div>
            {passportFile && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onPassportFile(null);
                }}
                className="text-gray-500 hover:text-red-600"
                aria-label="Remove passport image"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <input
              id="enq-passport-file"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              className="sr-only"
              onChange={(e) => onPassportFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Special Requirements</label>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          rows={3}
          placeholder="Any special requests, dietary needs, or questions..."
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none text-sm resize-none"
        />
      </div>

      {status === 'error' && (
        <p className="text-red-600 text-sm">Something went wrong. Please call us directly or try again.</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full py-3 rounded-full bg-[#2d6a4f] text-white font-bold text-base hover:bg-[#1b4332] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        {status === 'loading' ? 'Sending...' : 'Send Enquiry'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Or call us directly: <a href="tel:+8801843431743" className="text-[#2d6a4f] font-medium">+88 01843 431743</a>
      </p>
    </form>
  );
}
