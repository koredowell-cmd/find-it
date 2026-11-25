'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { GHANA_REGIONS, REGION_NAMES } from '@/lib/ghanaLocations';
import { X, Store, User, Phone, Mail, Lock, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [accountType, setAccountType] = useState<'individual' | 'business'>('individual');
  const [region, setRegion] = useState('Greater Accra Region');
  const [city, setCity] = useState('Madina');

  // Reset form fields cleanly every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setFullName('');
      setWhatsappNumber('');
      setAccountType('individual');
      setRegion('Greater Accra Region');
      setCity('Madina');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    const cities = GHANA_REGIONS[newRegion] || [];
    setCity(cities[0] || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        let formattedPhone = whatsappNumber.trim().replace(/\s+/g, '');
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '+233' + formattedPhone.slice(1);
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              whatsapp_number: formattedPhone,
              account_type: accountType,
              city: region,
              neighborhood: city,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            whatsapp_number: formattedPhone,
            account_type: accountType,
            city: region,
            neighborhood: city,
          });
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) throw signInError;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      if (err?.message === 'Load failed' || err?.message === 'Failed to fetch') {
        setError('Network connection failed. Please check your internet and try again.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
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
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isSignUp ? 'Create Find It Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isSignUp
                ? 'Buy, sell, advertise services & connect directly'
                : 'Sign in to manage your ads and messages'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {isSignUp && (
            <>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAccountType('individual')}
                  className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition ${
                    accountType === 'individual'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Individual
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('business')}
                  className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition ${
                    accountType === 'business'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  Business / Shop
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {accountType === 'business' ? 'Business / Shop Name' : 'Full Name'}
                </label>
                <input
                  type="text"
                  name="findit_display_name"
                  autoComplete="off"
                  required
                  placeholder={accountType === 'business' ? 'Enter business or shop name' : 'Enter full name'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp / Call Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    name="findit_whatsapp_contact"
                    autoComplete="off"
                    required
                    placeholder="Enter WhatsApp or phone number"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Region</label>
                  <select
                    value={region}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {REGION_NAMES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City / Town
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {(GHANA_REGIONS[region] || []).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                name="findit_account_email"
                autoComplete="off"
                required
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                name="findit_account_pass"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md flex items-center justify-center gap-2 transition disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSignUp ? 'Create Account & Continue' : 'Sign In'}
          </button>

          <p className="text-center text-xs text-slate-600 pt-1">
            {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="font-bold text-emerald-600 hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Create Account'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}