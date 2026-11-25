'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { GHANA_REGIONS, REGION_NAMES } from '@/lib/ghanaLocations';
import { X, Loader2, Check } from 'lucide-react';

interface EditAdModalProps {
  listing: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PRICING_OPTIONS: Record<string, { value: string; label: string }[]> = {
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

export default function EditAdModal({ listing, onClose, onSuccess }: EditAdModalProps) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [pricePeriod, setPricePeriod] = useState('one-time');
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [description, setDescription] = useState('');
  const [region, setRegion] = useState('Greater Accra Region');
  const [city, setCity] = useState('Madina');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (listing) {
      setTitle(listing.title || '');
      setPrice(String(listing.price ?? ''));
      setPricePeriod(listing.price_period || 'one-time');
      setIsNegotiable(listing.is_negotiable ?? true);
      setDescription(listing.description || '');
      const validReg = GHANA_REGIONS[listing.city] ? listing.city : 'Greater Accra Region';
      setRegion(validReg);
      setCity(listing.neighborhood || GHANA_REGIONS[validReg][0]);
      setError(null);
    }
  }, [listing]);

  if (!listing) return null;

  const vertical = listing.vertical || 'product';
  const pricingChoices = PRICING_OPTIONS[vertical] || PRICING_OPTIONS.product;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          title: title.trim(),
          price: parseFloat(price),
          price_period: pricePeriod,
          is_negotiable: isNegotiable,
          description: description.trim(),
          city: region,
          neighborhood: city,
        })
        .eq('id', listing.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update ad.');
    } finally {
      setSaving(false);
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
            <h2 className="text-lg font-bold text-slate-900">Edit Listing</h2>
            <p className="text-xs text-slate-500">Update price, details, or location</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ad Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₵ GHS)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
              >
                {pricingChoices.map((opt) => (
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
            Price is negotiable
          </label>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Region</label>
              <select
                value={region}
                onChange={(e) => {
                  setRegion(e.target.value);
                  setCity(GHANA_REGIONS[e.target.value]?.[0] || '');
                }}
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
            disabled={saving}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md flex items-center justify-center gap-2 transition disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}