'use client';

import { useRef, useState } from 'react';
import {
  AlertCircle,
  FileText,
  IdCard,
  Image as ImageIcon,
  Loader2,
  Send,
  UserCircle,
  X,
} from 'lucide-react';
import Hajj2027PaymentStep from './Hajj2027PaymentStep';

type FileField = 'passportImage' | 'nidImage' | 'photoImage';

interface UploadSlotProps {
  id: FileField;
  label: string;
  hint: string;
  Icon: React.ComponentType<{ className?: string }>;
  file: File | null;
  preview: string | null;
  onChange: (file: File | null) => void;
}

function UploadSlot({ id, label, hint, Icon, file, preview, onChange }: UploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className={`relative flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden ${
          file
            ? 'border-[#74c69d] bg-green-50/60'
            : 'border-stone-300 bg-white hover:border-[#74c69d] hover:bg-green-50/30'
        }`}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={label} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <span className="absolute bottom-2 left-2 right-2 text-white text-xs font-semibold truncate">
              {file?.name}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onChange(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-gray-700 hover:bg-white flex items-center justify-center"
              aria-label="Remove"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : file ? (
          <div className="flex flex-col items-center text-[#2d6a4f] px-3 text-center">
            <FileText className="w-8 h-8 mb-2" />
            <span className="text-xs font-semibold truncate max-w-full">{file.name}</span>
            <span className="text-[10px] text-gray-500 mt-1">
              {(file.size / 1024).toFixed(0)} KB
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-gray-500 px-3 text-center">
            <Icon className="w-8 h-8 mb-2 text-[#2d6a4f]" />
            <span className="text-sm font-semibold text-gray-800">{label}</span>
            <span className="text-[11px] text-gray-500 mt-1">{hint}</span>
          </div>
        )}
        <input
          ref={inputRef}
          id={id}
          name={id}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            onChange(f);
          }}
        />
      </label>
    </div>
  );
}

interface FormState {
  name: string;
  nameBn: string;
  phone: string;
  email: string;
  nidNumber: string;
  passportNumber: string;
  dateOfBirth: string;
  address: string;
  packageType: 'economy' | 'standard' | 'premium' | 'undecided';
  notes: string;
}

const INITIAL: FormState = {
  name: '',
  nameBn: '',
  phone: '',
  email: '',
  nidNumber: '',
  passportNumber: '',
  dateOfBirth: '',
  address: '',
  packageType: 'undecided',
  notes: '',
};

export default function Hajj2027RegistrationForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [files, setFiles] = useState<Record<FileField, File | null>>({
    passportImage: null,
    nidImage: null,
    photoImage: null,
  });
  const [previews, setPreviews] = useState<Record<FileField, string | null>>({
    passportImage: null,
    nidImage: null,
    photoImage: null,
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [enquiryId, setEnquiryId] = useState<string>('');
  const [savedName, setSavedName] = useState<string>('');

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setFile = (key: FileField, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
    setPreviews((prev) => {
      const old = prev[key];
      if (old) URL.revokeObjectURL(old);
      return {
        ...prev,
        [key]: file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v ?? '')));
      (Object.entries(files) as [FileField, File | null][]).forEach(([k, f]) => {
        if (f) fd.append(k, f);
      });

      const res = await fetch('/api/hajj2027/register', { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus('error');
        setErrorMessage(json.error ?? 'Failed to submit. Please try again.');
        return;
      }
      setEnquiryId(json.enquiryId ?? '');
      setSavedName(form.name);
      setStatus('success');
      setForm(INITIAL);
      setFiles({ passportImage: null, nidImage: null, photoImage: null });
      Object.values(previews).forEach((p) => p && URL.revokeObjectURL(p));
      setPreviews({ passportImage: null, nidImage: null, photoImage: null });
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    }
  };

  if (status === 'success' && enquiryId) {
    return (
      <Hajj2027PaymentStep
        enquiryId={enquiryId}
        customerName={savedName}
        onReset={() => {
          setStatus('idle');
          setEnquiryId('');
          setSavedName('');
        }}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-10"
    >
      {/* Identity section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-5">
          <UserCircle className="w-5 h-5 text-[#2d6a4f]" />
          <h3 className="text-lg font-bold text-gray-900">ব্যক্তিগত তথ্য / Personal Information</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="পূর্ণ নাম (English) *" htmlFor="name">
            <input
              id="name"
              required
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Mohammad Karim"
              className="input"
            />
          </Field>
          <Field label="পূর্ণ নাম (বাংলা)" htmlFor="nameBn">
            <input
              id="nameBn"
              value={form.nameBn}
              onChange={(e) => updateField('nameBn', e.target.value)}
              placeholder="মোহাম্মদ করিম"
              className="input"
            />
          </Field>
          <Field label="মোবাইল নম্বর *" htmlFor="phone">
            <input
              id="phone"
              required
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+88 01XXXXXXXXX"
              className="input"
            />
          </Field>
          <Field label="ইমেইল" htmlFor="email">
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="your@email.com"
              className="input"
            />
          </Field>
          <Field label="জন্ম তারিখ" htmlFor="dateOfBirth">
            <input
              id="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => updateField('dateOfBirth', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="প্যাকেজ পছন্দ" htmlFor="packageType">
            <select
              id="packageType"
              value={form.packageType}
              onChange={(e) =>
                updateField('packageType', e.target.value as FormState['packageType'])
              }
              className="input bg-white"
            >
              <option value="undecided">Not decided yet</option>
              <option value="economy">Economy</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </Field>
          <Field label="ঠিকানা" htmlFor="address" full>
            <input
              id="address"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="District, Thana, Village/Road"
              className="input"
            />
          </Field>
        </div>
      </div>

      {/* Identification section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-5">
          <IdCard className="w-5 h-5 text-[#2d6a4f]" />
          <h3 className="text-lg font-bold text-gray-900">পরিচয় / Identification</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="NID নম্বর *" htmlFor="nidNumber">
            <input
              id="nidNumber"
              required
              value={form.nidNumber}
              onChange={(e) => updateField('nidNumber', e.target.value)}
              placeholder="National ID number"
              className="input"
            />
          </Field>
          <Field label="পাসপোর্ট নম্বর" htmlFor="passportNumber">
            <input
              id="passportNumber"
              value={form.passportNumber}
              onChange={(e) => updateField('passportNumber', e.target.value)}
              placeholder="If available"
              className="input"
            />
          </Field>
        </div>
      </div>

      {/* Uploads */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon className="w-5 h-5 text-[#2d6a4f]" />
          <h3 className="text-lg font-bold text-gray-900">ডকুমেন্ট আপলোড / Documents</h3>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          JPG / PNG / PDF · প্রতিটি ফাইল সর্বোচ্চ 5MB · নিরাপদে সংরক্ষিত
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <UploadSlot
            id="passportImage"
            label="পাসপোর্ট ছবি"
            hint="Passport copy"
            Icon={FileText}
            file={files.passportImage}
            preview={previews.passportImage}
            onChange={(f) => setFile('passportImage', f)}
          />
          <UploadSlot
            id="nidImage"
            label="NID ছবি"
            hint="National ID copy"
            Icon={IdCard}
            file={files.nidImage}
            preview={previews.nidImage}
            onChange={(f) => setFile('nidImage', f)}
          />
          <UploadSlot
            id="photoImage"
            label="পাসপোর্ট সাইজ ছবি"
            hint="Passport-size photograph"
            Icon={UserCircle}
            file={files.photoImage}
            preview={previews.photoImage}
            onChange={(f) => setFile('photoImage', f)}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <Field label="বিশেষ মন্তব্য / Notes" htmlFor="notes">
          <textarea
            id="notes"
            rows={3}
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="অন্য কোনো তথ্য (medical, dietary, group members)"
            className="input resize-none"
          />
        </Field>
      </div>

      {status === 'error' && (
        <div className="mb-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full bg-gradient-to-r from-[#2d6a4f] to-[#1b4332] text-white font-bold text-base shadow-md hover:shadow-lg disabled:opacity-60 transition-shadow"
      >
        {status === 'submitting' ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            পাঠানো হচ্ছে…
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            প্রাক নিবন্ধন জমা দিন
          </>
        )}
      </button>

      <p className="mt-3 text-center text-xs text-gray-500">
        আপনার তথ্য সম্পূর্ণ গোপনীয় ও নিরাপদে রাখা হবে। We never share your documents with third parties.
      </p>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 0.7rem 1rem;
          border: 1px solid rgb(226 232 226);
          border-radius: 0.75rem;
          font-size: 0.875rem;
          outline: none;
          transition: border 0.2s, box-shadow 0.2s;
          background: white;
        }
        :global(.input:focus) {
          border-color: #2d6a4f;
          box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.15);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
  full,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
