'use client';

import React from 'react';
import { FinancialSummary } from '@/lib/types';
import { formatBRL, formatDateCreole, formatTime } from '@/lib/formatters';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  CalendarClock,
  ShieldCheck,
} from 'lucide-react';

interface BalanceHeroProps {
  summary: FinancialSummary;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const BalanceHero: React.FC<BalanceHeroProps> = ({
  summary,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xs relative overflow-hidden space-y-6">
      {/* Top Header with small supporting label & refresh action */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Balans Disponib
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Balans aktyèl fon gwoup la</p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition"
            title="Rafrechi balans lan"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Main Dominant Balance Amount (Fintech Hero) */}
      <div className="space-y-1">
        <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-mono">
          {formatBRL(summary.current_balance_centavos)}
        </div>
        {summary.last_updated && (
          <p className="text-[11px] text-slate-400">
            Dènye mizajou: {formatDateCreole(summary.last_updated)} {formatTime(summary.last_updated)}
          </p>
        )}
      </div>

      {/* Below the balance: ONLY TWO compact financial summaries */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
        {/* Total Kontribisyon */}
        <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
            <span>Total Kontribisyon</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900">
            {formatBRL(summary.total_contributions_centavos)}
          </div>
        </div>

        {/* Total Retrè */}
        <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-600" />
            <span>Total Retrè</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900">
            {formatBRL(summary.total_withdrawals_centavos)}
          </div>
        </div>
      </div>

      {/* Scheduled Withdrawals Banner / Projection (if any pending) */}
      {summary.scheduled_withdrawals_centavos > 0 && (
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <CalendarClock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Retrè Pwograme: <strong>{formatBRL(summary.scheduled_withdrawals_centavos)}</strong>
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Balans apre retrè (Pwojeksyon):{' '}
            <strong className="text-slate-800">
              {formatBRL(summary.projected_balance_centavos)}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
};
