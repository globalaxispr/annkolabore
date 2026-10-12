'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { repository } from '@/lib/repository';
import { FinancialSummary, ContributionSubmission, ScheduledWithdrawal } from '@/lib/types';
import { formatBRL } from '@/lib/formatters';
import {
  FileCheck2,
  CalendarClock,
  Users,
  BarChart3,
  History,
  Shield,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function AdminDashboardIndex() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [pendingSubs, setPendingSubs] = useState<ContributionSubmission[]>([]);
  const [scheduledWithdrawals, setScheduledWithdrawals] = useState<ScheduledWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const sum = await repository.getFinancialSummary();
      const subs = await repository.getPendingSubmissions();
      const sched = await repository.getScheduledWithdrawals();
      setSummary(sum);
      setPendingSubs(subs);
      setScheduledWithdrawals(sched);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 md:pb-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            <Shield className="w-3.5 h-3.5 text-slate-700" />
            Espas Administratè & Trezorye
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
            Jesyon Finansye Gwoup la
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Apwouve kontribisyon, planifye retrè, epi verifye bilan finansye ofisyèl la
          </p>
        </div>

        {/* Available Balance Pill */}
        {summary && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 min-w-[220px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Balans Disponib
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">
              {formatBRL(summary.current_balance_centavos)}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Kòb ofisyèl nan kès la
            </span>
          </div>
        )}
      </div>

      {/* Action Hub Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Kontribisyon an Atant */}
        <Link
          href="/admin/atant"
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs hover:border-slate-300 transition group space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            {pendingSubs.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                {pendingSubs.length} nouvo
              </span>
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Kontribisyon an Atant</h2>
            <p className="text-xs text-slate-500 mt-1">
              Revize, konfime peman bankè, epi apwouve oswa refize kontribisyon chofè yo.
            </p>
          </div>
        </Link>

        {/* Retrè Pwograme */}
        <Link
          href="/admin/retre"
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs hover:border-slate-300 transition group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <CalendarClock className="w-5 h-5" />
            </div>
            {scheduledWithdrawals.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white">
                {scheduledWithdrawals.length} pwograme
              </span>
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Retrè Pwograme</h2>
            <p className="text-xs text-slate-500 mt-1">
              Planifye retrè davans epi egzekite yo ofisyèlman lè lajan an retire.
            </p>
          </div>
        </Link>

        {/* Manm Gwoup la */}
        <Link
          href="/admin/manm"
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs hover:border-slate-300 transition group space-y-3"
        >
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Manm Gwoup la</h2>
            <p className="text-xs text-slate-500 mt-1">
              Gade lis chofè yo, total chak chofè kontribye, epi anrejistre antre dirèk.
            </p>
          </div>
        </Link>

        {/* Rapò Finansye */}
        <Link
          href="/admin/rapo"
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs hover:border-slate-300 transition group space-y-3"
        >
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Rapò Finansye</h2>
            <p className="text-xs text-slate-500 mt-1">
              Bilan konplè tout kontribisyon ak retrè, total mwa, ak opsyon enprime.
            </p>
          </div>
        </Link>

        {/* Istwa Odit */}
        <Link
          href="/admin/odit"
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs hover:border-slate-300 transition group space-y-3"
        >
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Istwa Odit</h2>
            <p className="text-xs text-slate-500 mt-1">
              Tras enchanjab tout aksyon trezorye a (apwobasyon, refi, retrè, modifikasyon).
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
