'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Upload, Plus, Trash2, X } from 'lucide-react';
import {
  AMENITY_KEYS,
  AMENITY_LABELS,
  HOTEL_CURRENCIES,
  type AmenityKey,
} from '@/lib/hotels-shared';

const inputCls =
  'w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none';

interface RoomForm {
  name: string;
  nameBn: string;
  pricePerNight: string;
  adults: string;
  children: string;
  bedInfo: string;
  images: string[];
  available: boolean;
}

export interface HotelFormValues {
  name: string;
  nameBn: string;
  slug: string;
  city: string;
  cityBn: string;
  country: string;
  countryBn: string;
  starRating: number;
  distanceFromHaramMeters: string;
  description: string;
  descriptionBn: string;
  amenities: string[];
  images: string[];
  currency: string;
  featured: boolean;
  available: boolean;
  rooms: RoomForm[];
}

const EMPTY_ROOM: RoomForm = {
  name: '',
  nameBn: '',
  pricePerNight: '',
  adults: '2',
  children: '0',
  bedInfo: '',
  images: [],
  available: true,
};

export const EMPTY_HOTEL: HotelFormValues = {
  name: '',
  nameBn: '',
  slug: '',
  city: '',
  cityBn: '',
  country: '',
  countryBn: '',
  starRating: 3,
  distanceFromHaramMeters: '',
  description: '',
  descriptionBn: '',
  amenities: [],
  images: [],
  currency: 'BDT',
  featured: false,
  available: true,
  rooms: [{ ...EMPTY_ROOM }],
};

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function uploadFile(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    return data.url ?? null;
  } catch {
    return null;
  }
}

export default function HotelForm({
  initial,
  hotelId,
}: {
  initial: HotelFormValues;
  hotelId?: string; // present = edit mode
}) {
  const router = useRouter();
  const [form, setForm] = useState<HotelFormValues>(initial);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = Boolean(hotelId);

  const set = (patch: Partial<HotelFormValues>) => setForm((f) => ({ ...f, ...patch }));

  const handleNameChange = (value: string) => {
    set(isEdit ? { name: value } : { name: value, slug: generateSlug(value) });
  };

  const toggleAmenity = (key: AmenityKey) => {
    set({
      amenities: form.amenities.includes(key)
        ? form.amenities.filter((a) => a !== key)
        : [...form.amenities, key],
    });
  };

  const handleGalleryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    roomIndex?: number
  ) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of files) {
      const url = await uploadFile(file);
      if (url) urls.push(url);
    }
    if (urls.length < files.length) setError('Some images failed to upload');
    if (typeof roomIndex === 'number') {
      setForm((f) => {
        const rooms = [...f.rooms];
        rooms[roomIndex] = { ...rooms[roomIndex], images: [...rooms[roomIndex].images, ...urls] };
        return { ...f, rooms };
      });
    } else {
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    }
    setUploading(false);
    e.target.value = '';
  };

  const removeImage = (url: string, roomIndex?: number) => {
    if (typeof roomIndex === 'number') {
      const rooms = [...form.rooms];
      rooms[roomIndex] = {
        ...rooms[roomIndex],
        images: rooms[roomIndex].images.filter((i) => i !== url),
      };
      set({ rooms });
    } else {
      set({ images: form.images.filter((i) => i !== url) });
    }
  };

  const updateRoom = (index: number, patch: Partial<RoomForm>) => {
    const rooms = [...form.rooms];
    rooms[index] = { ...rooms[index], ...patch };
    set({ rooms });
  };

  const addRoom = () => set({ rooms: [...form.rooms, { ...EMPTY_ROOM }] });
  const removeRoom = (index: number) => {
    const rooms = [...form.rooms];
    rooms.splice(index, 1);
    set({ rooms });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      ...form,
      starRating: Number(form.starRating),
      distanceFromHaramMeters: form.distanceFromHaramMeters
        ? parseInt(form.distanceFromHaramMeters, 10)
        : undefined,
      rooms: form.rooms
        .filter((r) => r.name.trim())
        .map((r) => ({
          name: r.name,
          nameBn: r.nameBn,
          pricePerNight: parseFloat(r.pricePerNight),
          capacity: { adults: parseInt(r.adults, 10), children: parseInt(r.children, 10) || 0 },
          bedInfo: r.bedInfo || undefined,
          images: r.images,
          available: r.available,
        })),
    };

    try {
      const res = await fetch(isEdit ? `/api/admin/hotels/${hotelId}` : '/api/admin/hotels', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save hotel');
      }
      router.push('/admin/hotels');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const gallery = (images: string[], roomIndex?: number) => (
    <div className="flex flex-wrap gap-2 mt-2">
      {images.map((url) => (
        <div
          key={url}
          className="relative w-24 h-16 rounded-lg overflow-hidden border border-gray-200 group"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => removeImage(url, roomIndex)}
            className="absolute top-0.5 right-0.5 p-0.5 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/hotels" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Hotel' : 'Add New Hotel'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Saved changes appear on the public site immediately
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hotel Name (English) *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                className={inputCls}
                placeholder="e.g., Swissôtel Al Maqam Makkah"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hotel Name (Bengali) *
              </label>
              <input
                type="text"
                value={form.nameBn}
                onChange={(e) => set({ nameBn: e.target.value })}
                required
                className={inputCls}
                placeholder="হোটেলের নাম বাংলায়"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => set({ slug: e.target.value })}
                required
                className={inputCls}
                placeholder="swissotel-al-maqam-makkah"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Star Rating *</label>
              <select
                value={form.starRating}
                onChange={(e) => set({ starRating: Number(e.target.value) })}
                className={`${inputCls} bg-white`}
              >
                {[5, 4, 3, 2, 1].map((s) => (
                  <option key={s} value={s}>
                    {s} Star{s > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City (English) *
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => set({ city: e.target.value })}
                required
                className={inputCls}
                placeholder="Makkah"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City (Bengali) *
              </label>
              <input
                type="text"
                value={form.cityBn}
                onChange={(e) => set({ cityBn: e.target.value })}
                required
                className={inputCls}
                placeholder="মক্কা"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country (English) *
              </label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => set({ country: e.target.value })}
                required
                className={inputCls}
                placeholder="Saudi Arabia"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country (Bengali) *
              </label>
              <input
                type="text"
                value={form.countryBn}
                onChange={(e) => set({ countryBn: e.target.value })}
                required
                className={inputCls}
                placeholder="সৌদি আরব"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => set({ currency: e.target.value })}
                className={`${inputCls} bg-white`}
              >
                {HOTEL_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distance from Haram (meters)
                <span className="text-gray-400 font-normal"> — Makkah/Madinah hotels only</span>
              </label>
              <input
                type="number"
                value={form.distanceFromHaramMeters}
                onChange={(e) => set({ distanceFromHaramMeters: e.target.value })}
                min="0"
                className={inputCls}
                placeholder="150"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (English) *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
                required
                rows={4}
                className={`${inputCls} resize-none`}
                placeholder="Hotel description in English..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Bengali) *
              </label>
              <textarea
                value={form.descriptionBn}
                onChange={(e) => set({ descriptionBn: e.target.value })}
                required
                rows={4}
                className={`${inputCls} resize-none`}
                placeholder="বাংলায় হোটেলের বর্ণনা..."
              />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {AMENITY_KEYS.map((key) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.amenities.includes(key)}
                  onChange={() => toggleAmenity(key)}
                  className="w-4 h-4 rounded border-gray-300 text-[#2d6a4f] focus:ring-[#2d6a4f]"
                />
                <span className="text-sm text-gray-700">{AMENITY_LABELS[key].en}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Hotel Gallery */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hotel Photos</h2>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleGalleryUpload(e)}
            className="hidden"
            id="hotel-gallery-upload"
            disabled={uploading}
          />
          <label
            htmlFor="hotel-gallery-upload"
            className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${uploading ? 'opacity-50' : ''}`}
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Photos'}
          </label>
          <p className="text-sm text-gray-500 mt-2">
            First photo is the cover. Recommended 1200x800px.
          </p>
          {gallery(form.images)}
        </div>

        {/* Room Types */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Room Types</h2>
            <button
              type="button"
              onClick={addRoom}
              className="inline-flex items-center gap-1 text-sm text-[#2d6a4f] hover:text-[#1b4332] font-medium"
            >
              <Plus className="w-4 h-4" /> Add Room Type
            </button>
          </div>
          <div className="space-y-4">
            {form.rooms.map((room, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Room Type {index + 1}</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={room.available}
                        onChange={(e) => updateRoom(index, { available: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-[#2d6a4f] focus:ring-[#2d6a4f]"
                      />
                      Available
                    </label>
                    {form.rooms.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRoom(index)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={room.name}
                    onChange={(e) => updateRoom(index, { name: e.target.value })}
                    className={inputCls}
                    placeholder="Room name (e.g., Deluxe King Room)"
                  />
                  <input
                    type="text"
                    value={room.nameBn}
                    onChange={(e) => updateRoom(index, { nameBn: e.target.value })}
                    className={inputCls}
                    placeholder="রুমের নাম বাংলায়"
                  />
                  <input
                    type="number"
                    value={room.pricePerNight}
                    onChange={(e) => updateRoom(index, { pricePerNight: e.target.value })}
                    min="0"
                    className={inputCls}
                    placeholder="Price per night"
                  />
                  <input
                    type="text"
                    value={room.bedInfo}
                    onChange={(e) => updateRoom(index, { bedInfo: e.target.value })}
                    className={inputCls}
                    placeholder="Bed info (e.g., 1 King Bed)"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 whitespace-nowrap">Adults</label>
                    <input
                      type="number"
                      value={room.adults}
                      onChange={(e) => updateRoom(index, { adults: e.target.value })}
                      min="1"
                      className={inputCls}
                    />
                    <label className="text-sm text-gray-600 whitespace-nowrap">Children</label>
                    <input
                      type="number"
                      value={room.children}
                      onChange={(e) => updateRoom(index, { children: e.target.value })}
                      min="0"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleGalleryUpload(e, index)}
                      className="hidden"
                      id={`room-upload-${index}`}
                      disabled={uploading}
                    />
                    <label
                      htmlFor={`room-upload-${index}`}
                      className={`inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-white transition-colors cursor-pointer text-sm ${uploading ? 'opacity-50' : ''}`}
                    >
                      <Upload className="w-4 h-4" />
                      Room Photos
                    </label>
                  </div>
                </div>
                {gallery(room.images, index)}
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.available}
                onChange={(e) => set({ available: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-[#2d6a4f] focus:ring-[#2d6a4f]"
              />
              <span className="text-sm text-gray-700">Visible on the website</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set({ featured: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-[#2d6a4f] focus:ring-[#2d6a4f]"
              />
              <span className="text-sm text-gray-700">Featured (show on homepage)</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/admin/hotels"
            className="px-6 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || uploading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] transition-colors font-medium disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Hotel'}
          </button>
        </div>
      </form>
    </div>
  );
}
