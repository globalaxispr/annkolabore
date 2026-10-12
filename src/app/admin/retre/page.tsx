'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Church, ShieldCheck } from 'lucide-react';
import { GlobalContributionBalance } from '@/components/GlobalContributionBalance';

export default function AdminRetrePage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16 md:pb-6">
      <div className="flex items-center gap-2">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Retounen nan Espas Administratè
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Church className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Fon Kominotè Chofè Legliz
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Tout kontribisyon chofè yo ale dirèkteman nan kès legliz la.
            </p>
          </div>
        </div>

        <GlobalContributionBalance variant="compact" label="Kantite Kòb ki Ranmase" />

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Transparans ak Destinasyon Fon yo
          </div>
          <p>
            Tout lajan chofè yo kontribye (R$ 10,00 pou chak jou yo travay) se yon donasyon dirèk
            pou legliz la. Tout tranzaksyon yo vizib piblikman pou tout manm ak vizitè yo.
          </p>
        </div>

        <div>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:bg-black transition"
          >
            Retounen nan Apèsi Finansye
          </Link>
        </div>
      </div>
    </div>
  );
}
