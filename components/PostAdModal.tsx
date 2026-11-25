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

const PRICING_OPTIONS = {
  product: [
    { value: 'one-time', label: 'One-Time / Fixed Price' },
    { value: 'starting at', label: 'Starting Price' },
    { value: 'per unit', label: 'Per Item / Wholesale Unit' },
  ],
  service: [
    { value: 'starting at', label: 'Starting At (Base Rate)' },
    { value: 'per hour', label: 'Per Hour' },
    { value: 'per day', label: 'Per Day' },
    { value: 'per job', label: 'Per Session / Full Job' },
  ],
  property: [
    { value: 'per month', label: 'Per Month' },
    { value: 'per year', label: 'Per Year (Rent Advance)' },
    { value: 'per night', label: 'Per Night (Short-Stay)' },
    { value: 'one-time', label: 'Outright Sale (Full Price)' },
  ],
};

const VERTICAL_COPY = {
  product: {
    titlePlaceholder: 'e.g. iPhone 14 Pro Max 256GB Deep Purple',
    descLabel: 'Product Specifications & Details',
    descPlaceholder:
      'Describe brand, storage size, battery health, any faults, included accessories, and delivery availability...',
  },
  service: {
    titlePlaceholder: 'e.g. Professional Bridal & Event Makeup Artist',
    descLabel: 'Service Scope & Availability',
    descPlaceholder:
      'Describe what is included in your service, years of experience, home-service or shop location, and working days/hours...',
  },
  property: {
    titlePlaceholder: 'e.g. Neat 2-Bedroom Self-Contained Apartment',
    descLabel: 'Property Features & Rent Terms',
    descPlaceholder:
      'Describe number of rooms, self-contained or shared compound, water & ECG status, and advance required (e.g. 1 or 2 years)...',
  },
};

const CONDITIONS = ['Brand New', 'Foreign Used (UK/US)', 'Ghana Used', 'Refurbished'];

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDim = 1200;
      let { width, height } = img;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const compressed = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, '') + '.jpg',
            { type: 'image/jpeg', lastModified: Date.now() }
          );
          resolve(compressed);
        },
        'image/jpeg',
        0.78
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

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
  const [pricePeriod, setPricePeriod] = useState(PRICING_OPTIONS.product[0].value);
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [region, setRegion] = useState(validRegion);
  const [city, setCity] = useState(validCity);

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerticalChange = (newVertical: 'product' | 'service' | 'property') => {
    setVertical(newVertical);
    setCategory(CATEGORIES[newVertical][0]);
    setPricePeriod(PRICING_OPTIONS[newVertical][0].value);
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
      let uploadedUrls: string[] = [];

      if (files.length > 0) {
        setStatusText('Optimizing media...');
        const preparedFiles = await Promise.all(files.map((f) => compressImage(f)));

        setStatusText(`Uploading ${preparedFiles.length} file(s)...`);
        uploadedUrls = await Promise.all(
          preparedFiles.map(async (file, idx) => {
            const ext = file.name.split('.').pop() || 'jpg';
            const filePath = `${userId}/${Date.now()}-${idx}-${Math.random().toString(36).slice(2)}.${ext}`;

            const { error: uploadError } = await supabase.storage
              .from('listing-media')
              .upload(filePath, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
              .from('listing-media')
              .getPublicUrl(filePath);

            return urlData.publicUrl;
          })
        );
      }

      setStatusText('Publishing ad...');
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
      setStatusText('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to post ad. Please try again.');
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  const activeCopy = VERTICAL_COPY[vertical];

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
              placeholder={activeCopy.titlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Tailored Price & Period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {vertical === 'service' ? 'Rate / Fee (₵ GHS)' : 'Price (₵ GHS)'}
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder={vertical === 'property' ? 'e.g. 1500' : 'e.g. 4500'}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {vertical === 'property'
                  ? 'Rent / Sale Basis'
                  : vertical === 'service'
                  ? 'Billing Basis'
                  : 'Pricing Type'}
              </label>
              <select
                value={pricePeriod}
                onChange={(e) => setPricePeriod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
              >
                {PRICING_OPTIONS[vertical].map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
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
            {vertical === 'property' ? 'Rent / Price is negotiable' : 'Price is negotiable'}
          </label>

          {/* Tailored Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {activeCopy.descLabel}
            </label>
            <textarea
              required
              rows={3}
              placeholder={activeCopy.descPlaceholder}
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
            {loading ? statusText || 'Publishing Ad...' : 'Publish Ad Now'}
          </button>
        </form>
      </div>
    </div>
  );
}