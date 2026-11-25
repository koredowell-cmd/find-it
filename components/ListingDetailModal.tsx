'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  X,
  Phone,
  MessageCircle,
  Send,
  MapPin,
  Store,
  Heart,
  Share2,
  Check,
  ChevronRight,
  ShieldAlert,
  Flag,
} from 'lucide-react';

export interface ListingWithSeller {
  id: string;
  seller_id: string;
  status?: string;
  vertical: 'product' | 'service' | 'property';
  category: string;
  title: string;
  description: string;
  condition: string | null;
  price: number;
  price_period: string;
  currency: string;
  is_negotiable: boolean;
  city: string;
  neighborhood: string | null;
  media_urls: string[];
  created_at: string;
  profiles?: {
    full_name: string;
    whatsapp_number: string;
    account_type: string;
    is_verified: boolean;
  };
}

interface ListingDetailModalProps {
  listing: ListingWithSeller | null;
  currentUserId: string | null;
  isSaved?: boolean;
  onToggleSave?: (listingId: string) => void;
  onOpenStorefront?: (sellerId: string) => void;
  onClose: () => void;
  onRequireAuth: () => void;
}

const REPORT_REASONS = [
  'Suspected scam or fake listing',
  'Asking for advance payment / MoMo deposit',
  'Wrong price or misleading description',
  'Prohibited or illegal item',
  'Duplicate or spam post',
];

export default function ListingDetailModal({
  listing,
  currentUserId,
  isSaved = false,
  onToggleSave,
  onOpenStorefront,
  onClose,
  onRequireAuth,
}: ListingDetailModalProps) {
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Report Ad state
  const [showReportBox, setShowReportBox] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveMediaIdx(0);
    setCopiedShare(false);
    setShowReportBox(false);
    setReportSent(false);
    setReportDetails('');

    if (!listing || !currentUserId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('listing_id', listing.id)
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    };

    fetchMessages();

    const channel = supabase
      .channel(`listing-chat-${listing.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `listing_id=eq.${listing.id}`,
        },
        (payload) => {
          const msg = payload.new;
          if (msg.sender_id === currentUserId || msg.receiver_id === currentUserId) {
            setMessages((prev) =>
              prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listing, currentUserId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!listing) return null;

  const mediaList = listing.media_urls?.length ? listing.media_urls : [];
  const activeUrl = mediaList[activeMediaIdx];
  const isVideo = activeUrl?.match(/\.(mp4|webm|mov|ogg)(\?|$)/i);

  const sellerName = listing.profiles?.full_name || 'Find It Seller';
  const rawPhone = listing.profiles?.whatsapp_number || '';
  const whatsappDigits = rawPhone.replace(/[^0-9]/g, '');
  const prefilledText = encodeURIComponent(
    `Hi ${sellerName}, I saw your "${listing.title}" (₵${Number(
      listing.price
    ).toLocaleString()}) on Find It. Is it still available?`
  );

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?ad=${listing.id}`;
    const shareText = `${listing.title} — ₵${Number(listing.price).toLocaleString()} on Find It`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      onRequireAuth();
      return;
    }
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('messages').insert({
      listing_id: listing.id,
      sender_id: currentUserId,
      receiver_id: listing.seller_id,
      content,
      is_read: false,
    });

    if (error) {
      setNewMessage(content);
    }
    setSending(false);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      onRequireAuth();
      return;
    }
    setSubmittingReport(true);
    await supabase.from('listing_reports').insert({
      listing_id: listing.id,
      reporter_id: currentUserId,
      reason: reportReason,
      details: reportDetails.trim() || null,
    });
    setSubmittingReport(false);
    setReportSent(true);
    setShowReportBox(false);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/65 backdrop-blur-sm p-0 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full truncate">
            {listing.category}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition"
              title="Share Ad Link"
            >
              {copiedShare ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>

            {onToggleSave && (
              <button
                type="button"
                onClick={() => onToggleSave(listing.id)}
                className={`p-2 rounded-full transition ${
                  isSaved
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title={isSaved ? 'Remove from Saved' : 'Save Ad'}
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-600' : ''}`} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {mediaList.length > 0 && (
            <div className="space-y-2">
              <div className="w-full h-64 sm:h-72 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center">
                {isVideo ? (
                  <video src={activeUrl} controls className="w-full h-full object-contain" />
                ) : (
                  <img
                    src={activeUrl}
                    alt={listing.title}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {mediaList.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {mediaList.map((url, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setActiveMediaIdx(idx)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 ${
                        activeMediaIdx === idx ? 'border-emerald-600' : 'border-transparent opacity-70'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h1 className="text-xl font-bold text-slate-900">{listing.title}</h1>
              {listing.condition && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 shrink-0">
                  {listing.condition}
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl font-extrabold text-emerald-700">
                ₵{Number(listing.price).toLocaleString()}
              </span>
              {listing.price_period !== 'one-time' && (
                <span className="text-xs font-medium text-slate-500">
                  / {listing.price_period}
                </span>
              )}
              {listing.is_negotiable && (
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  Negotiable
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {listing.city}
                {listing.neighborhood ? ` - ${listing.neighborhood}` : ''}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {listing.description}
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
            <button
              type="button"
              onClick={() => onOpenStorefront?.(listing.seller_id)}
              className="w-full flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  {sellerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 flex items-center gap-1 transition">
                    {sellerName}
                  </p>
                  <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <Store className="w-3 h-3" />
                    View Storefront & Reviews
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              {whatsappDigits && (
                <a
                  href={`https://wa.me/${whatsappDigits}?text=${prefilledText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Seller
                </a>
              )}

              {rawPhone && (
                <a
                  href={`tel:${rawPhone}`}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Phone className="w-4 h-4" />
                  Call Direct
                </a>
              )}
            </div>
          </div>

          {currentUserId !== listing.seller_id && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
                In-App Negotiation Chat
              </div>

              <div className="p-3.5 max-h-48 overflow-y-auto space-y-2 bg-white">
                {messages.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    Send an offer or ask a question directly in the app.
                  </p>
                ) : (
                  messages.map((m) => {
                    const isMine = m.sender_id === currentUserId;
                    return (
                      <div
                        key={m.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[78%] px-3 py-2 rounded-2xl text-xs ${
                            isMine
                              ? 'bg-emerald-600 text-white rounded-br-xs'
                              : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              <form
                onSubmit={handleSendMessage}
                className="p-2 bg-slate-50 border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={
                    currentUserId
                      ? 'Type your offer or question...'
                      : 'Sign in to chat with seller...'
                  }
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* Buyer Safety Tips & Report Ad */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-950 space-y-1">
                <p className="font-bold">Safety Tips for Buyers & Sellers</p>
                <ul className="list-disc pl-4 space-y-0.5 text-amber-900">
                  <li>Meet in a safe, open public place (mall, fuel station, or campus).</li>
                  <li>Inspect and test the item thoroughly before making payment.</li>
                  <li>Never send MoMo deposits or delivery fees before seeing the item.</li>
                </ul>
              </div>
            </div>

            {currentUserId !== listing.seller_id && (
              <div className="pt-1.5 border-t border-amber-200/70">
                {reportSent ? (
                  <p className="text-[11px] font-bold text-emerald-700">
                    Thank you — this listing has been flagged for review.
                  </p>
                ) : !showReportBox ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUserId) {
                        onRequireAuth();
                        return;
                      }
                      setShowReportBox(true);
                    }}
                    className="text-[11px] font-bold text-red-700 hover:underline flex items-center gap-1"
                  >
                    <Flag className="w-3 h-3" />
                    Report suspicious ad or seller
                  </button>
                ) : (
                  <form onSubmit={handleSubmitReport} className="space-y-2 pt-1">
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-medium"
                    >
                      {REPORT_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Optional details (what happened?)"
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={submittingReport}
                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                      >
                        {submittingReport ? 'Submitting...' : 'Submit Report'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowReportBox(false)}
                        className="px-2.5 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-amber-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
