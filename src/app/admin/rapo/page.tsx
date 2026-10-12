'use client';

import React, { useEffect, useState } from 'react';
import { repository } from '@/lib/repository';
import { FinancialSummary, ContributionSubmission } from '@/lib/types';
import { formatBRL, formatDateCreole } from '@/lib/formatters';
import { StatusBadge } from '@/components/StatusBadge';
import { GlobalContributionBalance } from '@/components/GlobalContributionBalance';
import {
  BarChart3,
  Printer,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  Users,
} from 'lucide-react';

export default function FinancialReportsPage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [submissions, setSubmissions] = useState<ContributionSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const sum = await repository.getFinancialSummary();
        const s = await repository.getAllSubmissions();
        setSummary(sum);
        setSubmissions(s.filter((item) => item.status === 'APPROVED'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handlePrint = () => {
    window.print();
  };

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
            Bilan ofisyèl tout kontribisyon chofè yo valide epi apwouve pou legliz la
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-800 transition"
        >
          <Printer className="w-4 h-4" />
          Enprime Rapò a
        </button>
      </div>

      {/* Global Contribution Balance Card */}
      <GlobalContributionBalance
        variant="compact"
        label="Kantite Kòb ki Ranmase (Fon Global Legliz la)"
      />

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Kontribisyon Mwa Sa A */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Kontribisyon Mwa Sa A
            </span>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {formatBRL(summary.month_contributions_centavos)}
            </div>
            <p className="text-xs text-slate-400">
              Total antre valide pou mwa an kouran an
            </p>
          </div>

          {/* Kontribisyon Jounen Jodi A */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Kontribisyon Jounen Jodi A
            </span>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {formatBRL(summary.today_contributions_centavos)}
            </div>
            <p className="text-xs text-slate-400">
              Antre anrejistre pou jodi a
            </p>
          </div>

          {/* Manm Chofè */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Chofè
            </span>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {summary.members_count}
            </div>
            <p className="text-xs text-slate-400">
              Chofè aktif ki anrejistre nan gwoup la
            </p>
          </div>
        </div>
      )}

      {/* Approved Contributions Ledger */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            Tout Kontribisyon Apwouve yo ({submissions.length})
          </h2>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            Ofisyèl & Rekonsilye
          </span>
        </div>

        {submissions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Pa gen okenn kontribisyon apwouve pou kounye a.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Chofè</th>
                  <th className="py-2.5 px-3">Dat Travay</th>
                  <th className="py-2.5 px-3">Dat Peman</th>
                  <th className="py-2.5 px-3">Metòd</th>
                  <th className="py-2.5 px-3 text-right">Montan</th>
                  <th className="py-2.5 px-3 text-center">Eta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {s.driver_name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {formatDateCreole(s.work_date)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {formatDateCreole(s.payment_date)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {s.payment_method}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 text-right">
                      {formatBRL(s.amount_centavos)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
