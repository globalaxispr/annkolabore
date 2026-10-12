'use client';

import React, { useState } from 'react';
import { UnifiedTransactionItem } from '@/lib/repository';
import { formatBRL, formatDateCreole } from '@/lib/formatters';
import { StatusBadge } from './StatusBadge';
import { ArrowDownLeft, ArrowUpRight, Clock, Filter } from 'lucide-react';

interface UnifiedTransactionFeedProps {
  transactions: UnifiedTransactionItem[];
}

export const UnifiedTransactionFeed: React.FC<UnifiedTransactionFeedProps> = ({
  transactions,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'CONTRIBUTION' | 'WITHDRAWAL'>('ALL');

  const filtered = transactions.filter((t) => {
    if (filterType === 'ALL') return true;
    return t.type === filterType;
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
      {/* Header with Type Filters */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Istwa Tranzaksyon yo
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Aktivite ofisyèl: kontribisyon valide ak retrè egzekite
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterType === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tout
          </button>
          <button
            onClick={() => setFilterType('CONTRIBUTION')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterType === 'CONTRIBUTION'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kontribisyon
          </button>
          <button
            onClick={() => setFilterType('WITHDRAWAL')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterType === 'WITHDRAWAL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Retrè
          </button>
        </div>
      </div>

      {/* Transaction List */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
          <p className="text-sm font-medium text-slate-600">Pa gen tranzaksyon pou kounye a</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Lè yon kontribisyon apwouve oswa yon retrè egzekite, l ap parèt la a.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filtered.map((t) => {
            const isIncoming = t.type === 'CONTRIBUTION';

            return (
              <div
                key={t.id}
                className="p-4 sm:p-5 hover:bg-slate-50/50 transition flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                      isIncoming
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isIncoming ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{t.title}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{t.description}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {formatDateCreole(t.transaction_date, 'long')}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`text-sm sm:text-base font-bold font-mono ${
                      isIncoming ? 'text-emerald-700' : 'text-slate-900'
                    }`}
                  >
                    {isIncoming ? '+' : '-'}
                    {formatBRL(t.amount_centavos)}
                  </div>
                  <div className="mt-1">
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
