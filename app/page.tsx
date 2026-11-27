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
import UserGuideModal from '@/components/UserGuideModal';
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
  Sun,
  Moon,
  BookOpen,
  Share2,
  Users,
  KeyRound,
  Download,
  X,
} from 'lucide-react';

const SUPPORT_WHATSAPP_NUMBER = '233206583952';
const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
  'Hi Find It Support! I need help with my Find It account.'
)}`;

interface SavedDeviceAccount {
  id: string;
  email: string;
  full_name: string;
  account_type: string;
  access_token: string;
  refresh_token: string;
}

const SAVED_ACCOUNTS_KEY = 'findit_saved_accounts_v1';

export default function FindItHome() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Theme & PWA Install state
  const [isDark, setIsDark] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [installFading, setInstallFading] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [showIosInstallTip, setShowIosInstallTip] = useState(false);

  // Saved Device Accounts (Switch Account without logging out)
  const [savedAccounts, setSavedAccounts] = useState<SavedDeviceAccount[]>([]);
  const [switchingAccountId, setSwitchingAccountId] = useState<string | null>(null);

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
  const [copiedAccountLink, setCopiedAccountLink] = useState(false);

  const [requests, setRequests] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'signup' | 'signin'>('signup');
  const [showGuideModal, setShowGuideModal] = useState(false);
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

  // Change Password Modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

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

  // Initialize Dark Mode & PWA Add-to-Home-Screen detection
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));

    try {
      const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
      if (raw) setSavedAccounts(JSON.parse(raw));
    } catch {}

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    const alreadyAddedOrDismissed = localStorage.getItem('findit_a2hs_done') === '1';

    if (isStandalone || alreadyAddedOrDismissed) {
      setShowInstallBanner(false);
      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    setIsIosDevice(ios);
    setShowInstallBanner(true);

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    const handleAppInstalled = () => {
      localStorage.setItem('findit_a2hs_done', '1');
      setInstallFading(true);
      setTimeout(() => setShowInstallBanner(false), 500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('findit_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('findit_theme', 'light');
    }
  };

  const dismissInstallBanner = () => {
    localStorage.setItem('findit_a2hs_done', '1');
    setInstallFading(true);
    setTimeout(() => setShowInstallBanner(false), 500);
  };

  const handleInstallAppClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === 'accepted') {
        dismissInstallBanner();
      }
    } else if (isIosDevice) {
      setShowIosInstallTip(true);
    } else {
      setShowIosInstallTip(true);
    }
  };

  const syncAccountToDeviceStorage = useCallback(
    (session: any, profData: { full_name: string; account_type: string }) => {
      if (!session?.user?.id || !session?.access_token || !session?.refresh_token) return;
      try {
        const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
        const existing: SavedDeviceAccount[] = raw ? JSON.parse(raw) : [];
        const updatedEntry: SavedDeviceAccount = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: profData.full_name,
          account_type: profData.account_type,
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        };
        const merged = [
          updatedEntry,
          ...existing.filter((acc) => acc.id !== session.user.id),
        ];
        localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(merged));
        setSavedAccounts(merged);
      } catch {}
    },
    []
  );

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

    if (currentUser && session) {
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

      syncAccountToDeviceStorage(session, {
        full_name: mergedProfile.full_name,
        account_type: mergedProfile.account_type,
      });

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
  }, [
    fetchMyListings,
    fetchSavedListings,
    fetchSavedSearches,
    fetchUnreadCount,
    syncAccountToDeviceStorage,
  ]);

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

  // Handle ?ad= and ?shop= shared deep links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedAdId = params.get('ad');
    const sharedShopId = params.get('shop');

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
    } else if (sharedShopId) {
      setStorefrontSellerId(sharedShopId);
      window.history.replaceState({}, '', window.location.pathname);
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

  const handleSwitchAccount = async (target: SavedDeviceAccount) => {
    if (target.id === user?.id || switchingAccountId) return;
    setSwitchingAccountId(target.id);

    const { data, error } = await supabase.auth.setSession({
      access_token: target.access_token,
      refresh_token: target.refresh_token,
    });

    if (error || !data.session) {
      // Token expired — remove stale entry and open sign-in modal
      const filtered = savedAccounts.filter((a) => a.id !== target.id);
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(filtered));
      setSavedAccounts(filtered);
      setSwitchingAccountId(null);
      setAuthInitialMode('signin');
      setShowAuthModal(true);
      return;
    }

    await loadSession();
    setSwitchingAccountId(null);
  };

  const handleRemoveSavedDeviceAccount = (idToRemove: string) => {
    const filtered = savedAccounts.filter((a) => a.id !== idToRemove);
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(filtered));
    setSavedAccounts(filtered);
  };

  const handleShareAccount = async () => {
    if (!user) return;
    const shopUrl = `${window.location.origin}/?shop=${user.id}`;
    const shareTitle = `${profile?.full_name || 'Find It'} on Find It Gh`;
    const shareText = `Check out ${profile?.full_name || 'my shop'} on Find It Gh — browse my listings and chat directly:`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shopUrl,
        });
        return;
      } catch {}
    }

    await navigator.clipboard.writeText(`${shareText}\n${shopUrl}`);
    setCopiedAccountLink(true);
    setTimeout(() => setCopiedAccountLink(false), 2500);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (!user?.email) {
      setPasswordError('Unable to verify account email.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setChangingPassword(true);

    // 1. Verify old password
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    });

    if (verifyErr) {
      setChangingPassword(false);
      setPasswordError('Current password is incorrect.');
      return;
    }

    // 2. Set new password
    const { error: updateErr } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setChangingPassword(false);

    if (updateErr) {
      setPasswordError(updateErr.message || 'Could not update password.');
      return;
    }

    setPasswordSuccess(true);
    setOldPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordSuccess(false);
    }, 1500);
  };

  const handleSaveSearchAlert = async () => {
    if (!user) {
      setAuthInitialMode('signup');
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
      setAuthInitialMode('signup');
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
      setAuthInitialMode('signup');
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
      setAuthInitialMode('signup');
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
    if (user?.id) {
      handleRemoveSavedDeviceAccount(user.id);
    }
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

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: deletePassword,
    });

    if (authError) {
      setDeletingAccount(false);
      setDeleteError('Incorrect password. Please try again.');
      return;
    }

    const deletedId = user.id;
    const { error: rpcError } = await supabase.rpc('delete_own_account');

    if (rpcError) {
      setDeletingAccount(false);
      setDeleteError(rpcError.message || 'Could not delete account. Please try again.');
      return;
    }

    handleRemoveSavedDeviceAccount(deletedId);
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
    <div className="min-h-screen pb-28">
      {/* Add to Home Screen Top Banner (Fades away once added/dismissed) */}
      {showInstallBanner && (
        <div
          className={`bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white transition-all duration-500 overflow-hidden ${
            installFading ? 'opacity-0 max-h-0 py-0' : 'opacity-100 max-h-24 py-2'
          }`}
        >
          <div className="max-w-3xl mx-auto px-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Download className="w-4 h-4 shrink-0 text-amber-300" />
              <p className="text-[11px] font-semibold truncate">
                Install <span className="font-extrabold">Find It Gh</span> on your Home Screen for 1-tap access
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleInstallAppClick}
                className="px-2.5 py-1 rounded-full bg-white text-emerald-800 text-[11px] font-extrabold shadow-xs hover:bg-emerald-50 transition"
              >
                Add to Home Screen
              </button>
              <button
                type="button"
                onClick={dismissInstallBanner}
                className="p-1 rounded-full hover:bg-white/15 text-white/80"
                aria-label="Dismiss install banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <img src="/icon.svg" alt="Find It" className="w-8 h-8 rounded-lg shadow-xs" />
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
              Find <span className="text-emerald-600 dark:text-emerald-400">It</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 px-2.5 py-1.5 rounded-full border border-transparent dark:border-slate-800">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <select
                value={selectedRegion}
                onChange={(e) => handleRegionFilterChange(e.target.value)}
                className="!bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer max-w-[120px] truncate"
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
                className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-2.5 py-1.5 rounded-full text-xs font-bold focus:outline-none cursor-pointer"
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
              onClick={() => setShowGuideModal(true)}
              title="How to Use Find It"
              className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-amber-400 transition shrink-0"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={refreshing}
              title="Refresh Feed"
              className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition shrink-0"
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 text-sm focus:outline-none transition"
                />
              </div>

              {searchQuery.trim().length > 1 && (
                <button
                  type="button"
                  onClick={handleSaveSearchAlert}
                  className="px-2.5 py-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 hover:bg-amber-200 text-amber-900 dark:text-amber-300 text-xs font-bold flex items-center gap-1 shrink-0 transition"
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
                    ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-900 border-transparent dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
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
              <div className="p-3 rounded-2xl bg-slate-100/90 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 grid grid-cols-3 gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
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
                  className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                />
                <input
                  type="number"
                  placeholder="Max ₵"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
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
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
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
              <div className="text-center py-16 px-6 bg-white/95 dark:bg-slate-900/95 rounded-3xl border border-slate-200/80 dark:border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">No ads found here yet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
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
                      className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col"
                    >
                      <div className="aspect-square bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
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
                          <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
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
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-slate-700 hover:scale-105 transition shadow-xs"
                          title={isSaved ? 'Saved' : 'Save Ad'}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              isSaved ? 'fill-rose-600 text-rose-600' : 'text-slate-600 dark:text-slate-300'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="font-extrabold text-sm text-emerald-700 dark:text-emerald-400">
                            ₵{Number(item.price).toLocaleString()}
                            {item.price_period !== 'one-time' && (
                              <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                                {' '}
                                / {item.price_period}
                              </span>
                            )}
                          </p>
                          <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 mt-0.5">
                            {item.title}
                          </h3>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <MapPin className="w-3 h-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span className="truncate">{locationLabel}</span>
                          </div>

                          {item.seller_id !== user?.id && (
                            <div className="w-full py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1">
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
                  className="w-full px-3.5 py-2.5 rounded-xl !bg-white !text-slate-900 placeholder:!text-slate-400 text-xs font-medium focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={reqVertical}
                    onChange={(e) => setReqVertical(e.target.value as any)}
                    className="px-2.5 py-2 rounded-xl !bg-white !text-slate-900 text-xs font-semibold"
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
                    className="px-3 py-2 rounded-xl !bg-white !text-slate-900 placeholder:!text-slate-400 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={reqRegion}
                    onChange={(e) => {
                      setReqRegion(e.target.value);
                      setReqCity(GHANA_REGIONS[e.target.value]?.[0] || '');
                    }}
                    className="px-2.5 py-2 rounded-xl !bg-white !text-slate-900 text-xs font-semibold"
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
                    className="px-2.5 py-2 rounded-xl !bg-white !text-slate-900 text-xs font-semibold"
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                Active Buyer Requests ({requests.length})
              </h3>

              {requests.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/80 dark:border-slate-800">
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
                      className="p-4 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {req.vertical}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
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

                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{req.title}</h4>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Budget:{' '}
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
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
              <div className="text-center py-14 px-6 bg-white/95 dark:bg-slate-900/95 rounded-3xl border border-slate-200/80 dark:border-slate-800">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <UserIcon className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sign in to Find It</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Create a free individual or business account to post ads, save favorites, negotiate with buyers, and manage your listings.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setAuthInitialMode('signup');
                    setShowAuthModal(true);
                  }}
                  className="mt-5 px-6 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md"
                >
                  Sign In / Create Account
                </button>
              </div>
            ) : (
              <>
                <div className="bg-white/95 dark:bg-slate-900/95 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
                  <div className="h-16 bg-gradient-to-r from-emerald-600 to-emerald-800" />
                  <div className="px-5 pb-5">
                    <div className="flex items-end justify-between -mt-8 mb-3 gap-2">
                      <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white border-4 border-white dark:border-slate-900 shadow-md flex items-center justify-center text-xl font-extrabold shrink-0">
                        {(profile?.full_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <button
                          type="button"
                          onClick={handleShareAccount}
                          className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950 hover:bg-sky-100 text-sky-700 dark:text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition"
                          title="Share Your Shop / Profile Link"
                        >
                          {copiedAccountLink ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5" />
                              Share Shop
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setStorefrontSellerId(user.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Store className="w-3.5 h-3.5" />
                          My Shop
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingProfile(!editingProfile)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          {editingProfile ? 'Cancel' : 'Edit'}
                        </button>
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="p-2 rounded-xl bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 transition"
                          title="Sign Out"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {!editingProfile ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">
                            {profile?.full_name}
                          </h2>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            {profile?.account_type === 'business' ? 'Business' : 'Member'}
                          </span>
                        </div>

                        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                          {profile?.whatsapp_number && (
                            <span className="flex items-center gap-1.5 font-medium">
                              <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              {profile.whatsapp_number}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            {profile?.city}
                            {profile?.neighborhood ? ` - ${profile.neighborhood}` : ''}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveProfile} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                            Display Name
                          </label>
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                            WhatsApp / Phone Number
                          </label>
                          <input
                            type="tel"
                            required
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                              Region
                            </label>
                            <select
                              value={editRegion}
                              onChange={(e) => {
                                setEditRegion(e.target.value);
                                setEditCity(GHANA_REGIONS[e.target.value]?.[0] || '');
                              }}
                              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
                            >
                              {REGION_NAMES.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                              City / Town
                            </label>
                            <select
                              value={editCity}
                              onChange={(e) => setEditCity(e.target.value)}
                              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
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

                {/* Switch Accounts Section (Without Logging Out) */}
                <div className="p-4 bg-white/95 dark:bg-slate-900/95 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Switch Account ({savedAccounts.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthInitialMode('signin');
                        setShowAuthModal(true);
                      }}
                      className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      + Add Account
                    </button>
                  </div>

                  <div className="space-y-2">
                    {savedAccounts.map((acc) => {
                      const isCurrent = acc.id === user.id;
                      const isSwitching = switchingAccountId === acc.id;
                      return (
                        <div
                          key={acc.id}
                          onClick={() => !isCurrent && handleSwitchAccount(acc)}
                          className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 transition ${
                            isCurrent
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200/70 dark:border-slate-700 hover:border-emerald-400 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {(acc.full_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                {acc.full_name}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {acc.email}
                              </p>
                            </div>
                          </div>

                          {isCurrent ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold shrink-0">
                              Active
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 shrink-0">
                              {isSwitching ? 'Switching...' : 'Switch'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <MessagesInbox
                  currentUserId={user.id}
                  onUnreadChange={(count) => setUnreadCount(count)}
                />

                {/* Saved Search Alerts */}
                {savedSearches.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 flex items-center gap-1.5">
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
                            className="p-3 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                          >
                            <button
                              type="button"
                              onClick={() => handleApplySavedSearch(alert)}
                              className="text-left flex-1 min-w-0"
                            >
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                  &ldquo;{alert.keyword}&rdquo;
                                </p>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                                  {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
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
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                      Saved Ads ({savedListings.length})
                    </h3>
                    <div className="space-y-2">
                      {savedListings.map((savedAd) => {
                        const thumb = savedAd.media_urls?.[0];
                        return (
                          <div
                            key={savedAd.id}
                            className="p-3 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                          >
                            <div
                              onClick={() => setSelectedListing(savedAd)}
                              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                            >
                              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                                {thumb ? (
                                  <img src={thumb} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                  {savedAd.title}
                                </p>
                                <p className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                                  ₵{Number(savedAd.price).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleSave(savedAd.id)}
                              className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 hover:bg-rose-100 transition"
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
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      My Listings & Performance ({myListings.length})
                    </h3>
                    <button
                      type="button"
                      onClick={handleOpenPostAd}
                      className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      + Post New Ad
                    </button>
                  </div>

                  {myListings.length === 0 ? (
                    <div className="text-center py-10 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      <p className="text-xs text-slate-500 dark:text-slate-400">You haven&apos;t posted any ads yet.</p>
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
                          className={`p-3.5 bg-white/95 dark:bg-slate-900/95 rounded-2xl border space-y-3 ${
                            isSold
                              ? 'border-slate-200 dark:border-slate-800 opacity-80'
                              : 'border-slate-200/80 dark:border-slate-800'
                          }`}
                        >
                          <div
                            onClick={() => setSelectedListing(ad)}
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                              {thumb ? (
                                <img src={thumb} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5 text-slate-400" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                  {ad.title}
                                </p>
                                {isSold && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 shrink-0">
                                    Sold
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                ₵{Number(ad.price).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* Ad Performance Stats Bar */}
                          <div className="grid grid-cols-3 gap-2 py-2 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/70 text-center">
                            <div>
                              <p className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-1">
                                <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                {viewsCount}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Views</p>
                            </div>
                            <div className="border-x border-slate-200/80 dark:border-slate-700">
                              <p className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-1">
                                <Heart className="w-3.5 h-3.5 text-rose-500" />
                                {savesCount}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Saves</p>
                            </div>
                            <div>
                              <p className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-1">
                                <MessageCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                {leadsCount}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Inquiries</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingListing(ad)}
                              className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleListingStatus(ad)}
                              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                                isSold
                                  ? 'bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 text-amber-800 dark:text-amber-300'
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

                {/* Change Password Card */}
                <div className="p-4 bg-white/95 dark:bg-slate-900/95 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">Change Password</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Update your login password anytime.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOldPassword('');
                      setNewPassword('');
                      setConfirmNewPassword('');
                      setPasswordError('');
                      setPasswordSuccess(false);
                      setShowPasswordModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-100 text-xs font-bold shrink-0 transition"
                  >
                    Change
                  </button>
                </div>
              </>
            )}

            {/* User Guide / Manual Card (Available for everyone) */}
            <div className="p-4 bg-white/95 dark:bg-slate-900/95 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">User Guide &amp; Manual</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Learn how to post ads, use Find It requests &amp; switch accounts.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-100 dark:bg-amber-950 hover:bg-amber-200 text-amber-900 dark:text-amber-300 text-xs font-bold shrink-0 transition"
              >
                Open Guide
              </button>
            </div>

            {/* WhatsApp Support Card (Available for everyone) */}
            <div className="p-4 bg-white/95 dark:bg-slate-900/95 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Need Help or Have Feedback?</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
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
              <div className="p-4 bg-white/95 dark:bg-slate-900/95 rounded-3xl border border-red-200/80 dark:border-red-900/60 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs text-red-700 dark:text-red-400">Delete Account</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
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
                  className="px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950 hover:bg-red-100 text-red-700 dark:text-red-300 text-xs font-bold shrink-0 transition"
                >
                  Delete Account
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Change Password Modal */}
      {showPasswordModal && user && (
        <div
          onClick={() => !changingPassword && setShowPasswordModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Change Password</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Confirm your current password first</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter old password..."
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Re-enter new password..."
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {passwordError && (
                <p className="text-[11px] font-semibold text-red-600 bg-red-50 dark:bg-red-950/60 px-3 py-2 rounded-xl">
                  {passwordError}
                </p>
              )}

              {passwordSuccess && (
                <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-2 rounded-xl">
                  Password updated successfully!
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={changingPassword}
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  {changingPassword ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* iOS / Manual Add to Home Screen Guide Modal */}
      {showIosInstallTip && (
        <div
          onClick={() => setShowIosInstallTip(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800"
          >
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Add Find It Gh to Your Home Screen
            </h3>
            <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-decimal pl-4">
              <li>
                Tap the <span className="font-bold">Share</span> icon (or browser menu <span className="font-bold">⋮</span>) at the bottom or top of your browser.
              </li>
              <li>
                Scroll down and tap <span className="font-bold">&ldquo;Add to Home Screen&rdquo;</span> (or <span className="font-bold">&ldquo;Install App&rdquo;</span>).
              </li>
              <li>
                Tap <span className="font-bold">Add</span> — Find It will appear on your phone screen just like an app!
              </li>
            </ol>
            <button
              type="button"
              onClick={() => {
                setShowIosInstallTip(false);
                dismissInstallBanner();
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
            >
              Done, Hide Banner
            </button>
          </div>
        </div>
      )}

      {/* Password-Confirmed Account Deletion Modal */}
      {showDeleteModal && user && (
        <div
          onClick={() => !deletingAccount && setShowDeleteModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center gap-2.5 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Delete Your Account?</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              All your active listings, saved ads, requests, and messages will be permanently deleted. Enter the password you used to sign up to confirm.
            </p>

            <form onSubmit={handleDeleteAccount} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
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
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {deleteError && (
                <p className="text-[11px] font-semibold text-red-600 bg-red-50 dark:bg-red-950/60 px-3 py-2 rounded-xl">
                  {deleteError}
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={deletingAccount}
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
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

      {/* Bottom Navigation Bar (With extra vertical clearance for iOS home bar) */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto px-3 min-h-[68px] py-1.5 grid grid-cols-4 items-center">
          <button
            type="button"
            onClick={() => setActiveTab('explore')}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
              activeTab === 'explore'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <Compass className="w-5 h-5" />
            Explore
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
              activeTab === 'requests'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            Find It
          </button>

          <button
            type="button"
            onClick={handleOpenPostAd}
            className="flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 transition"
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
              activeTab === 'account'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-400 dark:text-slate-500'
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
        initialMode={authInitialMode}
        onClose={() => setShowAuthModal(false)}
        onSuccess={loadSession}
      />

      <UserGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
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
          setAuthInitialMode('signup');
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
          setAuthInitialMode('signup');
          setShowAuthModal(true);
        }}
      />
    </div>
  );
}