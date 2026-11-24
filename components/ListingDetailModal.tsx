'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  X,
  MapPin,
  Phone,
  MessageCircle,
  Send,
  ShieldCheck,
  Store,
  User,
  ExternalLink,
  CheckCircle2,
  Eye,
} from 'lucide-react';

export interface ListingWithSeller {
  id: string;
  seller_id: string;
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
  neighborhood: string;
  media_urls: string[];
  created_at: string;
  profiles: {
    full_name: string;
    whatsapp_number: string | null;
    account_type: 'individual' | 'business';
    is_verified: boolean;
  };
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

interface ListingDetailModalProps {
  listing: ListingWithSeller | null;
  currentUserId: string | null;
  onClose: () => void;
  onRequireAuth: () => void;
}

export default function ListingDetailModal({
  listing,
  currentUserId,
  onClose,
  onRequireAuth,
}: ListingDetailModalProps) {
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);
  const [showContact, setShowContact] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'chat'>('details');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveMediaIdx(0);
    setShowContact(false);
    setActiveTab('details');
    setMessages([]);
  }, [listing?.id]);

  useEffect(() => {
    if (!listing || !currentUserId) return;

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
          const incoming = payload.new as Message;
          if (
            incoming.sender_id === currentUserId ||
            incoming.receiver_id === currentUserId
          ) {
            setMessages((prev) =>
              prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listing?.id, currentUserId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  if (!listing) return null;

  const isOwner = currentUserId === listing.seller_id;
  const mediaList = listing.media_urls || [];
  const activeUrl = mediaList[activeMediaIdx];
  const isVideo = activeUrl?.match(/\.(mp4|webm|mov|ogg)(\?|$)/i);

  const cleanPhone = listing.profiles?.whatsapp_number?.replace(/[^0-9]/g, '') || '';
  const whatsappText = encodeURIComponent(
    `Hi ${listing.profiles?.full_name || 'there'}, I saw your "${listing.title}" on Find It for GHS ${listing.price.toLocaleString()}. Is it still available?`
  );
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${whatsappText}`;

  const handleOpenChat = () => {
    if (!currentUserId) {
      onRequireAuth();
      return;
    }
    setActiveTab('chat');
  };

  const handleRevealContact = () => {
    if (!currentUserId) {
      onRequireAuth();
      return;
    }
    setShowContact(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    const lastBuyerMsg = [...messages].reverse().find((m) => m.sender_id !== currentUserId);
    const receiverId = isOwner ? lastBuyerMsg?.sender_id || listing.seller_id : listing.seller_id;

    const { error } = await supabase.from('messages').insert({
      listing_id: listing.id,
      sender_id: currentUserId,
      receiver_id: receiverId,
      content,
    });

    if (error) {
      setNewMessage(content);
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/65 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700">
              {listing.vertical}
            </span>
            <span className="text-xs text-slate-400">• {listing.category}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'details'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500'
            }`}
          >
            Listing Details
          </button>
          <button
            onClick={handleOpenChat}
            className={`py-2.5 text-xs font-bold border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'chat'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Negotiate in Chat
            {messages.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px]">
                {messages.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: DETAILS */}
        {activeTab === 'details' ? (
          <div className="overflow-y-auto p-5 space-y-5">
            {mediaList.length > 0 ? (
              <div className="space-y-2">
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900">
                  {isVideo ? (
                    <video
                      src={activeUrl}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={activeUrl}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {mediaList.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {mediaList.map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveMediaIdx(idx)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 ${
                          activeMediaIdx === idx
                            ? 'border-emerald-600'
                            : 'border-transparent opacity-60'
                        }`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                No photos uploaded for this listing
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                {listing.condition && (
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                    {listing.condition}
                  </span>
                )}
                {listing.is_negotiable && (
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">
                    Negotiable
                  </span>
                )}
              </div>

              <h1 className="text-xl font-bold text-slate-900 leading-snug">{listing.title}</h1>

              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-extrabold text-emerald-700">
                  ₵{Number(listing.price).toLocaleString()}
                </span>
                {listing.price_period !== 'one-time' && (
                  <span className="text-xs font-medium text-slate-500">
                    / {listing.price_period}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  {listing.neighborhood ? `${listing.neighborhood}, ` : ''}
                  {listing.city}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Description
              </h3>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {listing.description}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                  {listing.profiles?.full_name?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-900">
                      {listing.profiles?.full_name || 'Find It Seller'}
                    </span>
                    {listing.profiles?.is_verified && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    {listing.profiles?.account_type === 'business' ? (
                      <>
                        <Store className="w-3 h-3 text-amber-600" />
                        <span>Business / Shop</span>
                      </>
                    ) : (
                      <>
                        <User className="w-3 h-3" />
                        <span>Individual Advertiser</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {!isOwner && (
              <div className="space-y-2.5">
                {!showContact ? (
                  <button
                    onClick={handleRevealContact}
                    className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
                  >
                    <Eye className="w-4 h-4" />
                    Show Seller Phone & WhatsApp
                  </button>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-800">
                        Direct Seller Contact:
                      </span>
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {listing.profiles?.whatsapp_number || 'Not provided'}
                      </span>
                    </div>

                    {cleanPhone && (
                      <div className="grid grid-cols-2 gap-2.5">
                        <a
                          href={`tel:+${cleanPhone}`}
                          className="py-2.5 px-3 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-100/50 transition"
                        >
                          <Phone className="w-4 h-4" />
                          Call Seller
                        </a>
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-3 rounded-xl bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-700 transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                          WhatsApp Chat
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleOpenChat}
                  className="w-full py-3 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold text-sm flex items-center justify-center gap-2 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  Negotiate Price on Find It
                </button>
              </div>
            )}

            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                <strong>Safe Deal Tip:</strong> Meet in a public place, inspect the item or property
                thoroughly before making payment, and avoid paying deposits before inspection.
              </p>
            </div>
          </div>
        ) : (
          /* TAB 2: CHAT */
          <div className="flex flex-col h-[60vh]">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {messages.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <p className="text-xs font-semibold text-slate-600">
                    Start negotiating on &ldquo;{listing.title}&rdquo;
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ask about availability, final price, or arrange where to meet.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const mine = msg.sender_id === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          mine
                            ? 'bg-emerald-600 text-white rounded-br-xs'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Type an offer or question..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}