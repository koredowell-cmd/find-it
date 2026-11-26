'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { GHANA_REGIONS, REGION_NAMES } from '@/lib/ghanaLocations';
import AuthModal from '@/components/AuthModal';
import PostAdModal from '@/components/PostAdModal';
import EditAdModal from '@/components/EditAdModal';
import ListingDetailModal, { ListingWithSeller } from '@/components/ListingDetailModal';
import SellerStorefrontModal from '@/components/SellerStorefrontModal';
import MessagesInbox from '@/components/MessagesInbox';
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
  Phone,
  Edit3,
  Check,
  Store,
  RefreshCw,
  CheckCircle2,
  RotateCcw,
  Heart,
  SlidersHorizontal,
  Bell,
  Eye,
  Headphones,
  AlertTriangle,
  Lock,
} from 'lucide-react';

const SUPPORT_WHATSAPP_NUMBER = '233206583952';
const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
  'Hi Find It Support! I need help with my Find It account.'
)}`;

export default function FindItHome() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'explore' | 'requests' | 'account'>('explore');
  const [selectedRegion, setSelectedRegion] = useState('All Ghana');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedVertical, setSelectedVertical] = useState<'all' | 'product' | 'service' | 'property'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [showBudgetFilter, setShowBudgetFilter] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [listings, setListings] = useState<ListingWithSeller[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savedListings, setSavedListings] = useState<ListingWithSeller[]>([]);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [alertSavedToast, setAlertSavedToast] = useState(false);

  const [requests, setRequests] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingListing, setEditingListing] = useState<any | null>(null);
  const [selectedListing, setSelectedListing] = useState<ListingWithSeller | null>(null);
  const [storefrontSellerId, setStorefrontSellerId] = useState<string | null>(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRegion, setEditRegion] = useState('Greater Accra Region');
  const [editCity, setEditCity] = useState('Madina');
  const [savingProfile, setSavingProfile] = useState(false);

  // Account Deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [reqTitle, setReqTitle] = useState('');
  const [reqVertical, setReqVertical] = useState<'product' | 'service' | 'property'>('product');
  const [reqBudget, setReqBudget] = useState('');
  const [reqRegion, setReqRegion] = useState('Greater Accra Region');
  const [reqCity, setReqCity] = useState('Madina');
  const [postingReq, setPostingReq] = useState(false);

  const fetchUnreadCount = useCallback(async (uid: string) => {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', uid)
      .eq('is_read', false);

    setUnreadCount(count || 0);
  }, []);

  const fetchMyListings = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('listings')
      .select(`
        *,
        profiles (
          full_name,
          whatsapp_number,
          account_type,
          is_verified
        ),
        saved_listings ( id )
      `)
      .eq('seller_id', uid)
      .order('created_at', { ascending: false });

    setMyListings((data as any) || []);
  }, []);

  const fetchSavedListings = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('saved_listings')
      .select(`
        listing_id,
        listings (
          *,
          profiles (
            full_name,
            whatsapp_number,
            account_type,
            is_verified
          )
        )
      `)
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (data) {
      const ids = data.map((row: any) => row.listing_id);
      const items = data
        .map((row: any) => row.listings)
        .filter((item: any) => item && item.status === 'active');
      setSavedIds(ids);
      setSavedListings(items);
    }
  }, []);

  const fetchSavedSearches = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    setSavedSearches(data || []);
  }, []);

  const loadSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      const meta = currentUser.user_metadata || {};
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      const mergedProfile = {
        id: currentUser.id,
        full_name: prof?.full_name || meta.full_name || currentUser.email?.split('@')[0] || 'Find It User',
        whatsapp_number: prof?.whatsapp_number || meta.whatsapp_number || '',
        account_type: prof?.account_type || meta.account_type || 'individual',
        city: prof?.city || meta.city || 'Greater Accra Region',
        neighborhood: prof?.neighborhood || meta.neighborhood || 'Madina',
        is_verified: prof?.is_verified || false,
      };

      setProfile(mergedProfile);
      setEditName(mergedProfile.full_name);
      setEditPhone(mergedProfile.whatsapp_number);
      setEditRegion(GHANA_REGIONS[mergedProfile.city] ? mergedProfile.city : 'Greater Accra Region');
      setEditCity(mergedProfile.neighborhood || 'Madina');

      if (!prof || !prof.full_name) {
        await supabase.from('profiles').upsert({
          id: currentUser.id,
          full_name: mergedProfile.full_name,
          whatsapp_number: mergedProfile.whatsapp_number,
          account_type: mergedProfile.account_type,
          city: mergedProfile.city,
          neighborhood: mergedProfile.neighborhood,
        });
      }

      fetchMyListings(currentUser.id);
      fetchSavedListings(currentUser.id);
      fetchSavedSearches(currentUser.id);
      fetchUnreadCount(currentUser.id);
    } else {
      setProfile(null);
      setMyListings([]);
      setSavedIds([]);
      setSavedListings([]);
      setSavedSearches([]);
      setUnreadCount(0);
    }
  }, [fetchMyListings, fetchSavedListings, fetchSavedSearches, fetchUnreadCount]);

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
      .eq('status', 'active');

    if (selectedRegion !== 'All Ghana') {
      query = query.eq('city', selectedRegion);
      if (selectedCity !== 'All Cities') {
        query = query.eq('neighborhood', selectedCity);
      }
    }
    if (selectedVertical !== 'all') {
      query = query.eq('vertical', selectedVertical);
    }
    if (searchQuery.trim()) {
      query = query.ilike('title', `%${searchQuery.trim()}%`);
    }
    if (minPrice && !isNaN(Number(minPrice))) {
      query = query.gte('price', Number(minPrice));
    }
    if (maxPrice && !isNaN(Number(maxPrice))) {
      query = query.lte('price', Number(maxPrice));
    }

    if (sortBy === 'price_asc') {
      query = query.order('price', { ascending: true });
    } else if (sortBy === 'price_desc') {
      query = query.order('price', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data } = await query;
    setListings((data as any) || []);
    setLoadingFeed(false);
  }, [selectedRegion, selectedCity, selectedVertical, searchQuery, minPrice, maxPrice, sortBy]);

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

    if (selectedRegion !== 'All Ghana') {
      query = query.eq('city', selectedRegion);
    }

    const { data } = await query;
    setRequests(data || []);
  }, [selectedRegion]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedAdId = params.get('ad');
    if (sharedAdId) {
      supabase
        .from('listings')
        .select(`*, profiles ( full_name, whatsapp_number, account_type, is_verified )`)
        .eq('id', sharedAdId)
        .single()
        .then(({ data }) => {
          if (data) {
            setSelectedListing(data as any);
            window.history.replaceState({}, '', window.location.pathname);
          }
        });
    }
  }, []);

  useEffect(() => {
    loadSession();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadSession();
    });
    return () => authListener.subscription.unsubscribe();
  }, [loadSession]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`nav-unread-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = (payload.new || payload.old) as any;
          if (msg?.receiver_id === user.id || msg?.sender_id === user.id) {
            fetchUnreadCount(user.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchUnreadCount]);

  useEffect(() => {
    fetchListings();
    fetchRequests();
  }, [fetchListings, fetchRequests]);

  const handleSaveSearchAlert = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!searchQuery.trim()) return;

    await supabase.from('saved_searches').insert({
      user_id: user.id,
      keyword: searchQuery.trim(),
      region: selectedRegion,
      max_price: maxPrice ? Number(maxPrice) : null,
    });

    fetchSavedSearches(user.id);
    setAlertSavedToast(true);
    setTimeout(() => setAlertSavedToast(false), 2500);
  };

  const handleDeleteSavedSearch = async (id: string) => {
    await supabase.from('saved_searches').delete().eq('id', id);
    if (user?.id) fetchSavedSearches(user.id);
  };

  const handleApplySavedSearch = (alert: any) => {
    setSearchQuery(alert.keyword);
    setSelectedRegion(alert.region || 'All Ghana');
    setSelectedCity('All Cities');
    setMaxPrice(alert.max_price ? String(alert.max_price) : '');
    setActiveTab('explore');
  };

  const handleToggleSave = async (listingId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const alreadySaved = savedIds.includes(listingId);
    if (alreadySaved) {
      setSavedIds((prev) => prev.filter((id) => id !== listingId));
      setSavedListings((prev) => prev.filter((item) => item.id !== listingId));
      await supabase
        .from('saved_listings')
        .delete()
        .eq('user_id', user.id)
        .eq('listing_id', listingId);
    } else {
      setSavedIds((prev) => [...prev, listingId]);
      await supabase.from('saved_listings').insert({
        user_id: user.id,
        listing_id: listingId,
      });
      fetchSavedListings(user.id);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchListings(), fetchRequests(), loadSession()]);
    setTimeout(() => setRefreshing(false), 400);
  };

  const handleRegionFilterChange = (newRegion: string) => {
    setSelectedRegion(newRegion);
    setSelectedCity('All Cities');
  };

  const handleOpenPostAd = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setShowPostModal(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);

    let formattedPhone = editPhone.trim().replace(/\s+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+233' + formattedPhone.slice(1);
    }

    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: editName.trim(),
      whatsapp_number: formattedPhone,
      account_type: profile?.account_type || 'individual',
      city: editRegion,
      neighborhood: editCity,
    });

    await supabase.auth.updateUser({
      data: {
        full_name: editName.trim(),
        whatsapp_number: formattedPhone,
        city: editRegion,
        neighborhood: editCity,
      },
    });

    await loadSession();
    setSavingProfile(false);
    setEditingProfile(false);
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
      title: `${reqTitle.trim()} (${reqRegion} - ${reqCity})`,
      max_budget: reqBudget ? parseFloat(reqBudget) : null,
      currency: 'GHS',
      country_code: 'GH',
      city: reqRegion,
    });

    setReqTitle('');
    setReqBudget('');
    setPostingReq(false);
    fetchRequests();
  };

  const handleToggleListingStatus = async (ad: any) => {
    const nextStatus = ad.status === 'sold' ? 'active' : 'sold';
    await supabase.from('listings').update({ status: nextStatus }).eq('id', ad.id);
    fetchListings();
    if (user?.id) fetchMyListings(user.id);
  };

  const handleDeleteListing = async (id: string) => {
    await supabase.from('listings').delete().eq('id', id);
    fetchListings();
    if (user?.id) fetchMyListings(user.id);
  };

  const handleDeleteRequest = async (id: string) => {
    await supabase.from('buyer_requests').delete().eq('id', id);
    fetchRequests();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setActiveTab('explore');
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) {
      setDeleteError('Unable to verify account email. Contact support.');
      return;
    }
    if (!deletePassword.trim()) {
      setDeleteError('Please enter your password to confirm.');
      return;
    }

    setDeletingAccount(true);
    setDeleteError('');

    // 1. Verify the password used when signing up
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: deletePassword,
    });

    if (authError) {
      setDeletingAccount(false);
      setDeleteError('Incorrect password. Please try again.');
      return;
    }

    // 2. Permanently delete all user data and auth record via RPC
    const { error: rpcError } = await supabase.rpc('delete_own_account');

    if (rpcError) {
      setDeletingAccount(false);
      setDeleteError(rpcError.message || 'Could not delete account. Please try again.');
      return;
    }

    // 3. Clear local session and redirect to Explore
    await supabase.auth.signOut();
    setDeletingAccount(false);
    setShowDeleteModal(false);
    setDeletePassword('');
    setActiveTab('explore');
    fetchListings();
    fetchRequests();
  };

  const hasActiveBudget = Boolean(minPrice || maxPrice);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <img src="/icon.svg" alt="Find It" className="w-8 h-8 rounded-lg shadow-xs" />
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              Find <span className="text-emerald-600">It</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1.5 rounded-full">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <select
                value={selectedRegion}
                onChange={(e) => handleRegionFilterChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[135px] truncate"
              >
                <option value="All Ghana">All Ghana</option>
                {REGION_NAMES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {selectedRegion !== 'All Ghana' && (
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1.5 rounded-full text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="All Cities">All Cities</option>
                {(GHANA_REGIONS[selectedRegion] || []).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={refreshing}
              title="Refresh Feed"
              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        </div>

        {activeTab === 'explore' && (
          <div className="max-w-3xl mx-auto px-4 pb-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search phones, apartments, barbers, cars..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 border border-transparent focus:bg-white focus:border-emerald-500 text-sm focus:outline-none transition"
                />
              </div>

              {searchQuery.trim().length > 1 && (
                <button
                  type="button"
                  onClick={handleSaveSearchAlert}
                  className="px-2.5 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1 shrink-0 transition"
                  title="Save Search Alert"
                >
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">Alert</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowBudgetFilter(!showBudgetFilter)}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1 shrink-0 transition ${
                  showBudgetFilter || hasActiveBudget
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-slate-100 border-transparent text-slate-700 hover:bg-slate-200'
                }`}
                title="Sort & Price Filter"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>

            {alertSavedToast && (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-between">
                <span>Search alert saved! View matches in your Account tab.</span>
                <Check className="w-3.5 h-3.5" />
              </div>
            )}

            {showBudgetFilter && (
              <div className="p-3 rounded-2xl bg-slate-100/90 border border-slate-200/80 grid grid-cols-3 gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                </select>
                <input
                  type="number"
                  placeholder="Min ₵"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                />
                <input
                  type="number"
                  placeholder="Max ₵"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                />
              </div>
            )}

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
                    type="button"
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

      <main className="max-w-3xl mx-auto px-4 pt-4">
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
                  Try clearing your price filter or tap the Bell icon above to save a search alert!
                </p>
                <button
                  type="button"
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
                  const locationLabel = item.neighborhood
                    ? `${item.city.replace(' Region', '')} - ${item.neighborhood}`
                    : item.city;
                  const isSaved = savedIds.includes(item.id);

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

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSave(item.id);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-xs text-slate-700 hover:scale-105 transition shadow-xs"
                          title={isSaved ? 'Saved' : 'Save Ad'}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              isSaved ? 'fill-rose-600 text-rose-600' : 'text-slate-600'
                            }`}
                          />
                        </button>
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

                        <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-2">
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <MapPin className="w-3 h-3 shrink-0 text-emerald-600" />
                            <span className="truncate">{locationLabel}</span>
                          </div>

                          {item.seller_id !== user?.id && (
                            <div className="w-full py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px] flex items-center justify-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              Chat & Negotiate
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

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
                  placeholder="e.g. Looking for clean UK-used iPhone 13..."
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={reqVertical}
                    onChange={(e) => setReqVertical(e.target.value as any)}
                    className="px-2.5 py-2 rounded-xl bg-white text-slate-900 text-xs font-semibold"
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
                    className="px-3 py-2 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={reqRegion}
                    onChange={(e) => {
                      setReqRegion(e.target.value);
                      setReqCity(GHANA_REGIONS[e.target.value]?.[0] || '');
                    }}
                    className="px-2.5 py-2 rounded-xl bg-white text-slate-900 text-xs font-semibold"
                  >
                    {REGION_NAMES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <select
                    value={reqCity}
                    onChange={(e) => setReqCity(e.target.value)}
                    className="px-2.5 py-2 rounded-xl bg-white text-slate-900 text-xs font-semibold"
                  >
                    {(GHANA_REGIONS[reqRegion] || []).map((c) => (
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
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            {req.city}
                          </span>
                          {user?.id === req.buyer_id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteRequest(req.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Delete Request"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900">{req.title}</h4>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="text-xs text-slate-500">
                          Budget:{' '}
                          <span className="font-bold text-emerald-700">
                            {req.max_budget ? `₵${Number(req.max_budget).toLocaleString()}` : 'Open'}
                          </span>
                        </div>

                        {waDigits && user?.id !== req.buyer_id && (
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

        {activeTab === 'account' && (
          <div className="space-y-5">
            {!user ? (
              <div className="text-center py-14 px-6 bg-white rounded-3xl border border-slate-200/80">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                  <UserIcon className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Sign in to Find It</h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Create a free individual or business account to post ads, save favorites, negotiate with buyers, and manage your listings.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="mt-5 px-6 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md"
                >
                  Sign In / Create Account
                </button>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-2xs">
                  <div className="h-16 bg-gradient-to-r from-emerald-600 to-emerald-800" />
                  <div className="px-5 pb-5">
                    <div className="flex items-end justify-between -mt-8 mb-3">
                      <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white border-4 border-white shadow-md flex items-center justify-center text-xl font-extrabold">
                        {(profile?.full_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setStorefrontSellerId(user.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Store className="w-3.5 h-3.5" />
                          My Shop
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingProfile(!editingProfile)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          {editingProfile ? 'Cancel' : 'Edit'}
                        </button>
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
                          title="Sign Out"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {!editingProfile ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-extrabold text-lg text-slate-900">
                            {profile?.full_name}
                          </h2>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            {profile?.account_type === 'business' ? 'Business' : 'Member'}
                          </span>
                        </div>

                        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
                          {profile?.whatsapp_number && (
                            <span className="flex items-center gap-1.5 font-medium">
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              {profile.whatsapp_number}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            {profile?.city}
                            {profile?.neighborhood ? ` - ${profile.neighborhood}` : ''}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveProfile} className="space-y-3 pt-2 border-t border-slate-100">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Display Name
                          </label>
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            WhatsApp / Phone Number
                          </label>
                          <input
                            type="tel"
                            required
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Region
                            </label>
                            <select
                              value={editRegion}
                              onChange={(e) => {
                                setEditRegion(e.target.value);
                                setEditCity(GHANA_REGIONS[e.target.value]?.[0] || '');
                              }}
                              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                            >
                              {REGION_NAMES.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              City / Town
                            </label>
                            <select
                              value={editCity}
                              onChange={(e) => setEditCity(e.target.value)}
                              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                            >
                              {(GHANA_REGIONS[editRegion] || []).map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={savingProfile}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                <MessagesInbox
                  currentUserId={user.id}
                  onUnreadChange={(count) => setUnreadCount(count)}
                />

                {/* Saved Search Alerts */}
                {savedSearches.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-amber-500" />
                      Saved Search Alerts ({savedSearches.length})
                    </h3>
                    <div className="space-y-2">
                      {savedSearches.map((alert) => {
                        const matchCount = listings.filter((item) => {
                          const matchesWord = item.title
                            .toLowerCase()
                            .includes(alert.keyword.toLowerCase());
                          const matchesRegion =
                            !alert.region ||
                            alert.region === 'All Ghana' ||
                            item.city === alert.region;
                          const matchesPrice =
                            !alert.max_price || Number(item.price) <= Number(alert.max_price);
                          return matchesWord && matchesRegion && matchesPrice;
                        }).length;

                        return (
                          <div
                            key={alert.id}
                            className="p-3 bg-white rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3"
                          >
                            <button
                              type="button"
                              onClick={() => handleApplySavedSearch(alert)}
                              className="text-left flex-1 min-w-0"
                            >
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-xs text-slate-900 truncate">
                                  &ldquo;{alert.keyword}&rdquo;
                                </p>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 shrink-0">
                                  {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {alert.region || 'All Ghana'}
                                {alert.max_price
                                  ? ` • Under ₵${Number(alert.max_price).toLocaleString()}`
                                  : ''}
                              </p>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSavedSearch(alert.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Remove Alert"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {savedListings.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                      Saved Ads ({savedListings.length})
                    </h3>
                    <div className="space-y-2">
                      {savedListings.map((savedAd) => {
                        const thumb = savedAd.media_urls?.[0];
                        return (
                          <div
                            key={savedAd.id}
                            className="p-3 bg-white rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3"
                          >
                            <div
                              onClick={() => setSelectedListing(savedAd)}
                              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                            >
                              <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                                {thumb ? (
                                  <img src={thumb} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-xs text-slate-900 truncate">
                                  {savedAd.title}
                                </p>
                                <p className="text-xs font-extrabold text-emerald-700">
                                  ₵{Number(savedAd.price).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleSave(savedAd.id)}
                              className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                              title="Remove from Saved"
                            >
                              <Heart className="w-4 h-4 fill-rose-600" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      My Listings & Performance ({myListings.length})
                    </h3>
                    <button
                      type="button"
                      onClick={handleOpenPostAd}
                      className="text-xs font-bold text-emerald-700 hover:underline"
                    >
                      + Post New Ad
                    </button>
                  </div>

                  {myListings.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-2xl border border-slate-200/80">
                      <p className="text-xs text-slate-500">You haven&apos;t posted any ads yet.</p>
                      <button
                        type="button"
                        onClick={handleOpenPostAd}
                        className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                      >
                        + Post Your First Ad
                      </button>
                    </div>
                  ) : (
                    myListings.map((ad: any) => {
                      const isSold = ad.status === 'sold';
                      const thumb = ad.media_urls?.[0];
                      const viewsCount = Number(ad.views_count || 0);
                      const savesCount = Array.isArray(ad.saved_listings)
                        ? ad.saved_listings.length
                        : 0;
                      const leadsCount = Number(ad.leads_count || 0);

                      return (
                        <div
                          key={ad.id}
                          className={`p-3.5 bg-white rounded-2xl border space-y-3 ${
                            isSold ? 'border-slate-200 opacity-80' : 'border-slate-200/80'
                          }`}
                        >
                          <div
                            onClick={() => setSelectedListing(ad)}
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                              {thumb ? (
                                <img src={thumb} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5 text-slate-400" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-slate-900 truncate">
                                  {ad.title}
                                </p>
                                {isSold && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 shrink-0">
                                    Sold
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-emerald-700">
                                ₵{Number(ad.price).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* Ad Performance Stats Bar */}
                          <div className="grid grid-cols-3 gap-2 py-2 px-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                            <div>
                              <p className="text-xs font-extrabold text-slate-900 flex items-center justify-center gap-1">
                                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                {viewsCount}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">Views</p>
                            </div>
                            <div className="border-x border-slate-200/80">
                              <p className="text-xs font-extrabold text-slate-900 flex items-center justify-center gap-1">
                                <Heart className="w-3.5 h-3.5 text-rose-500" />
                                {savesCount}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">Saves</p>
                            </div>
                            <div>
                              <p className="text-xs font-extrabold text-slate-900 flex items-center justify-center gap-1">
                                <MessageCircle className="w-3.5 h-3.5 text-amber-600" />
                                {leadsCount}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">Inquiries</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingListing(ad)}
                              className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleListingStatus(ad)}
                              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                                isSold
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isSold ? (
                                <>
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  Relist
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Mark Sold
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteListing(ad.id)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Delete Ad"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {/* WhatsApp Support Card (Available for everyone) */}
            <div className="p-4 bg-white rounded-3xl border border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Need Help or Have Feedback?</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Chat directly with Find It Support on WhatsApp.
                  </p>
                </div>
              </div>
              <a
                href={SUPPORT_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Support
              </a>
            </div>

            {/* Danger Zone: Account Deletion */}
            {user && (
              <div className="p-4 bg-white rounded-3xl border border-red-200/80 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs text-red-700">Delete Account</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Permanently remove your account, ads, and messages.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDeletePassword('');
                    setDeleteError('');
                    setShowDeleteModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold shrink-0 transition"
                >
                  Delete Account
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Password-Confirmed Account Deletion Modal */}
      {showDeleteModal && user && (
        <div
          onClick={() => !deletingAccount && setShowDeleteModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2.5 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Delete Your Account?</h3>
                <p className="text-[11px] text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              All your active listings, saved ads, requests, and messages will be permanently deleted. Enter the password you used to sign up to confirm.
            </p>

            <form onSubmit={handleDeleteAccount} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Account Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Enter your password..."
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {deleteError && (
                <p className="text-[11px] font-semibold text-red-600 bg-red-50 px-3 py-2 rounded-xl">
                  {deleteError}
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={deletingAccount}
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deletingAccount || !deletePassword.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50 transition"
                >
                  {deletingAccount ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
              activeTab === 'account' ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <div className="relative">
              <UserIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[9px] font-extrabold flex items-center justify-center shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            Account
          </button>
        </div>
      </nav>

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
          defaultRegion={profile?.city || 'Greater Accra Region'}
          defaultCity={profile?.neighborhood || 'Madina'}
          onSuccess={() => {
            fetchListings();
            fetchMyListings(user.id);
          }}
        />
      )}

      <EditAdModal
        listing={editingListing}
        onClose={() => setEditingListing(null)}
        onSuccess={() => {
          fetchListings();
          if (user?.id) fetchMyListings(user.id);
        }}
      />

      <ListingDetailModal
        listing={selectedListing}
        currentUserId={user?.id || null}
        isSaved={selectedListing ? savedIds.includes(selectedListing.id) : false}
        onToggleSave={handleToggleSave}
        onOpenStorefront={(sellerId) => {
          setSelectedListing(null);
          setStorefrontSellerId(sellerId);
        }}
        onClose={() => setSelectedListing(null)}
        onRequireAuth={() => {
          setSelectedListing(null);
          setShowAuthModal(true);
        }}
      />

      <SellerStorefrontModal
        sellerId={storefrontSellerId}
        currentUserId={user?.id || null}
        onClose={() => setStorefrontSellerId(null)}
        onSelectListing={(item) => setSelectedListing(item)}
        onRequireAuth={() => {
          setStorefrontSellerId(null);
          setShowAuthModal(true);
        }}
      />
    </div>
  );
}