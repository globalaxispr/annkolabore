'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { GlobalContributionBalance } from '@/components/GlobalContributionBalance';
import { CommunityDonationBanner } from '@/components/CommunityDonationBanner';
import { RecentContributorsPaginated } from '@/components/RecentContributorsPaginated';
import { PlusCircle, Info, Car } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 md:pb-6">
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
      <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-start gap-3 text-xs text-slate-600 leading-relaxed">
        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800">Règ Kontribisyon an:</strong> Chak chofè bay yon
          minimòm <strong>R$ 10,00</strong> pou chak jou li travay reyèlman. Ou gen dwa bay plis
          (R$ 15, R$ 20, R$ 50, elatriye). Si ou pa t travay nan yon jou, ou pa gen okenn
          obligasyon oswa dèt.
        </div>
      </div>

      {/* 7. RECENT CONTRIBUTORS WITH SERVER-SIDE PAGINATION */}
      <Suspense
        fallback={
          <div className="bg-white rounded-3xl p-6 border border-slate-100 animate-pulse h-48" />
        }
      >
        <RecentContributorsPaginated pageSize={5} />
      </Suspense>
    </div>
  );
}
