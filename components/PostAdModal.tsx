'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GHANA_REGIONS, REGION_NAMES } from '@/lib/ghanaLocations';
import { X, Upload, Package, Wrench, Home, Loader2, Trash2 } from 'lucide-react';

interface PostAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  defaultRegion?: string;
  defaultCity?: string;
  onSuccess: () => void;
}

const CATEGORIES = {
  product: [
    'Phones & Tablets',
    'Laptops & Computers',
    'Electronics & TVs',
    'Vehicles & Cars',
    'Fashion & Clothing',
    'Home & Furniture',
    'Health & Beauty',
    'Other Products',
  ],
  service: [
    'Plumbing & Electrical',
    'Catering & Baking',
    'Makeup, Barber & Salon',
    'Graphic Design & Tech',
    'Auto Mechanic & Car Wash',
    'Cleaning & Laundry',
    'Delivery & Logistics',
    'Tutoring & Lessons',
  ],
  property: [
    'Chamber & Hall / Single Room',
    'Apartments for Rent',
    'Houses for Rent',
    'Houses & Land for Sale',
    'Hostels & Student Rooms',
    'Shops & Offices',
    'Short-Stay / Airbnb',
  ],
};

const CONDITIONS = ['Brand New', 'Foreign Used (UK/US)', 'Ghana Used', 'Refurbished'];

export default function PostAdModal({
  isOpen,
  onClose,
  userId,
  defaultRegion = 'Greater Accra Region',
  defaultCity = 'Madina',
  onSuccess,
}: PostAdModalProps) {
  const validRegion = GHANA_REGIONS[defaultRegion] ? defaultRegion : 'Greater Accra Region';
  const validCity = GHANA_REGIONS[validRegion]?.includes(defaultCity)
    ? defaultCity
    : GHANA_REGIONS[validRegion][0];

  const [vertical, setVertical] = useState<'product' | 'service' | 'property'>('product');
  const [category, setCategory] = useState(CATEGORIES.product[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState(CONDITIONS[1]);
  const [price, setPrice] = useState('');
  const [pricePeriod, setPricePeriod] = useState('one-time');
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [region, setRegion] = useState(validRegion);
  const [city, setCity] = useState(validCity);

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerticalChange = (newVertical: 'product' | 'service' | 'property') => {
    setVertical(newVertical);
    setCategory(CATEGORIES[newVertical][0]);
    setPricePeriod(newVertical === 'property' ? 'per month' : 'one-time');
  };

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    setCity(GHANA_REGIONS[newRegion]?.[0] || '');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files).slice(0, 5 - files.length);
    setFiles((prev) => [...prev, ...selected]);
    const newUrls = selected.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newUrls]);
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
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const ext = file.name.split('.').pop();
        const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('listing-media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('listing-media')
          .getPublicUrl(filePath);

        uploadedUrls.push(urlData.publicUrl);
      }

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
        city: region,
        neighborhood: city,
        media_urls: uploadedUrls,
        status: 'active',
      });

      if (insertError) throw insertError;

      setTitle('');
      setDescription('');
      setPrice('');
      setFiles([]);
      setPreviews([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to post ad. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Post Free Ad on Find It</h2>
            <p className="text-xs text-slate-500">Visible to all buyers across Ghana</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[84vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Vertical Selector */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleVerticalChange('product')}
              className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition ${
                vertical === 'product' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Package className="w-4 h-4" />
              Product
            </button>
            <button
              type="button"
              onClick={() => handleVerticalChange('service')}
              className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition ${
                vertical === 'service' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Wrench className="w-4 h-4" />
              Service
            </button>
            <button
              type="button"
              onClick={() => handleVerticalChange('property')}
              className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition ${
                vertical === 'property' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Home className="w-4 h-4" />
              Property
            </button>
          </div>

          {/* Media Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Photos or Short Video (Max 5)
            </label>
            <div className="flex flex-wrap gap-2">
              {previews.map((src, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                  {files[idx]?.type.startsWith('video/') ? (
                    <video src={src} className="w-full h-full object-cover" />
                  ) : (
                    <img src={src} alt="preview" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {files.length < 5 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 flex flex-col items-center justify-center cursor-pointer text-emerald-700 transition">
                  <Upload className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-semibold">Add Media</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
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
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
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
                  ? 'e.g. iPhone 14 Pro Max 256GB Deep Purple'
                  : vertical === 'service'
                  ? 'e.g. Professional Bridal & Event Makeup Artist'
                  : 'e.g. Neat 2-Bedroom Self-Contained Apartment'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Price & Period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₵ GHS)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="e.g. 4500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pricing Type</label>
              <select
                value={pricePeriod}
                onChange={(e) => setPricePeriod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <option value="one-time">One-Time Price</option>
                <option value="per day">Per Day</option>
                <option value="per month">Per Month</option>
                <option value="per year">Per Year</option>
                <option value="starting at">Starting At</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isNegotiable}
              onChange={(e) => setIsNegotiable(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            Price is negotiable
          </label>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              required
              rows={3}
              placeholder="Include key specs, delivery options, or availability..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Region & City/Town */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Region</label>
              <select
                value={region}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
              >
                {REGION_NAMES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City / Town</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
              >
                {(GHANA_REGIONS[region] || []).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md flex items-center justify-center gap-2 transition disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Publishing Ad...' : 'Publish Ad Now'}
          </button>
        </form>
      </div>
    </div>
  );
}