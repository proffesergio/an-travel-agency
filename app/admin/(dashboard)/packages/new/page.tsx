'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Save, Upload, X, Plus, Trash2 } from 'lucide-react';

interface ItineraryDay {
  day: string;
  title: string;
  description: string;
}

export default function NewPackagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    titleBn: '',
    slug: '',
    category: 'tour' as 'hajj' | 'umrah' | 'tour',
    price: '',
    currency: 'BDT',
    duration: '',
    durationBn: '',
    description: '',
    descriptionBn: '',
    inclusions: [''],
    inclusionsBn: [''],
    itinerary: [{ day: '', title: '', description: '' }] as ItineraryDay[],
    imageUrl: '',
    featured: false,
    available: true,
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (value: string) => {
    setForm({ ...form, title: value, slug: generateSlug(value) });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setForm({ ...form, imageUrl: data.url });
      }
    } catch {
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          inclusions: form.inclusions.filter((i) => i.trim()),
          inclusionsBn: form.inclusionsBn.filter((i) => i.trim()),
          itinerary: form.itinerary.filter((i) => i.day && i.title),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const issues = (data as { issues?: { fieldErrors?: Record<string, string[]> } })?.issues;
        const fieldMsg = issues?.fieldErrors
          ? Object.entries(issues.fieldErrors)
              .filter(([, v]) => v?.length)
              .map(([k, v]) => `${k}: ${v[0]}`)
              .slice(0, 3)
              .join(' · ')
          : null;
        throw new Error(fieldMsg || data?.error || 'Failed to create package');
      }

      router.push('/admin/packages');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const addInclusions = () => setForm({ ...form, inclusions: [...form.inclusions, ''] });
  const removeInclusions = (index: number) => {
    const newInclusions = [...form.inclusions];
    newInclusions.splice(index, 1);
    setForm({ ...form, inclusions: newInclusions });
  };
  const updateInclusion = (index: number, value: string) => {
    const newInclusions = [...form.inclusions];
    newInclusions[index] = value;
    setForm({ ...form, inclusions: newInclusions });
  };

  const addInclusionsBn = () => setForm({ ...form, inclusionsBn: [...form.inclusionsBn, ''] });
  const removeInclusionsBn = (index: number) => {
    const newInclusions = [...form.inclusionsBn];
    newInclusions.splice(index, 1);
    setForm({ ...form, inclusionsBn: newInclusions });
  };
  const updateInclusionBn = (index: number, value: string) => {
    const newInclusions = [...form.inclusionsBn];
    newInclusions[index] = value;
    setForm({ ...form, inclusionsBn: newInclusions });
  };

  const addItinerary = () => setForm({ ...form, itinerary: [...form.itinerary, { day: '', title: '', description: '' }] });
  const removeItinerary = (index: number) => {
    const newItinerary = [...form.itinerary];
    newItinerary.splice(index, 1);
    setForm({ ...form, itinerary: newItinerary });
  };
  const updateItinerary = (index: number, field: keyof ItineraryDay, value: string) => {
    const newItinerary = [...form.itinerary];
    newItinerary[index] = { ...newItinerary[index], [field]: value };
    setForm({ ...form, itinerary: newItinerary });
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/packages"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Package</h1>
          <p className="text-gray-500 text-sm mt-1">Create a new Hajj, Umrah, or Tour package</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (English) *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none"
                placeholder="e.g., Premium Hajj Package 2025"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (Bengali)</label>
              <input
                type="text"
                value={form.titleBn}
                onChange={(e) => setForm({ ...form, titleBn: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none"
                placeholder="প্রিমিয়াম হজ্জ প্যাকেজ ২০২৫"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none"
                placeholder="premium-hajj-package-2025"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as 'hajj' | 'umrah' | 'tour' })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none bg-white"
              >
                <option value="hajj">Hajj</option>
                <option value="umrah">Umrah</option>
                <option value="tour">Tour</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                min="0"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none"
                placeholder="150000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none bg-white"
              >
                <option value="BDT">BDT (Taka)</option>
                <option value="USD">USD</option>
                <option value="SAR">SAR (Riyal)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (English) *</label>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none"
                placeholder="15 Days / 14 Nights"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Bengali)</label>
              <input
                type="text"
                value={form.durationBn}
                onChange={(e) => setForm({ ...form, durationBn: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none"
                placeholder="১৫ দিন / ১৪ রাত"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (English)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none resize-none"
                placeholder="Package description in English..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Bengali)</label>
              <textarea
                value={form.descriptionBn}
                onChange={(e) => setForm({ ...form, descriptionBn: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none resize-none"
                placeholder="বাংলায় প্যাকেজ বর্ণনা..."
              />
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Package Image</h2>
          <div className="flex items-start gap-6">
            <div className="w-48 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
              {imagePreview || form.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview || form.imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <Upload className="w-8 h-8 mx-auto mb-2" />
                  <span className="text-xs">No image</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={uploading}
              />
              <label
                htmlFor="image-upload"
                className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${uploading ? 'opacity-50' : ''}`}
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload Image'}
              </label>
              <p className="text-sm text-gray-500 mt-2">Recommended: 1200x800px or similar ratio</p>
              {form.imageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setForm({ ...form, imageUrl: '' });
                    setImagePreview(null);
                  }}
                  className="ml-3 text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Inclusions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Inclusions (What's Included)</h2>
            <button
              type="button"
              onClick={addInclusions}
              className="text-sm text-[#2d6a4f] hover:text-[#1b4332] font-medium"
            >
              + Add More
            </button>
          </div>
          <div className="space-y-2">
            {form.inclusions.map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={form.inclusions[index]}
                  onChange={(e) => updateInclusion(index, e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none"
                  placeholder={`Inclusion ${index + 1}`}
                />
                {form.inclusions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInclusions(index)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <h3 className="text-md font-medium text-gray-700 mt-6 mb-4">Bengali Inclusions</h3>
          <div className="space-y-2">
            {form.inclusionsBn.map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={form.inclusionsBn[index]}
                  onChange={(e) => updateInclusionBn(index, e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none"
                  placeholder={`অন্তর্ভুক্তি ${index + 1}`}
                />
                {form.inclusionsBn.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInclusionsBn(index)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Itinerary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Itinerary</h2>
            <button
              type="button"
              onClick={addItinerary}
              className="text-sm text-[#2d6a4f] hover:text-[#1b4332] font-medium"
            >
              + Add Day
            </button>
          </div>
          <div className="space-y-4">
            {form.itinerary.map((day, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Day {index + 1}</span>
                  {form.itinerary.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItinerary(index)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={day.day}
                    onChange={(e) => updateItinerary(index, 'day', e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none"
                    placeholder="Day title (e.g., Day 1)"
                  />
                  <input
                    type="text"
                    value={day.title}
                    onChange={(e) => updateItinerary(index, 'title', e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none"
                    placeholder="Activity title"
                  />
                  <input
                    type="text"
                    value={day.description}
                    onChange={(e) => updateItinerary(index, 'description', e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 outline-none"
                    placeholder="Description"
                  />
                </div>
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
                onChange={(e) => setForm({ ...form, available: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-[#2d6a4f] focus:ring-[#2d6a4f]"
              />
              <span className="text-sm text-gray-700">Available for booking</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-[#2d6a4f] focus:ring-[#2d6a4f]"
              />
              <span className="text-sm text-gray-700">Featured package (show on homepage)</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/admin/packages"
            className="px-6 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] transition-colors font-medium disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Package'}
          </button>
        </div>
      </form>
    </div>
  );
}
