'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  X,
  Package,
  Wrench,
  Home,
  Camera,
  MapPin,
  Loader2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

interface PostAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  defaultCity?: string;
  defaultNeighborhood?: string;
  onSuccess: () => void;
}

const CATEGORIES = {
  product: ['Phones & Tablets', 'Laptops & Computers', 'Fashion & Sneakers', 'Cars & Vehicles', 'Electronics & TVs', 'Furniture & Home', 'Other Goods'],
  service: ['Repairs & Tech', 'Beauty & Barbering', 'Graphic Design & Media', 'Dispatch & Delivery', 'Plumbing & Electrical', 'Cleaning & Laundry', 'Events & Catering'],
  property: ['Apartments & Chamber/Hall', 'Hostels & Shared Rooms', 'Houses for Sale', 'Land & Plots', 'Shops & Office Space'],
};

const CONDITIONS = ['Brand New', 'UK Used', 'Fairly Used', 'Refurbished'];
const PRICE_PERIODS = ['one-time', 'per month', 'per year', 'starting at', 'per day'];
const GHANA_CITIES = ['Accra', 'Kumasi', 'Takoradi', 'Tamale', 'Tema', 'Cape Coast', 'Koforidua', 'Sunyani', 'Ho'];

export default function PostAdModal({
  isOpen,
  onClose,
  userId,
  defaultCity = 'Accra',
  defaultNeighborhood = '',
  onSuccess,
}: PostAdModalProps) {
  const [vertical, setVertical] = useState<'product' | 'service' | 'property'>('product');
  const [category, setCategory] = useState(CATEGORIES.product[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('UK Used');
  const [price, setPrice] = useState('');
  const [pricePeriod, setPricePeriod] = useState('one-time');
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [city, setCity] = useState(defaultCity);
  const [neighborhood, setNeighborhood] = useState(defaultNeighborhood);

  // Media files state
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerticalChange = (newVertical: 'product' | 'service' | 'property') => {
    setVertical(newVertical);
    setCategory(CATEGORIES[newVertical][0]);
    if (newVertical === 'product') {
      setPricePeriod('one-time');
    } else if (newVertical === 'service') {
      setPricePeriod('starting at');
    } else {
      setPricePeriod('per month');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files).slice(0, 4 - files.length);
    const newFiles = [...files, ...selected];
    setFiles(newFiles);

    const newPreviews = selected.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Upload media files to Supabase Storage ('listing-media' bucket)
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('listing-media')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('listing-media')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrlData.publicUrl);
      }

      // 2. Insert listing row into PostgreSQL
      const { error: insertError } = await supabase.from('listings').insert({
        seller_id: userId,
        vertical,
        category,
        title: title.trim(),
        description: description.trim(),
        condition: vertical === 'product' ? condition : null,
        price: parseFloat(price),
        price_period: pricePeriod,
        currency: 'GHS',
        is_negotiable: isNegotiable,
        country_code: 'GH',
        city,
        neighborhood: neighborhood.trim(),
        media_urls: uploadedUrls,
      });

      if (insertError) throw insertError;

      // Reset form & refresh feed
      setTitle('');
      setDescription('');
      setPrice('');
      setFiles([]);
      setPreviews([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to publish listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Post on Find It</h2>
            <p className="text-xs text-slate-500">Reach buyers across Ghana directly — zero fees</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Vertical Selector (Product / Service / Property) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              What are you advertising?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'product', label: 'Product', icon: Package },
                { id: 'service', label: 'Service', icon: Wrench },
                { id: 'property', label: 'Property', icon: Home },
              ].map((item) => {
                const Icon = item.icon;
                const active = vertical === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleVerticalChange(item.id as any)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition ${
                      active
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photo / Short Video Upload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Photos or Short Video Clip (Max 4)
              </label>
              <span className="text-[11px] text-slate-400">{files.length}/4 added</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {previews.map((src, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  {files[idx]?.type.startsWith('video/') ? (
                    <video src={src} className="w-full h-full object-cover" />
                  ) : (
                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/75 text-white hover:bg-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {files.length < 4 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50 flex flex-col items-center justify-center gap-1 cursor-pointer text-slate-500 transition">
                  <Camera className="w-5 h-5 text-emerald-600" />
                  <span className="text-[10px] font-semibold">Add Media</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Category & Condition */}
          <div className={`grid ${vertical === 'product' ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {CATEGORIES[vertical].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {vertical === 'product' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {CONDITIONS.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ad Title</label>
            <input
              type="text"
              required
              placeholder={
                vertical === 'product'
                  ? 'e.g. iPhone 13 Pro 256GB Sierra Blue (89% BH)'
                  : vertical === 'service'
                  ? 'e.g. Professional Graphic Designer & Brand Identity'
                  : 'e.g. Neat 2-Bedroom Self-Contain Apartment'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Price & Billing Period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Price (GHS ₵)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="e.g. 5500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Price Basis</label>
              <select
                value={pricePeriod}
                onChange={(e) => setPricePeriod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {PRICE_PERIODS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Negotiable Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isNegotiable}
              onChange={(e) => setIsNegotiable(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs font-medium text-slate-700">Price is negotiable</span>
          </label>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Details & Specifications
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe key details, flaws (if any), included accessories, or terms..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {GHANA_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Neighborhood
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Madina, Osu"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading & Publishing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Publish Ad Now
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}