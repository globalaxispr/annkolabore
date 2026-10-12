'use client';

import React from 'react';
import { UnifiedTransactionItem } from '@/lib/repository';
import { formatBRL, formatDateCreole } from '@/lib/formatters';
import { StatusBadge } from './StatusBadge';
import { ArrowDownLeft, Clock, ShieldCheck } from 'lucide-react';

interface UnifiedTransactionFeedProps {
  transactions: UnifiedTransactionItem[];
}

export const UnifiedTransactionFeed: React.FC<UnifiedTransactionFeedProps> = ({
  transactions,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Istwa Tranzaksyon ki Apwouve yo
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Aktivite ofisyèl: tout kontribisyon valide ak apwouve pa trezorye a
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100/60">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Transparans Total
        </div>
      </div>

      {/* Transaction List */}
      {transactions.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
          <p className="text-sm font-medium text-slate-600">Pa gen tranzaksyon pou kounye a</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Lè yon kontribisyon apwouve, l ap parèt la a dirèkteman.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {transactions.map((t) => {
            const dateStr = t.timestamp || t.date || '';

            return (
              <div
                key={t.id}
                className="p-4 sm:p-5 hover:bg-slate-50/50 transition flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-700">
                    <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{t.title}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {t.subtitle || (t.method ? `Peman: ${t.method}` : 'Kontribisyon')}
                    </div>
                    {dateStr && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {formatDateCreole(dateStr, 'long')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm sm:text-base font-bold font-mono text-emerald-700">
                    +{formatBRL(t.amount_centavos)}
                  </div>
                  <div className="mt-1">
                    <StatusBadge status={t.status || 'APPROVED'} />
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
