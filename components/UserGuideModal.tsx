'use client';

import {
  X,
  Compass,
  Sparkles,
  Plus,
  Share2,
  Users,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GUIDE_SECTIONS = [
  {
    icon: Compass,
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    title: '1. Explore Local Deals',
    desc: 'Filter by Region, City/Town (e.g., Madina, East Legon, UPSA), Category, or Price Budget. Tap any listing photo to zoom fullscreen, save favorites with the heart icon, or tap WhatsApp / In-App Chat to negotiate directly.',
  },
  {
    icon: Sparkles,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    title: '2. "Find It" Reverse Marketplace',
    desc: 'Can’t find what you need? Open the Find It tab, type what you’re looking for, set your budget in Cedis (₵), and post your request. Vendors who have it will pitch you directly via WhatsApp.',
  },
  {
    icon: Plus,
    color: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
    title: '3. Post Free Ads in 60 Seconds',
    desc: 'Tap the green + Post Ad button at the bottom to list products, services, or properties with up to 5 photos or videos at 0% commission. Track Views, Saves, and Inquiries under Account → My Listings.',
  },
  {
    icon: Share2,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
    title: '4. Share Ads & Your Shop to WhatsApp Status',
    desc: 'Open any ad and tap Share to copy its direct link or post it to your WhatsApp Status. You can also tap Share Profile in your Account tab so buyers can view all your listings in one place.',
  },
  {
    icon: Users,
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
    title: '5. Switch Between Multiple Accounts',
    desc: 'Have both a personal account and a business shop? Go to Account → Switch Account and tap + Add Account. Once added, switch between accounts in one tap without logging out.',
  },
  {
    icon: ShieldCheck,
    color: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    title: '6. Safe Trading Tips',
    desc: 'Always meet in open public places (campus, malls, fuel stations), inspect items before paying, and never send advance MoMo deposits before seeing what you are buying.',
  },
];

export default function UserGuideModal({ isOpen, onClose }: UserGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/65 backdrop-blur-sm p-0 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                How to Use Find It Gh
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Quick guide for buyers, students &amp; vendors
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3.5">
          {GUIDE_SECTIONS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 flex items-start gap-3"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
          >
            Got It, Let’s Explore
          </button>
        </div>
      </div>
    </div>
  );
}