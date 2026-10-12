'use client';

import React, { useEffect, useState } from 'react';
import { demoStorage } from '@/lib/demo-storage';
import { repository } from '@/lib/repository';
import { ScheduledWithdrawal, UserProfile, FinancialSummary } from '@/lib/types';
import { formatBRL, formatDateCreole } from '@/lib/formatters';
import { StatusBadge } from '@/components/StatusBadge';
import {
  CalendarClock,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  X,
  TrendingDown,
  Info,
} from 'lucide-react';

export default function ScheduledWithdrawalsPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [withdrawals, setWithdrawals] = useState<ScheduledWithdrawal[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Schedule Form State
  const [description, setDescription] = useState('');
  const [amountBRL, setAmountBRL] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [note, setNote] = useState('');

  // Modals
  const [showScheduleConfirmModal, setShowScheduleConfirmModal] = useState(false);
  const [executeConfirmItem, setExecuteConfirmItem] = useState<ScheduledWithdrawal | null>(null);
  const [cancelItem, setCancelItem] = useState<ScheduledWithdrawal | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Status feedback
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const user = demoStorage.getCurrentUser();
    setCurrentUser(user);
    const wList = await repository.getAllWithdrawals();
    const sum = await repository.getFinancialSummary();
    setWithdrawals(wList);
    setSummary(sum);
    // Initialize default date in useEffect to prevent SSR prerender mismatch
    if (!scheduledDate) {
      setScheduledDate(new Date().toISOString().split('T')[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  // Open schedule confirmation
  const handleOpenScheduleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackSuccess(null);

    const cleanNum = parseFloat(amountBRL.replace(',', '.'));
    if (isNaN(cleanNum) || cleanNum <= 0) {
      setFeedbackError('Tanpri antre yon montan retrè ki valab.');
      return;
    }

    if (!description || description.trim().length < 3) {
      setFeedbackError('Deskripsyon retrè a dwe gen omwen 3 karaktè.');
      return;
    }

    setShowScheduleConfirmModal(true);
  };

  // Submit Schedule
  const handleConfirmSchedule = async () => {
    if (!currentUser) return;
    setSubmitting(true);
    setFeedbackError(null);

    const cleanNum = parseFloat(amountBRL.replace(',', '.'));
    const amountCentavos = Math.round(cleanNum * 100);

    const res = await repository.scheduleWithdrawal({
      admin_id: currentUser.id,
      description: description.trim(),
      amount_centavos: amountCentavos,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime || undefined,
      note: note.trim() || undefined,
    });

    setSubmitting(false);
    setShowScheduleConfirmModal(false);

    if (res.error) {
      setFeedbackError(res.error);
    } else {
      setFeedbackSuccess(
        `Retrè ${formatBRL(amountCentavos)} pou dat ${scheduledDate} pwograme avèk siksè!`
      );
      // Reset form
      setDescription('');
      setAmountBRL('');
      setNote('');
      await loadData();
    }
  };

  // Execute Withdrawal
  const handleExecute = async () => {
    if (!executeConfirmItem || !currentUser) return;
    setSubmitting(true);
    setFeedbackError(null);

    const res = await repository.executeWithdrawal(executeConfirmItem.id, currentUser.id);
    setSubmitting(false);

    if (!res.success) {
      setFeedbackError(res.error || 'Erè pandan egzekisyon retrè a.');
    } else {
      setFeedbackSuccess(
        `Retrè ${formatBRL(executeConfirmItem.amount_centavos)} egzekite avèk siksè! Balans lan diminye.`
      );
      setExecuteConfirmItem(null);
      await loadData();
    }
  };

  // Cancel Withdrawal
  const handleCancel = async () => {
    if (!cancelItem || !currentUser) return;
    if (!cancelReason.trim() || cancelReason.trim().length < 5) {
      setFeedbackError('Tanpri mete yon rezon anilasyon ki gen omwen 5 karaktè.');
      return;
    }
    setSubmitting(true);
    setFeedbackError(null);

    const res = await repository.cancelWithdrawal(
      cancelItem.id,
      currentUser.id,
      cancelReason.trim()
    );
    setSubmitting(false);

    if (!res.success) {
      setFeedbackError(res.error || 'Erè pandan anilasyon retrè a.');
    } else {
      setFeedbackSuccess(`Retrè a anile avèk siksè.`);
      setCancelItem(null);
      setCancelReason('');
      await loadData();
    }
  };

  const pendingWithdrawals = withdrawals.filter(
    (w) => w.status === 'Pwograme' || w.status === 'An Atant'
  );
  const executedWithdrawals = withdrawals.filter((w) => w.status === 'Egzekite');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            <CalendarClock className="w-3.5 h-3.5 text-slate-600" />
            Planifikasyon Retrè & Transparans
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-2">
            Retrè Pwograme
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Pwograme retrè pou donasyon oswa soutyen legliz la. Yon retrè pwograme pa diminye
            balans disponib la jiskaske li egzekite ofisyèlman.
          </p>
        </div>

        {/* Projection summary card */}
        {summary && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 w-full md:w-auto min-w-[240px] space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Balans Disponib Aktyèl:</span>
              <span className="font-bold text-slate-900">
                {formatBRL(summary.current_balance_centavos)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Retrè Pwograme:</span>
              <span className="font-bold text-amber-700">
                -{formatBRL(summary.scheduled_withdrawals_centavos)}
              </span>
            </div>
            <div className="pt-1.5 border-t border-slate-200 flex justify-between items-center">
              <span className="text-[11px] font-medium text-slate-500">
                Balans Apre Retrè (Pwojeksyon):
              </span>
              <span className="text-xs font-black text-slate-800">
                {formatBRL(summary.projected_balance_centavos)}
              </span>
            </div>
          </div>
        )}
      </div>

      {feedbackSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackSuccess}</span>
          </div>
          <button onClick={() => setFeedbackSuccess(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {feedbackError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{feedbackError}</span>
          </div>
          <button onClick={() => setFeedbackError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Form + Pending List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule Withdrawal Form (Admin Only) */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              Pwograme Yon Nouvo Retrè
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Etap 1: Enskri dat ak montan prevwa a
            </p>
          </div>

          <form onSubmit={handleOpenScheduleConfirm} className="space-y-4 text-xs">
            <div>
              <label htmlFor="wth_amount" className="block font-bold uppercase text-slate-600 mb-1">
                Montan (BRL) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">
                  R$
                </span>
                <input
                  id="wth_amount"
                  type="text"
                  required
                  placeholder="50,00"
                  value={amountBRL}
                  onChange={(e) => setAmountBRL(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="wth_date" className="block font-bold uppercase text-slate-600 mb-1">
                Dat Prevwa Pou Retrè a *
              </label>
              <input
                id="wth_date"
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              />
            </div>

            <div>
              <label htmlFor="wth_desc" className="block font-bold uppercase text-slate-600 mb-1">
                Deskripsyon / Rezon Retrè a *
              </label>
              <textarea
                id="wth_desc"
                rows={2}
                required
                placeholder="Egzanp: Donasyon pou achte ekipman son nan legliz la"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              />
            </div>

            <div>
              <label htmlFor="wth_note" className="block font-bold uppercase text-slate-600 mb-1">
                Nòt Sipòtè (Opsyonèl)
              </label>
              <input
                id="wth_note"
                type="text"
                placeholder="Nenpòt detay sou manm oswa reyinyon an"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-[11px] text-slate-500 leading-relaxed">
              * Lè ou anrejistre planifikasyon an, li pap diminye balans lan touswit. Se sèlman lè
              trezorye a klike sou <strong>Egzekite Retrè</strong> kòb la ap retire reyèlman.
            </div>

            <button
              type="submit"
              disabled={!isAdmin}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black disabled:opacity-40 text-white font-bold text-xs shadow-xs transition"
            >
              Verifye & Pwograme Retrè
            </button>
          </form>
        </div>

        {/* Pending Scheduled Withdrawals */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Retrè K ap Vini yo</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Retrè ki pwograme men ki poko retire sou balans lan
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
              {pendingWithdrawals.length} an atant
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">Chajman retrè yo...</div>
          ) : pendingWithdrawals.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CalendarClock className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold text-slate-600">
                Pa gen okenn retrè ki pwograme pou kounye a
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Tout fon disponib yo an sekirite nan kès la.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingWithdrawals.map((w) => (
                <div key={w.id} className="p-5 hover:bg-slate-50/50 transition space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{w.description}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Dat Prevwa: <strong>{formatDateCreole(w.scheduled_date, 'long')}</strong> •
                        Kreye pa: {w.created_by_name}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <div className="text-base font-bold text-slate-900">
                          {formatBRL(w.amount_centavos)}
                        </div>
                        <div className="text-[10px] text-amber-700 font-semibold">
                          Poko egzekite
                        </div>
                      </div>
                      <StatusBadge status={w.status} />
                    </div>
                  </div>

                  {w.note && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      Nòt: {w.note}
                    </div>
                  )}

                  {/* Actions for Admin */}
                  {isAdmin && (
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50">
                      <button
                        onClick={() => {
                          setCancelItem(w);
                          setCancelReason('');
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition"
                      >
                        Anile Retrè
                      </button>
                      <button
                        onClick={() => setExecuteConfirmItem(w)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-black transition shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Konfime Egzekisyon
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* History of Executed Withdrawals */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Istwa Retrè Egzekite yo</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Retrè ofisyèl ki te deja retire sou balans disponib la
          </p>
        </div>

        {executedWithdrawals.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Pa gen okenn retrè ki egzekite pou kounye a.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {executedWithdrawals.map((w) => (
              <div
                key={w.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{w.description}</div>
                  <div className="text-slate-400 mt-0.5">
                    Egzekite nan: {formatDateCreole(w.executed_at || w.scheduled_date)} pa{' '}
                    {w.executed_by_name || w.created_by_name}
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="font-bold text-slate-700 text-sm">
                    -{formatBRL(w.amount_centavos)}
                  </span>
                  <StatusBadge status={w.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Konfime Pwogramasyon Retrè a */}
      {showScheduleConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <CalendarClock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Konfime Pwogramasyon Retrè a
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Èske ou vle planifye retrè sa a nan sistèm nan? Sa p ap retire lajan an sou balans
                lan kounye a.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-1.5 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Montan:</span>
                <span className="font-extrabold text-slate-900">R$ {amountBRL}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dat Prevwa:</span>
                <span className="font-semibold text-slate-800">
                  {formatDateCreole(scheduledDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Deskripsyon:</span>
                <span className="font-semibold text-slate-800">{description}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowScheduleConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Anile
              </button>
              <button
                disabled={submitting}
                onClick={handleConfirmSchedule}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition"
              >
                {submitting ? 'Anrejistreman...' : 'Konfime & Sove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Konfime Egzekisyon Retrè a (Diminye balans) */}
      {executeConfirmItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Konfime Egzekisyon Ofisyèl Retrè a
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Lè ou konfime, lajan an ap retire <strong>yon sèl fwa</strong> sou balans ofisyèl
                kès la epi tranzaksyon an ap pibliye kòm egzekite.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-1.5 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Montan ki pral retire:</span>
                <span className="font-extrabold text-slate-900">
                  {formatBRL(executeConfirmItem.amount_centavos)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Deskripsyon:</span>
                <span className="font-semibold text-slate-800">
                  {executeConfirmItem.description}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setExecuteConfirmItem(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Anile
              </button>
              <button
                disabled={submitting}
                onClick={handleExecute}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition"
              >
                {submitting ? 'Egzekisyon an kouran...' : 'Egzekite Retrè Kounye a'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Anile Retrè */}
      {cancelItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Anile Retrè Pwograme a</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tanpri eksplike poukisa retrè sa a pap fèt ankò.
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="cancel_reason" className="block text-xs font-bold uppercase text-slate-600">
                Rezon Anilasyon an *
              </label>
              <textarea
                id="cancel_reason"
                required
                rows={3}
                placeholder="Mete rezon an (omwen 5 karaktè)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCancelItem(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Kite l konsa
              </button>
              <button
                disabled={submitting}
                onClick={handleCancel}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition"
              >
                {submitting ? 'Anilasyon...' : 'Konfime Anilasyon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
