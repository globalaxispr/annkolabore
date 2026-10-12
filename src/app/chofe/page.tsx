'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { repository } from '@/lib/repository';
import { ContributionSubmission, UserProfile } from '@/lib/types';
import { formatBRL, formatDateCreole } from '@/lib/formatters';
import { StatusBadge } from '@/components/StatusBadge';
import { GlobalContributionBalance } from '@/components/GlobalContributionBalance';
import {
  Car,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  FileText,
  ArrowDownLeft,
} from 'lucide-react';

export default function DriverDashboardPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [submissions, setSubmissions] = useState<ContributionSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const user = await repository.getAuthUser();
      setCurrentUser(user);
      if (user) {
        const userSubs = await repository.getDriverSubmissions(user.id);
        setSubmissions(userSubs);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const approvedSubs = submissions.filter((s) => s.status === 'APPROVED');
  const pendingSubs = submissions.filter((s) => s.status === 'PENDING');
  const latestApproved = approvedSubs[0] || null;

  const totalContributedCentavos = approvedSubs.reduce((sum, s) => sum + s.amount_centavos, 0);

  // Personalized Greeting in Haitian Creole
  const firstName = currentUser?.full_name ? currentUser.full_name.split(' ')[0] : 'Chofè';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 md:pb-6">
      {/* Personalized Greeting Card (Nubank-style) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Kont Pèsonèl Chofè
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Bonjou, {firstName}!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {currentUser?.email} • Mèsi pou devouman ou pou legliz la
          </p>
        </div>

        <Link
          href="/chofe/soumet"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-bold shadow-xs transition"
        >
          <PlusCircle className="w-4 h-4 text-emerald-400" />
          Soumèt Kontribisyon
        </Link>
      </div>

      {/* Global Fund Total (Visible throughout the application) */}
      <GlobalContributionBalance
        variant="compact"
        label="Kantite Kòb ki Ranmase (Fon Global)"
      />

      {/* Driver Personal Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Personal total */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Ou Kontribye
          </span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {formatBRL(totalContributedCentavos)}
          </div>
          <p className="text-[11px] text-slate-400">
            {approvedSubs.length} jou travay apwouve
          </p>
        </div>

        {/* Pending count */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Kontribisyon an Atant
          </span>
          <div className="text-2xl font-extrabold text-amber-700 font-mono">
            {pendingSubs.length}
          </div>
          <p className="text-[11px] text-slate-400">
            {pendingSubs.length > 0 ? 'Ap tann verifikasyon' : 'Pa gen anyen an atant'}
          </p>
        </div>

        {/* Latest approved */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Dènye Kontribisyon Apwouve
          </span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {latestApproved ? formatBRL(latestApproved.amount_centavos) : 'R$ 0,00'}
          </div>
          <p className="text-[11px] text-slate-400">
            {latestApproved ? formatDateCreole(latestApproved.work_date) : 'Poko genyen'}
          </p>
        </div>
      </div>

      {/* Compact Activity Feed */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Istwa Kontribisyon Ou Yo</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tout kontribisyon ou soumèt pou jou ou te travay yo
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Chajman done yo...</div>
        ) : submissions.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold text-slate-700">Ou poko soumèt okenn kontribisyon</p>
            <Link
              href="/chofe/soumet"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold hover:underline"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Soumèt premye kontribisyon ou
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {submissions.map((sub) => (
              <div key={sub.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition space-y-2">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        Travay: {formatDateCreole(sub.work_date, 'long')}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Peman: {formatDateCreole(sub.payment_date)} • Metòd: {sub.payment_method}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-bold text-slate-900 font-mono">
                      +{formatBRL(sub.amount_centavos)}
                    </div>
                    <div className="mt-0.5">
                      <StatusBadge status={sub.status} />
                    </div>
                  </div>
                </div>

                {sub.note && (
                  <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    Nòt: {sub.note}
                  </div>
                )}

                {sub.status === 'REJECTED' && sub.rejection_reason && (
                  <div className="text-xs text-rose-800 bg-rose-50 p-3 rounded-xl border border-rose-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold">Rezon Refi:</span> {sub.rejection_reason}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
