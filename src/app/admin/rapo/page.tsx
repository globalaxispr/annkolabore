'use client';

import React, { useEffect, useState } from 'react';
import { repository } from '@/lib/repository';
import { FinancialSummary, ContributionSubmission, ScheduledWithdrawal } from '@/lib/types';
import { formatBRL, formatDateCreole } from '@/lib/formatters';
import { StatusBadge } from '@/components/StatusBadge';
import {
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  Printer,
  CalendarClock,
  ArrowDownLeft,
} from 'lucide-react';

export default function FinancialReportsPage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [submissions, setSubmissions] = useState<ContributionSubmission[]>([]);
  const [withdrawals, setWithdrawals] = useState<ScheduledWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const sum = await repository.getFinancialSummary();
      const s = await repository.getAllSubmissions();
      const w = await repository.getAllWithdrawals();
      setSummary(sum);
      setSubmissions(s.filter((item) => item.status === 'APPROVED'));
      setWithdrawals(w);
      setLoading(false);
    }
    load();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const executedWithdrawals = withdrawals.filter((w) => w.status === 'Egzekite');
  const scheduledWithdrawals = withdrawals.filter(
    (w) => w.status === 'Pwograme' || w.status === 'An Atant'
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 md:pb-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            <BarChart3 className="w-3.5 h-3.5 text-slate-600" />
            Transparans & Odit Finansye
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
            Rapò Finansye
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Bilan ofisyèl tout kontribisyon chofè yo ak tout retrè egzekite pou legliz la
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-800 transition"
        >
          <Printer className="w-4 h-4" />
          Enprime Rapò a
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Balans Disponib */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Balans Disponib
            </span>
            <div className="text-3xl font-black font-mono">
              {formatBRL(summary.current_balance_centavos)}
            </div>
            <p className="text-xs text-slate-300">
              Kòb aktyèl ki disponib nan kès la
            </p>
          </div>

          {/* Total Kontribisyon */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Kontribisyon
            </span>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {formatBRL(summary.total_contributions_centavos)}
            </div>
            <p className="text-xs text-slate-400">
              {submissions.length} peman chofè apwouve
            </p>
          </div>

          {/* Total Retrè Egzekite */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Retrè Egzekite
            </span>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {formatBRL(summary.total_withdrawals_centavos)}
            </div>
            <p className="text-xs text-slate-400">
              {executedWithdrawals.length} retrè ofisyèl
            </p>
          </div>
        </div>
      )}

      {/* Breakdown Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Approved Contributions List */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6">
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            Kontribisyon Valide yo
          </h2>
          {submissions.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Pa gen done</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
              {submissions.map((s) => (
                <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{s.driver_name}</div>
                    <div className="text-slate-400 text-[11px]">
                      Travay: {formatDateCreole(s.work_date)} • Peman: {s.payment_method}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-700 font-mono">
                      +{formatBRL(s.amount_centavos)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Executed Withdrawals List */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6">
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-slate-600" />
            Retrè Egzekite yo
          </h2>
          {executedWithdrawals.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Pa gen okenn retrè ki egzekite
            </p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
              {executedWithdrawals.map((w) => (
                <div key={w.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{w.description}</div>
                    <div className="text-slate-400 text-[11px]">
                      Egzekite: {formatDateCreole(w.executed_at || w.scheduled_date)}
                    </div>
                  </div>
                  <div className="text-right font-bold text-slate-900 font-mono">
                    -{formatBRL(w.amount_centavos)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
