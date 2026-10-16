'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { repository } from '@/lib/repository';
import { ContributionSubmission, UserProfile } from '@/lib/types';
import { formatBRL, formatDateCreole, formatTime } from '@/lib/formatters';
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
  Info,
  RefreshCw,
  Receipt,
  FileCheck2,
  ShieldCheck,
} from 'lucide-react';

export default function DriverDashboardPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [submissions, setSubmissions] = useState<ContributionSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setErrorMsg(null);
    try {
      const user = await repository.getAuthUser();
      setCurrentUser(user);
      if (user) {
        const userSubs = await repository.getDriverSubmissions(user.id);
        setSubmissions(userSubs);
        setLastRefreshed(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err: unknown) {
      console.error('Erè pandan lekti kontribisyon chofè a:', err);
      setErrorMsg((err as Error)?.message || 'Pa ka jwenn done ou yo kounye a.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Set up Realtime subscriptions for auto-update when admin approves/rejects
    let unsubscribeDriver: (() => void) | undefined;
    repository.getAuthUser().then((user) => {
      if (user) {
        unsubscribeDriver = repository.subscribeToDriverSubmissions(user.id, () => {
          loadData();
        });
      }
    });

    // Also listen to global balance updates
    const unsubscribeGlobal = repository.subscribeToGlobalBalance(() => {
      loadData();
    });

    return () => {
      if (unsubscribeDriver) unsubscribeDriver();
      unsubscribeGlobal();
    };
  }, [loadData]);

  // Exact integer cents financial calculations per business rules
  const approvedSubs = submissions.filter(
    (s) => (s.status || '').toLowerCase() === 'approved'
  );
  const pendingSubs = submissions.filter(
    (s) => (s.status || '').toLowerCase() === 'pending'
  );
  const rejectedSubs = submissions.filter(
    (s) => (s.status || '').toLowerCase() === 'rejected'
  );

  const totalApprovedCentavos = approvedSubs.reduce(
    (sum, s) => sum + Math.round(Number(s.amount_centavos ?? s.amount_cents ?? 0)),
    0
  );
  const totalPendingCentavos = pendingSubs.reduce(
    (sum, s) => sum + Math.round(Number(s.amount_centavos ?? s.amount_cents ?? 0)),
    0
  );

  const latestApproved = approvedSubs[0] || null;
  const firstName = currentUser?.full_name ? currentUser.full_name.split(' ')[0] : 'Chofè';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 md:pb-6">
      {/* Personalized Greeting Card (Clean Fintech Header) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Kont Pèsonèl Manm
            </span>
            {lastRefreshed && (
              <span className="text-[11px] text-slate-400">
                • Mizajou: {lastRefreshed}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Bonjou, {firstName}!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {currentUser?.email} • Mèsi pou devouman ou ak patisipasyon ou nan kominote a.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            title="Rafrechi done yo"
            aria-label="Rafrechi kontribisyon mwen yo"
            className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <Link
            href="/chofe/soumet"
            prefetch={false}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-bold shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Soumèt Kontribisyon</span>
          </Link>
        </div>
      </div>

      {/* Global Fund Total (Visible for transparency) */}
      <GlobalContributionBalance
        variant="compact"
        label="Kantite Kòb ki Ranmase (Fon Global)"
      />

      {/* Member Personal Financial Metrics Cards (A, B, C, D) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card A: TOTAL APPROVED CONTRIBUTIONS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total kontribisyon mwen ki apwouve
            </span>
            <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            {formatBRL(totalApprovedCentavos)}
          </div>
          <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            {approvedSubs.length} kontribisyon apwouve ofisyèlman
          </p>
        </div>

        {/* Card B: PENDING CONTRIBUTIONS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Kontribisyon k ap tann apwobasyon
            </span>
            <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 font-mono tracking-tight">
            {formatBRL(totalPendingCentavos)}
          </div>
          <p className="text-xs text-slate-500">
            {pendingSubs.length > 0
              ? `${pendingSubs.length} kontribisyon k ap tann verifikasyon`
              : 'Pa gen okenn kontribisyon an atant'}
          </p>
        </div>

        {/* Card C / D: LATEST APPROVED & CONTRIBUTION COUNT */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Dènye Kontribisyon Apwouve
            </span>
            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            {latestApproved ? formatBRL(latestApproved.amount_centavos) : 'R$ 0,00'}
          </div>
          <p className="text-xs text-slate-500">
            {latestApproved
              ? `Dat: ${formatDateCreole(latestApproved.work_date)}`
              : 'Poko gen kontribisyon apwouve'}
          </p>
        </div>
      </div>

      {/* Voluntary Contribution Rule Explanation Banner */}
      <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3 text-xs text-slate-700 leading-relaxed shadow-xs">
        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900 font-bold">Règ Kontribisyon an:</strong> Ou lib pou kontribye nenpòt montan ou kapab. Ou ka fè plizyè kontribisyon nan menm jou a. Pa gen montan minimòm ni limit sou kantite fwa ou ka kontribye. Si ou pa travay yon jou, ou pa gen okenn obligasyon ni dèt.
        </div>
      </div>

      {/* Error state if any */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => loadData(true)}
            className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition"
          >
            Eseye Ankò
          </button>
        </div>
      )}

      {/* Card C: CONTRIBUTION HISTORY */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Istwa Kontribisyon Mwen Yo
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Lis tout kontribisyon ou soumèt ak estati verifikasyon yo
            </p>
          </div>
          {submissions.length > 0 && (
            <span className="text-xs font-semibold text-slate-500 self-start sm:self-auto">
              Total soumèt: <strong className="text-slate-800">{submissions.length}</strong>
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-emerald-600" />
            Chajman done finansye ou yo...
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-14 px-6 text-center text-slate-500 space-y-3">
            <Clock className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">
              Ou poko fè okenn kontribisyon. Lè ou pare, ou kapab kòmanse ak nenpòt montan ou vle.
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Chak kontribisyon anrejistre kòm annatant epi l ap ajoute nan total apwouve ou lepli vit ke responsab la valide li.
            </p>
            <div className="pt-2">
              <Link
                href="/chofe/soumet"
                prefetch={false}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                Soumèt premye kontribisyon ou
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {submissions.map((sub) => {
              const statusLower = (sub.status || '').toLowerCase();
              const hasReceipt = Boolean(sub.receipt_url || sub.receipt_path);
              const submissionTimeStr = sub.created_at
                ? `${formatDateCreole(sub.created_at)} ${formatTime(sub.created_at) ? `a ${formatTime(sub.created_at)}` : ''}`
                : formatDateCreole(sub.payment_date);

              return (
                <div key={sub.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition space-y-2.5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm truncate">
                          Travay: {formatDateCreole(sub.work_date, 'long')}
                        </div>
                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          <span>
                            Peman: <strong className="text-slate-700">{formatDateCreole(sub.payment_date)}</strong>
                          </span>
                          <span>•</span>
                          <span>Metòd: {sub.payment_method}</span>
                          <span>•</span>
                          <span className="text-slate-400">
                            Soumèt: {submissionTimeStr}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <div className="text-base sm:text-lg font-black text-slate-900 font-mono tracking-tight">
                        +{formatBRL(sub.amount_centavos)}
                      </div>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Receipt indicator */}
                        {hasReceipt ? (
                          <span
                            title="Resi tache ak kontribisyon sa a"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200"
                          >
                            <FileCheck2 className="w-3 h-3 text-emerald-600" />
                            Resi
                          </span>
                        ) : (
                          <span
                            title="San resi tache"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-normal text-slate-400"
                          >
                            San resi
                          </span>
                        )}
                        <StatusBadge
                          status={
                            statusLower === 'approved'
                              ? 'Apwouve'
                              : statusLower === 'rejected'
                              ? 'Refize'
                              : 'Annatant'
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {sub.note && (
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <strong>Nòt:</strong> {sub.note}
                    </div>
                  )}

                  {statusLower === 'rejected' && sub.rejection_reason && (
                    <div className="text-xs text-rose-800 bg-rose-50 p-3 rounded-xl border border-rose-200 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold">Kontribisyon sa a pa te apwouve:</span> {sub.rejection_reason}
                        <p className="text-[11px] text-rose-700 mt-0.5">
                          Kontakte responsab fon an si ou bezwen plis enfòmasyon.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
