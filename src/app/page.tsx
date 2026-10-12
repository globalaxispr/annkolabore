'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { repository } from '@/lib/repository';
import { FinancialSummary } from '@/lib/types';
import { FinancialCards } from '@/components/FinancialCards';
import { PublicTransactionsTable } from '@/components/PublicTransactionsTable';
import { PlusCircle, ShieldCheck, HeartHandshake, Info } from 'lucide-react';

export default function HomePage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [transactions, setTransactions] = useState<
    {
      id: string;
      driver_name: string;
      amount_centavos: number;
      work_date: string;
      payment_date: string;
      approval_date: string;
      status: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const sum = await repository.getFinancialSummary();
        const trans = await repository.getPublicTransactions();
        setSummary(sum);
        setTransactions(trans);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Banner with Clear Purpose */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
            Soutyen ak Devouman pou Legliz la
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Transparans Finansye Gwoup Chofè yo
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Chak chofè kontribye <strong>R$ 10,00</strong> pou chak jou li travay. Fon sa yo ranmase
            pou sipòte travay ak misyon legliz nou an nan Brezil avèk onètete ak klète.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
          <Link
            href="/chofe/soumet"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            Soumèt Kontribisyon
          </Link>
          <Link
            href="/chofe"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition"
          >
            Kont Mwen
          </Link>
        </div>
      </div>

      {/* Financial Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200/60 rounded-2xl" />
          ))}
        </div>
      ) : summary ? (
        <FinancialCards summary={summary} />
      ) : null}

      {/* Transparent Rule Explainer Box */}
      <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-slate-600 space-y-1">
          <span className="font-bold text-slate-800">Règ Kontribisyon an:</span>
          <p>
            Yon chofè kontribye R$ 10 pou chak jou li te travay reyèlman. Si yon chofè pa travay nan yon jou, li pa gen okenn obligasyon pou jou sa a. Pa gen dèt otomatik oswa penalite. Lajan an afiche sou balans lan sèlman lè trezorye a fin apwouve peman an.
          </p>
        </div>
      </div>

      {/* Public Transactions Table */}
      <PublicTransactionsTable transactions={transactions} />
    </div>
  );
}
