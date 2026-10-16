'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { GlobalContributionBalance } from '@/components/GlobalContributionBalance';
import { CommunityDonationBanner } from '@/components/CommunityDonationBanner';
import { RecentContributorsPaginated } from '@/components/RecentContributorsPaginated';
import { PlusCircle, Info, Car, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 md:pb-6">
      {/* Community Hero Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-md">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Fon Kominote Chofè Legliz • Transparans Total</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
          Ansanm, n ap soutni kominote nou an.
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
          Chak kontribisyon, piti kou gwo, ede nou avanse ansanm. Bay selon mwayen ou, epi suiv kijan kontribisyon yo ap anrejistre ak transparans.
        </p>
      </div>

      {/* 1. PRIMARY VISUAL ELEMENT: GLOBAL LIVE CONTRIBUTION BALANCE (Large Bank-Style Hero) */}
      <GlobalContributionBalance
        variant="hero"
        label="Kantite Kòb ki Ranmase"
      />

      {/* 2. COMMUNITY DONATION SECTION (Directly Below Balance) */}
      <CommunityDonationBanner />

      {/* Primary Action Buttons (Fintech Clean) */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/chofe/soumet"
          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-bold shadow-xs transition"
        >
          <PlusCircle className="w-4 h-4 text-emerald-400" />
          Soumèt Kontribisyon
        </Link>
        <Link
          href="/chofe"
          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs sm:text-sm font-bold transition"
        >
          <Car className="w-4 h-4 text-slate-500" />
          Kont Mwen
        </Link>
      </div>

      {/* Minimal Fintech Rule Card in Haitian Creole */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-700 leading-relaxed shadow-xs">
        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900 font-bold">Règ Kontribisyon an:</strong> Ou lib pou kontribye nenpòt montan ou kapab. Ou ka fè plizyè kontribisyon nan menm jou a. Pa gen montan minimòm ni limit sou kantite fwa ou ka kontribye. Si ou pa travay yon jou, ou pa gen okenn obligasyon ni dèt.
        </div>
      </div>

      {/* 7. RECENT CONTRIBUTORS WITH SERVER-SIDE PAGINATION (6 records per page) */}
      <Suspense
        fallback={
          <div className="bg-white rounded-3xl p-6 border border-slate-100 animate-pulse h-48" />
        }
      >
        <RecentContributorsPaginated pageSize={6} />
      </Suspense>
    </div>
  );
}
