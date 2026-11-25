'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import AuthModal from '@/components/AuthModal';
import PostAdModal from '@/components/PostAdModal';
import ListingDetailModal, { ListingWithSeller } from '@/components/ListingDetailModal';
import {
  Search,
  MapPin,
  Plus,
  Compass,
  Sparkles,
  User as UserIcon,
  Package,
  Wrench,
  Home,
  LogOut,
  MessageCircle,
  Send,
  Loader2,
  Trash2,
} from 'lucide-react';

const CITIES = ['All Ghana', 'Accra', 'Kumasi', 'Takoradi', 'Tamale', 'Tema', 'Cape Coast'];

export default function FindItHome() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'explore' | 'requests' | 'account'>('explore');
  const [selectedCity, setSelectedCity] = useState('All Ghana');
  const [selectedVertical, setSelectedVertical] = useState<'all' | 'product' | 'service' | 'property'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [listings, setListings] = useState<ListingWithSeller[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ListingWithSeller | null>(null);

  const [reqTitle, setReqTitle] = useState('');
  const [reqVertical, setReqVertical] = useState<'product' | 'service' | 'property'>('product');
  const [reqBudget, setReqBudget] = useState('');
  const [reqCity, setReqCity] = useState('Accra');
  const [postingReq, setPostingReq] = useState(false);

  const loadSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      setProfile(prof);
    } else {
      setProfile(null);
    }
  }, []);

  const fetchListings = useCallback(async () => {
    setLoadingFeed(true);
    let query = supabase
      .from('listings')
      .select(`
        *,
        profiles (
          full_name,
          whatsapp_number,
          account_type,
          is_verified
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (selectedCity !== 'All Ghana') {
      query = query.eq('city', selectedCity);
    }
    if (selectedVertical !== 'all') {
      query = query.eq('vertical', selectedVertical);
    }
    if (searchQuery.trim()) {
      query = query.ilike('title', `%${searchQuery.trim()}%`);
    }

    const { data } = await query;
    setListings((data as any) || []);
    setLoadingFeed(false);
  }, [selectedCity, selectedVertical, searchQuery]);

  const fetchRequests = useCallback(async () => {
    let query = supabase
      .from('buyer_requests')
      .select(`
        *,
        profiles (
          full_name,
          whatsapp_number
        )
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (selectedCity !== 'All Ghana') {
      query = query.eq('city', selectedCity);
    }

    const { data } = await query;
    setRequests(data || []);
  }, [selectedCity]);

  useEffect(() => {
    loadSession();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadSession();
    });
    return () => authListener.subscription.unsubscribe();
  }, [loadSession]);

  useEffect(() => {
    fetchListings();
    fetchRequests();
  }, [fetchListings, fetchRequests]);

  const handleOpenPostAd = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setShowPostModal(true);
    }
  };

  const handlePostRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!reqTitle.trim()) return;

    setPostingReq(true);
    await supabase.from('buyer_requests').insert({
      buyer_id: user.id,
      vertical: reqVertical,
      title: reqTitle.trim(),
      max_budget: reqBudget ? parseFloat(reqBudget) : null,
      currency: 'GHS',
      country_code: 'GH',
      city: reqCity,
    });

    setReqTitle('');
    setReqBudget('');
    setPostingReq(false);
    fetchRequests();
  };

  const handleDeleteListing = async (id: string) => {
    await supabase.from('listings').delete().eq('id', id);
    fetchListings();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setActiveTab('explore');
  };

  const myListings = listings.filter((item) => item.seller_id === user?.id);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Top App Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="Find It" className="w-8 h-8 rounded-lg shadow-xs" />
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              Find <span className="text-emerald-600">It</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search & Vertical Filter Bar */}
        {activeTab === 'explore' && (
          <div className="max-w-3xl mx-auto px-4 pb-3 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search phones, apartments, barbers, cars..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 border border-transparent focus:bg-white focus:border-emerald-500 text-sm focus:outline-none transition"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'All Ads', icon: Compass },
                { id: 'product', label: 'Products', icon: Package },
                { id: 'service', label: 'Services', icon: Wrench },
                { id: 'property', label: 'Properties', icon: Home },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = selectedVertical === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedVertical(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition ${
                      active
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="max-w-3xl mx-auto px-4 pt-4">
        {/* TAB 1: EXPLORE MARKETPLACE */}
        {activeTab === 'explore' && (
          <>
            {loadingFeed ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mb-2" />
                <p className="text-xs font-medium">Loading fresh deals...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-16 px-6 bg-white rounded-3xl border border-slate-200/80">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900">No ads found here yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Be the first to post a product, service, or property in {selectedCity}!
                </p>
                <button
                  onClick={handleOpenPostAd}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm"
                >
                  + Post First Ad
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {listings.map((item) => {
                  const thumb = item.media_urls?.[0];
                  const isVid = thumb?.match(/\.(mp4|webm|mov|ogg)(\?|$)/i);

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedListing(item)}
                      className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col"
                    >
                      <div className="aspect-square bg-slate-100 relative overflow-hidden">
                        {thumb ? (
                          isVid ? (
                            <video src={thumb} className="w-full h-full object-cover" />
                          ) : (
                            <img
                              src={thumb}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Package className="w-8 h-8" />
                          </div>
                        )}

                        {item.condition && (
                          <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/75 text-white backdrop-blur-xs">
                            {item.condition}
                          </span>
                        )}
                      </div>

                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="font-extrabold text-sm text-emerald-700">
                            ₵{Number(item.price).toLocaleString()}
                            {item.price_period !== 'one-time' && (
                              <span className="text-[10px] font-normal text-slate-500">
                                {' '}
                                / {item.price_period}
                              </span>
                            )}
                          </p>
                          <h3 className="text-xs font-semibold text-slate-900 line-clamp-2 mt-0.5">
                            {item.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                          <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                          <span className="truncate">{item.neighborhood || item.city}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* TAB 2: "FIND IT" BUYER REQUEST BOARD */}
        {activeTab === 'requests' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-3xl p-5 text-white shadow-lg">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                Reverse Marketplace
              </div>
              <h2 className="text-lg font-bold">Can’t find what you need?</h2>
              <p className="text-xs text-emerald-100 mt-0.5 mb-4">
                Post your request below and let sellers or service providers contact you directly.
              </p>

              <form onSubmit={handlePostRequest} className="space-y-2.5">
                <input
                  type="text"
                  required
                  placeholder="e.g. Looking for clean UK-used iPhone 13 in Accra..."
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/95 text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:outline-none"
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={reqVertical}
                    onChange={(e) => setReqVertical(e.target.value as any)}
                    className="px-2.5 py-2 rounded-xl bg-white/95 text-slate-900 text-xs font-semibold"
                  >
                    <option value="product">Product</option>
                    <option value="service">Service</option>
                    <option value="property">Property</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Budget (₵)"
                    value={reqBudget}
                    onChange={(e) => setReqBudget(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white/95 text-slate-900 placeholder:text-slate-400 text-xs"
                  />
                  <select
                    value={reqCity}
                    onChange={(e) => setReqCity(e.target.value)}
                    className="px-2.5 py-2 rounded-xl bg-white/95 text-slate-900 text-xs font-semibold"
                  >
                    {CITIES.filter((c) => c !== 'All Ghana').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={postingReq}
                  className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  {postingReq ? 'Posting Request...' : 'Post "Find It" Request'}
                </button>
              </form>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
                Active Buyer Requests ({requests.length})
              </h3>

              {requests.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8 bg-white rounded-2xl border border-slate-200/80">
                  No open requests right now. Post one above!
                </p>
              ) : (
                requests.map((req) => {
                  const waDigits = (req.profiles?.whatsapp_number || '').replace(/[^0-9]/g, '');
                  const pitchText = encodeURIComponent(
                    `Hi ${req.profiles?.full_name || 'there'}, I saw your request "${req.title}" on Find It and I can help!`
                  );

                  return (
                    <div
                      key={req.id}
                      className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">
                          {req.vertical}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          {req.city}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900">{req.title}</h4>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="text-xs text-slate-500">
                          Budget:{' '}
                          <span className="font-bold text-emerald-700">
                            {req.max_budget ? `₵${Number(req.max_budget).toLocaleString()}` : 'Open'}
                          </span>
                        </div>

                        {waDigits && (
                          <a
                            href={`https://wa.me/${waDigits}?text=${pitchText}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-700 transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Pitch via WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ACCOUNT & MY ADS */}
        {activeTab === 'account' && (
          <div className="space-y-5">
            {!user ? (
              <div className="text-center py-14 px-6 bg-white rounded-3xl border border-slate-200/80">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                  <UserIcon className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Sign in to Find It</h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Create a free individual or business account to post ads, negotiate with buyers, and manage your listings.
                </p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="mt-5 px-6 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md"
                >
                  Sign In / Create Account
                </button>
              </div>
            ) : (
              <>
                <div className="p-5 bg-white rounded-3xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-base text-slate-900">
                      {profile?.full_name || user.email}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {profile?.whatsapp_number} • {profile?.city}
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
                    My Active Ads ({myListings.length})
                  </h3>

                  {myListings.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-2xl border border-slate-200/80">
                      <p className="text-xs text-slate-500">You haven&apos;t posted any ads yet.</p>
                      <button
                        onClick={handleOpenPostAd}
                        className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                      >
                        + Post Your First Ad
                      </button>
                    </div>
                  ) : (
                    myListings.map((ad) => (
                      <div
                        key={ad.id}
                        className="p-3.5 bg-white rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3"
                      >
                        <div
                          onClick={() => setSelectedListing(ad)}
                          className="cursor-pointer flex-1 min-w-0"
                        >
                          <p className="font-bold text-sm text-slate-900 truncate">{ad.title}</p>
                          <p className="text-xs font-semibold text-emerald-700">
                            ₵{Number(ad.price).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteListing(ad.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete Ad"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </main>

{/* Bottom Mobile Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-3xl mx-auto px-3 h-16 grid grid-cols-4 items-center">
          <button
            type="button"
            onClick={() => setActiveTab('explore')}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
              activeTab === 'explore' ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <Compass className="w-5 h-5" />
            Explore
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
              activeTab === 'requests' ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            Find It
          </button>

          <button
            type="button"
            onClick={handleOpenPostAd}
            className="flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-emerald-700 transition"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-sm">
              <Plus className="w-4 h-4" />
            </div>
            Post Ad
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
              activeTab === 'account' ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            Account
          </button>
        </div>
      </nav>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={loadSession}
      />

      {user && (
        <PostAdModal
          isOpen={showPostModal}
          onClose={() => setShowPostModal(false)}
          userId={user.id}
          defaultCity={profile?.city || 'Accra'}
          defaultNeighborhood={profile?.neighborhood || ''}
          onSuccess={fetchListings}
        />
      )}

      <ListingDetailModal
        listing={selectedListing}
        currentUserId={user?.id || null}
        onClose={() => setSelectedListing(null)}
        onRequireAuth={() => {
          setSelectedListing(null);
          setShowAuthModal(true);
        }}
      />
    </div>
  );
}