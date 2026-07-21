'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';

export default function ImageUploadField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      onChange(data.url as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>

      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative w-20 h-20 rounded-lg border border-gray-200 bg-white overflow-hidden">
            <Image src={value} alt={label} fill sizes="80px" className="object-contain p-1" />
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="Remove image"
              className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-white/90 text-red-500 shadow"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="w-20 h-20 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-300">
            <Upload className="w-5 h-5" />
          </div>
        )}

        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading…' : 'Choose image'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      {hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
