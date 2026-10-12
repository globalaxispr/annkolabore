'use client';

import React, { useEffect, useState } from 'react';
import { repository } from '@/lib/repository';
import { ContributionSubmission, UserProfile } from '@/lib/types';
import { formatBRL, formatDateCreole, formatTime } from '@/lib/formatters';
import { StatusBadge } from '@/components/StatusBadge';
import {
  FileCheck2,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Calendar,
  CreditCard,
  FileText,
  X,
} from 'lucide-react';

export default function PendingApprovalsPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [pendingList, setPendingList] = useState<ContributionSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [detailModalItem, setDetailModalItem] = useState<ContributionSubmission | null>(null);
  const [approveConfirmItem, setApproveConfirmItem] = useState<ContributionSubmission | null>(null);
  const [rejectItem, setRejectItem] = useState<ContributionSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Notifications
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadPending = async () => {
    setLoading(true);
    const authUser = await repository.getAuthUser();
    setCurrentUser(authUser);
    const list = await repository.getPendingSubmissions();
    setPendingList(list);
    setLoading(false);
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async () => {
    if (!approveConfirmItem || !currentUser) return;
    setActionError(null);

    const result = await repository.approveSubmission(approveConfirmItem.id, currentUser.id);
    if (!result.success) {
      setActionError(result.error || 'Erè pandan apwobasyon an.');
    } else {
      setActionSuccess(
        `Kontribisyon ${formatBRL(approveConfirmItem.amount_centavos)} pou ${approveConfirmItem.driver_name} apwouve avèk siksè!`
      );
      setApproveConfirmItem(null);
      await loadPending();
    }
  };

  const handleReject = async () => {
    if (!rejectItem || !currentUser) return;
    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      setActionError('Tanpri mete yon rezon ki gen omwen 5 karaktè.');
      return;
    }
    setActionError(null);

    const result = await repository.rejectSubmission(
      rejectItem.id,
      currentUser.id,
      rejectionReason.trim()
    );

    if (!result.success) {
      setActionError(result.error || 'Erè pandan refi a.');
    } else {
      setActionSuccess(`Kontribisyon ${rejectItem.driver_name} la refize.`);
      setRejectItem(null);
      setRejectionReason('');
      await loadPending();
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Page Title & Stats */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Verifikasyon Trezorye
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
            Kontribisyon an Atant
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Revize, verifye prèv peman, epi apwouve oswa refize kontribisyon chofè yo
          </p>
        </div>

        <div className="bg-amber-50 px-5 py-3 rounded-2xl border border-amber-100 flex items-center gap-3">
          <div className="text-2xl font-black text-amber-700">{pendingList.length}</div>
          <div className="text-xs font-semibold text-amber-900 leading-tight">
            soumisyon k ap tann apwobasyon
          </div>
        </div>
      </div>

      {/* Admin check alert */}
      {!isAdmin && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-xs sm:text-sm text-rose-800 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong>Aksè Refize:</strong> Ou pa gen privilèj administratè pou fè apwobasyon oswa refi. Sèlman yon administratè otorize ka valide kontribisyon sa yo.
          </div>
        </div>
      )}

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pending Items List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Chajman kontribisyon an atant yo...</div>
        ) : pendingList.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-70" />
            <p className="text-base font-semibold text-slate-700">
              Pa gen okenn kontribisyon an atant kounye a!
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Tout kontribisyon chofè yo deja trete pa trezorye a.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingList.map((item) => (
              <div
                key={item.id}
                className="p-5 sm:p-6 hover:bg-slate-50/50 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-slate-900">{item.driver_name}</span>
                    <span className="text-sm font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100">
                      {formatBRL(item.amount_centavos)}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Dat Travay: <strong className="text-slate-700">{formatDateCreole(item.work_date)}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      Dat Peman: <strong className="text-slate-700">{formatDateCreole(item.payment_date)}</strong>
                    </span>
                    <span>
                      Metòd: <strong className="text-slate-700">{item.payment_method}</strong>
                    </span>
                    <span>
                      Soumèt: {formatDateCreole(item.created_at)} {formatTime(item.created_at)}
                    </span>
                  </div>

                  {item.transaction_ref && (
                    <div className="text-xs text-slate-600">
                      Nimewo Ref: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">{item.transaction_ref}</code>
                    </div>
                  )}

                  {item.note && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      Nòt: {item.note}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0">
                  <button
                    onClick={() => setDetailModalItem(item)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Gade Detay
                  </button>

                  <button
                    disabled={!isAdmin}
                    onClick={() => setApproveConfirmItem(item)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition shadow-xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Apwouve
                  </button>

                  <button
                    disabled={!isAdmin}
                    onClick={() => {
                      setRejectItem(item);
                      setRejectionReason('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-50 transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Refize
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal: Apwouve */}
      {approveConfirmItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Konfime Apwobasyon Kontribisyon an
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Èske ou verifye epi konfime ke lajan sa a te reyèlman resevwa sou kont legliz la?
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-1.5 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Chofè:</span>
                <span className="font-bold text-slate-800">{approveConfirmItem.driver_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Montan:</span>
                <span className="font-bold text-emerald-700">
                  {formatBRL(approveConfirmItem.amount_centavos)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dat Travay:</span>
                <span className="font-semibold text-slate-800">
                  {formatDateCreole(approveConfirmItem.work_date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Metòd:</span>
                <span className="font-semibold text-slate-800">
                  {approveConfirmItem.payment_method}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              * Lè ou klike Apwouve, montan sa a ap ajoute yon sèl fwa sou balans ofisyèl la.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setApproveConfirmItem(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Anile
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
              >
                Konfime & Apwouve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Refize */}
      {rejectItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Refize Kontribisyon
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tanpri eksplike chofè a poukisa peman sa a pa ka apwouve (pa egzanp: prèv pa klè, lajan pa rive sou kont lan).
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-600">
                Rezon Refi a *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Mete rezon an la a (omwen 5 karaktè)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRejectItem(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Anile
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition"
              >
                Refize Kontribisyon Sa a
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal: Gade Detay */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Detay Soumisyon Kontribisyon
              </h3>
              <button
                onClick={() => setDetailModalItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Chofè:</span>
                <span className="font-bold text-slate-900">{detailModalItem.driver_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Montan:</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {formatBRL(detailModalItem.amount_centavos)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Dat Travay la:</span>
                <span className="font-semibold text-slate-800">
                  {formatDateCreole(detailModalItem.work_date, 'long')}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Dat Peman an:</span>
                <span className="font-semibold text-slate-800">
                  {formatDateCreole(detailModalItem.payment_date, 'long')}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Metòd Peman:</span>
                <span className="font-semibold text-slate-800">
                  {detailModalItem.payment_method}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Referans:</span>
                <span className="text-slate-800">{detailModalItem.transaction_ref || 'Pa genyen'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Dat Soumisyon:</span>
                <span className="text-slate-800">
                  {formatDateCreole(detailModalItem.created_at)} {formatTime(detailModalItem.created_at)}
                </span>
              </div>

              {detailModalItem.receipt_url && (
                <div className="py-2">
                  <span className="text-slate-500 block mb-1">Prèv Peman / Resi:</span>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-600 font-mono text-[11px]">
                    {detailModalItem.receipt_url}
                  </div>
                </div>
              )}

              {detailModalItem.note && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[11px] mb-0.5">Nòt chofè a:</span>
                  <p className="text-slate-800">{detailModalItem.note}</p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setDetailModalItem(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Fèmen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
