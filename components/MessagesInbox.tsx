'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageCircle, Send, ArrowLeft, Loader2, Package } from 'lucide-react';

interface MessagesInboxProps {
  currentUserId: string;
}

interface ConversationThread {
  key: string;
  listingId: string;
  listingTitle: string;
  listingThumb?: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastTimestamp: string;
  messages: any[];
}

export default function MessagesInbox({ currentUserId }: MessagesInboxProps) {
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [activeThreadKey, setActiveThreadKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        listings ( id, title, media_urls ),
        sender:profiles!messages_sender_id_fkey ( id, full_name ),
        receiver:profiles!messages_receiver_id_fkey ( id, full_name )
      `)
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .order('created_at', { ascending: true });

    if (error || !data) {
      setLoading(false);
      return;
    }

    const grouped: Record<string, ConversationThread> = {};

    data.forEach((msg: any) => {
      if (!msg.listing_id) return;
      const isMeSender = msg.sender_id === currentUserId;
      const otherUser = isMeSender ? msg.receiver : msg.sender;
      const otherUserId = isMeSender ? msg.receiver_id : msg.sender_id;
      const key = `${msg.listing_id}_${otherUserId}`;

      if (!grouped[key]) {
        grouped[key] = {
          key,
          listingId: msg.listing_id,
          listingTitle: msg.listings?.title || 'Listing',
          listingThumb: msg.listings?.media_urls?.[0],
          otherUserId,
          otherUserName: otherUser?.full_name || 'Find It User',
          lastMessage: msg.content,
          lastTimestamp: msg.created_at,
          messages: [],
        };
      }

      grouped[key].messages.push(msg);
      grouped[key].lastMessage = msg.content;
      grouped[key].lastTimestamp = msg.created_at;
    });

    const sortedThreads = Object.values(grouped).sort(
      (a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
    );

    setThreads(sortedThreads);
    setLoading(false);
  }, [currentUserId]);

  useEffect(() => {
    loadConversations();

    const channel = supabase
      .channel(`inbox-${currentUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as any;
          if (msg.sender_id === currentUserId || msg.receiver_id === currentUserId) {
            loadConversations();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, loadConversations]);

  const activeThread = threads.find((t) => t.key === activeThreadKey) || null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages.length]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThread || sending) return;

    setSending(true);
    const content = replyText.trim();
    setReplyText('');

    const { error } = await supabase.from('messages').insert({
      listing_id: activeThread.listingId,
      sender_id: currentUserId,
      receiver_id: activeThread.otherUserId,
      content,
    });

    if (error) {
      setReplyText(content);
    } else {
      await loadConversations();
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
      </div>
    );
  }

  // Active Chat Thread View
  if (activeThread) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden flex flex-col h-[420px]">
        {/* Thread Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-slate-50/70">
          <button
            type="button"
            onClick={() => setActiveThreadKey(null)}
            className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-xs text-slate-900 truncate">
              {activeThread.otherUserName}
            </p>
            <p className="text-[11px] text-emerald-700 font-medium truncate">
              Re: {activeThread.listingTitle}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/40">
          {activeThread.messages.map((m) => {
            const isMine = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                    isMine
                      ? 'bg-emerald-600 text-white rounded-br-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Reply Input */}
        <form
          onSubmit={handleSendReply}
          className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-xl bg-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!replyText.trim() || sending}
            className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }

  // Conversations List View
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Messages & Negotiations ({threads.length})
        </h3>
      </div>

      {threads.length === 0 ? (
        <div className="text-center py-8 px-4 bg-white rounded-2xl border border-slate-200/80">
          <MessageCircle className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
          <p className="text-xs text-slate-500">No messages yet.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            When buyers negotiate on your ads, chats appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => (
            <button
              key={thread.key}
              type="button"
              onClick={() => setActiveThreadKey(thread.key)}
              className="w-full text-left p-3 bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 transition flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                {thread.listingThumb ? (
                  <img
                    src={thread.listingThumb}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-5 h-5 text-slate-400" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-xs text-slate-900 truncate">
                    {thread.otherUserName}
                  </p>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(thread.lastTimestamp).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-emerald-700 truncate">
                  {thread.listingTitle}
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{thread.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}