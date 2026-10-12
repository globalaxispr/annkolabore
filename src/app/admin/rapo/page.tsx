'use client';

import React, { useEffect, useState } from 'react';
import { demoStorage } from '@/lib/demo-storage';
import { repository } from '@/lib/repository';
import { FinancialSummary, ContributionSubmission, ExpenseRecord } from '@/lib/types';
import { formatBRL, formatDateCreole } from '@/lib/formatters';
import {
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Printer,
  FileCheck2,
} from 'lucide-react';

export default function FinancialReportsPage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [submissions, setSubmissions] = useState<ContributionSubmission[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const sum = await repository.getFinancialSummary();
      const s = await repository.getAllSubmissions();
      const e = await repository.getAllExpenses();
      setSummary(sum);
      setSubmissions(s.filter((item) => item.status === 'APPROVED'));
      setExpenses(e);
      setLoading(false);
    }
    load();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            Transparans & Odit
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
            Rapò Finansye
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Bilan konplè tout fon ki rantre ak tout depans ki fèt pou legliz la
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
        >
          <Printer className="w-4 h-4" />
          Enprime Rapò a
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Total Kontribisyon Apwouve
            </span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {formatBRL(summary.total_contributions_centavos)}
            </div>
            <p className="text-xs text-slate-400 mt-1">{submissions.length} peman valide</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Total Depans
            </span>
            <div className="text-2xl font-bold text-rose-600 mt-1">
              {formatBRL(summary.total_expenses_centavos)}
            </div>
            <p className="text-xs text-slate-400 mt-1">{expenses.length} depans anrejistre</p>
          </div>

          <div className="bg-emerald-600 text-white p-5 rounded-2xl shadow-xs">
            <span className="text-xs font-semibold uppercase text-emerald-100">
              Balans Nèt Disponib
            </span>
            <div className="text-3xl font-extrabold mt-1">
              {formatBRL(summary.current_balance_centavos)}
            </div>
            <p className="text-xs text-emerald-100 mt-1">Lajan aktyèl nan kont gwoup la</p>
          </div>
        </div>
      )}

      {/* Breakdown Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Approved Contributions List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
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
                    <div className="text-slate-400">Travay: {formatDateCreole(s.work_date)}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-emerald-700">
                      +{formatBRL(s.amount_centavos)}
                    </span>
                    <div className="text-[10px] text-slate-400">{s.payment_method}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-rose-600" />
            Depans Anrejistre yo
          </h2>
          {expenses.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Pa gen depans</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
              {expenses.map((e) => (
                <div key={e.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{e.description}</div>
                    <div className="text-slate-400">
                      {formatDateCreole(e.expense_date)} • {e.category}
                    </div>
                  </div>
                  <div className="text-right font-extrabold text-rose-600">
                    -{formatBRL(e.amount_centavos)}
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
