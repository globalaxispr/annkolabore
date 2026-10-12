import React from 'react';
import { FinancialSummary } from '@/lib/types';
import { formatBRL } from '@/lib/formatters';
import { Wallet, TrendingUp, TrendingDown, Calendar, Users, DollarSign } from 'lucide-react';

interface FinancialCardsProps {
  summary: FinancialSummary;
}

export const FinancialCards: React.FC<FinancialCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Balans Disponib (Highlight Card) */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-2xl p-5 shadow-sm shadow-emerald-900/10 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute right-[-10px] top-[-10px] w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
            Balans Disponib
          </span>
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white backdrop-blur-xs">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-3xl font-extrabold tracking-tight">
            {formatBRL(summary.current_balance_centavos)}
          </div>
          <p className="text-xs text-emerald-100/90 mt-1">
            Kòb ki rete nan kès la aprè tout depans
          </p>
        </div>
      </div>

      {/* Kantite Kòb ki Ranmase */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Kantite Kòb ki Ranmase
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            {formatBRL(summary.total_contributions_centavos)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total tout kontribisyon chofè ki apwouve
          </p>
        </div>
      </div>

      {/* Total Depans */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Depans
          </span>
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            {formatBRL(summary.total_expenses_centavos)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total lajan ki retire oswa depanse
          </p>
        </div>
      </div>

      {/* Kontribisyon Jodi a */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Kontribisyon Jodi a
          </span>
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            {formatBRL(summary.today_contributions_centavos)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Lajan ki anrejistre pou jounen jodi a
          </p>
        </div>
      </div>

      {/* Kontribisyon Mwa Sa a */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Kontribisyon Mwa Sa a
          </span>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            {formatBRL(summary.month_contributions_centavos)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kontribisyon apwouve pou tout mwa an kouran an
          </p>
        </div>
      </div>

      {/* Kantite Manm */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Kantite Manm
          </span>
          <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            {summary.members_count} chofè
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chofè ki enskri nan gwoup kontribisyon an
          </p>
        </div>
      </div>
    </div>
  );
};
