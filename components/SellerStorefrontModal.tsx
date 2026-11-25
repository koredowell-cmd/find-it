'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ListingWithSeller } from './ListingDetailModal';
import {
  X,
  Store,
  MapPin,
  Star,
  Package,
  CheckCircle2,
  Loader2,
  Send,
} from 'lucide-react';

interface SellerStorefrontModalProps {
  sellerId: string | null;
  currentUserId: string | null;
  onClose: () => void;
  onSelectListing: (listing: ListingWithSeller) => void;
  onRequireAuth: () => void;
}

export default function SellerStorefrontModal({
  sellerId,
  currentUserId,
  onClose,
  onSelectListing,
  onRequireAuth,
}: SellerStorefrontModalProps) {
  const [seller, setSeller] = useState<any>(null);
  const [activeAds, setActiveAds] = useState<ListingWithSeller[]>([]);
  const [soldCount, setSoldCount] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadStorefront = useCallback(async () => {
    if (!sellerId) return;
    setLoading(true);

    const [profileRes, listingsRes, reviewsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', sellerId).single(),
      supabase
        .from('listings')
        .select(`*, profiles ( full_name, whatsapp_number, account_type, is_verified )`)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false }),
      supabase
        .from('seller_reviews')
        .select(`*, reviewer:profiles!seller_reviews_reviewer_id_fkey ( full_name )`)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false }),
    ]);

    setSeller(profileRes.data || { full_name: 'Find It Seller' });

    const allAds = (listingsRes.data as any[]) || [];
    setActiveAds(allAds.filter((a) => a.status === 'active'));
    setSoldCount(allAds.filter((a) => a.status === 'sold').length);
    setReviews(reviewsRes.data || []);
    setLoading(false);
  }, [sellerId]);

  useEffect(() => {
    if (sellerId) {
      loadStorefront();
    }
  }, [sellerId, loadStorefront]);

  if (!sellerId) return null;

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      onRequireAuth();
      return;
    }
    if (currentUserId === sellerId || submittingReview) return;

    setSubmittingReview(true);
    await supabase.from('seller_reviews').upsert(
      {
        seller_id: sellerId,
        reviewer_id: currentUserId,
        rating,
        comment: comment.trim(),
      },
      { onConflict: 'seller_id,reviewer_id' }
    );

    setComment('');
    setSubmittingReview(false);
    loadStorefront();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-sm text-slate-900">Seller Storefront</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Seller Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-white">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-xl font-extrabold shrink-0">
                  {(seller?.full_name || 'S').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-extrabold text-lg truncate">{seller?.full_name}</h2>
                  <p className="text-xs text-emerald-100 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {seller?.city || 'Ghana'}
                    {seller?.neighborhood ? ` - ${seller.neighborhood}` : ''}
                  </p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/15 text-center">
                <div>
                  <p className="text-base font-extrabold">{activeAds.length}</p>
                  <p className="text-[10px] uppercase tracking-wider text-emerald-200">Active Ads</p>
                </div>
                <div>
                  <p className="text-base font-extrabold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                    {soldCount}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-emerald-200">Sold</p>
                </div>
                <div>
                  <p className="text-base font-extrabold flex items-center justify-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                    {avgRating || 'New'}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-emerald-200">
                    {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
                  </p>
                </div>
              </div>
            </div>

            {/* Active Ads Grid */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Available Items & Services ({activeAds.length})
              </h3>

              {activeAds.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6 bg-slate-50 rounded-2xl">
                  No active listings right now.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {activeAds.map((item) => {
                    const thumb = item.media_urls?.[0];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectListing(item);
                        }}
                        className="text-left bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-emerald-400 transition"
                      >
                        <div className="aspect-square bg-slate-100">
                          {thumb ? (
                            <img src={thumb} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Package className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="font-extrabold text-xs text-emerald-700">
                            ₵{Number(item.price).toLocaleString()}
                          </p>
                          <p className="text-xs font-semibold text-slate-900 truncate mt-0.5">
                            {item.title}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Buyer Reviews & Rating Form */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Buyer Reviews ({reviews.length})
              </h3>

              {currentUserId !== sellerId && (
                <form
                  onSubmit={handleSubmitReview}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Rate this seller</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setRating(num)}
                          className="p-0.5"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              num <= rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Share your experience dealing with this seller..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Post
                    </button>
                  </div>
                </form>
              )}

              {reviews.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  No reviews yet. Be the first to leave feedback!
                </p>
              ) : (
                <div className="space-y-2">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3 rounded-2xl bg-white border border-slate-200/80 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">
                          {rev.reviewer?.full_name || 'Buyer'}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: rev.rating }).map((_, idx) => (
                            <Star
                              key={idx}
                              className="w-3 h-3 fill-amber-400 text-amber-400"
                            />
                          ))}
                        </div>
                      </div>
                      {rev.comment && (
                        <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}