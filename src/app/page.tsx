'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { repository, UnifiedTransactionItem } from '@/lib/repository';
import { FinancialSummary, ScheduledWithdrawal } from '@/lib/types';
import { BalanceHero } from '@/components/BalanceHero';
import { UnifiedTransactionFeed } from '@/components/UnifiedTransactionFeed';
import { formatBRL, formatDateCreole } from '@/lib/formatters';
import {
  PlusCircle,
  CalendarClock,
  ArrowRight,
  Info,
  Car,
  ChevronRight,
} from 'lucide-react';

export default function HomePage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [transactions, setTransactions] = useState<UnifiedTransactionItem[]>([]);
  const [scheduledWithdrawals, setScheduledWithdrawals] = useState<ScheduledWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const sum = await repository.getFinancialSummary();
      const trans = await repository.getUnifiedTransactions();
      const sched = await repository.getScheduledWithdrawals();
      setSummary(sum);
      setTransactions(trans);
      setScheduledWithdrawals(sched);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 md:pb-6">
      {/* Primary Element: Balance Hero (Nubank-style) */}
      {loading ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xs animate-pulse space-y-4">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-12 w-64 bg-slate-200 rounded-xl" />
          <div className="grid grid-cols-2 gap-3 pt-4">
            <div className="h-16 bg-slate-100 rounded-2xl" />
            <div className="h-16 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      ) : summary ? (
        <BalanceHero
          summary={summary}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
      ) : null}

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

      {/* Upcoming Scheduled Withdrawals (Public Transparency) */}
      {scheduledWithdrawals.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Retrè ki Pwograme yo
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Transparans Fon
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {scheduledWithdrawals.map((w) => (
              <div
                key={w.id}
                className="py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-800">{w.description}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Dat prevwa: {formatDateCreole(w.scheduled_date, 'long')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-800 font-mono">
                    {formatBRL(w.amount_centavos)}
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                    Pwograme
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Minimal Fintech Rule Card */}
      <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-start gap-3 text-xs text-slate-600 leading-relaxed">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800">Règ Kontribisyon an:</strong> Chak chofè bay yon
          minimòm <strong>R$ 10,00</strong> pou chak jou li travay reyèlman. Ou gen dwa bay plis
          (R$ 15, R$ 20, R$ 50, elatriye). Si ou pa t travay nan yon jou, ou pa gen okenn
          obligasyon oswa dèt.
        </div>
      </div>

      {/* Unified Transaction History Feed */}
      <UnifiedTransactionFeed transactions={transactions} />
    </div>
  );
}
