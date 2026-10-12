'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { demoStorage } from '@/lib/demo-storage';
import { repository } from '@/lib/repository';
import { ContributionSubmission, UserProfile } from '@/lib/types';
import { formatBRL, formatDateCreole } from '@/lib/formatters';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Car,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  CreditCard,
  FileText,
} from 'lucide-react';

export default function DriverDashboardPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [submissions, setSubmissions] = useState<ContributionSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const user = demoStorage.getCurrentUser();
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
  const rejectedSubs = submissions.filter((s) => s.status === 'REJECTED');

  const totalContributedCentavos = approvedSubs.reduce((sum, s) => sum + s.amount_centavos, 0);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-xl font-bold shadow-sm shadow-emerald-600/30">
            {currentUser?.full_name ? currentUser.full_name.charAt(0) : 'C'}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {currentUser?.full_name || 'Kont Mwen'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {currentUser?.email} • Wòl: <span className="font-semibold text-emerald-700">Chofè</span>
            </p>
          </div>
        </div>

        <Link
          href="/chofe/soumet"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition"
        >
          <PlusCircle className="w-4 h-4" />
          Soumèt Kontribisyon
        </Link>
      </div>

      {/* Driver Personal Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Total Ou Kontribye
          </span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2">
            {formatBRL(totalContributedCentavos)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {approvedSubs.length} jou travay apwouve
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Kontribisyon an Atant
          </span>
          <div className="text-2xl font-extrabold text-amber-600 mt-2">
            {pendingSubs.length}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ap tann verifikasyon trezorye a
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Kontribisyon Refize
          </span>
          <div className="text-2xl font-extrabold text-rose-600 mt-2">
            {rejectedSubs.length}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {rejectedSubs.length > 0 ? 'Gade rezon an anba a pou korije li' : 'Pa gen okenn refi'}
          </p>
        </div>
      </div>

      {/* Personal Submissions History */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Istwa Kontribisyon Ou Yo</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tout kontribisyon ou soumèt pou jou ou te travay yo
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse">
            Chajman done yo...
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium text-slate-600">Ou poko soumèt okenn kontribisyon</p>
            <Link
              href="/chofe/soumet"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Soumèt premye kontribisyon ou
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {submissions.map((sub) => (
              <div key={sub.id} className="p-5 hover:bg-slate-50/50 transition space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">
                        Dat Travay: {formatDateCreole(sub.work_date, 'long')}
                      </div>
                      <div className="text-xs text-slate-500">
                        Peman: {formatDateCreole(sub.payment_date)} • Metòd: {sub.payment_method}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="text-base font-bold text-slate-900">
                        {formatBRL(sub.amount_centavos)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Soumèt: {formatDateCreole(sub.created_at)}
                      </div>
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>
                </div>

                {/* Additional details: note or rejection reason */}
                {sub.note && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-start gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span>Nòt ou te mete: {sub.note}</span>
                  </div>
                )}

                {sub.status === 'REJECTED' && sub.rejection_reason && (
                  <div className="text-xs text-rose-800 bg-rose-50 p-3 rounded-xl border border-rose-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold">Rezon Refi:</span> {sub.rejection_reason}
                      <p className="mt-1 text-[11px] text-rose-700">
                        Ou ka korije enfòmasyon sa yo epi soumèt kontribisyon an ankò.
                      </p>
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
