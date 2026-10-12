'use client';

import React, { useEffect, useState } from 'react';
import { demoStorage } from '@/lib/demo-storage';
import { repository } from '@/lib/repository';
import { ExpenseRecord, UserProfile } from '@/lib/types';
import { formatBRL, formatDateCreole } from '@/lib/formatters';
import {
  DollarSign,
  PlusCircle,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Receipt,
  Tag,
  ShieldCheck,
  X,
} from 'lucide-react';

export default function ExpensesAdminPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [amountBRL, setAmountBRL] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Sipò ak Aktivite');
  const [referenceNote, setReferenceNote] = useState('');

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setExpenseDate(new Date().toISOString().split('T')[0]);
    const user = demoStorage.getCurrentUser();
    setCurrentUser(user);
    const expList = await repository.getAllExpenses();
    setExpenses(expList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalExpensesCentavos = expenses.reduce((sum, e) => sum + e.amount_centavos, 0);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackSuccess(null);

    const cleanNum = parseFloat(amountBRL.replace(',', '.'));
    if (isNaN(cleanNum) || cleanNum <= 0) {
      setFeedbackError('Tanpri mete yon montan depans ki valab.');
      return;
    }
    if (!description || description.trim().length < 3) {
      setFeedbackError('Deskripsyon depans lan dwe gen omwen 3 karaktè.');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleRecordExpense = async () => {
    if (!currentUser) return;
    setSubmitting(true);
    setFeedbackError(null);

    const cleanNum = parseFloat(amountBRL.replace(',', '.'));
    const amountCentavos = Math.round(cleanNum * 100);

    const result = await repository.recordExpense({
      admin_id: currentUser.id,
      amount_centavos: amountCentavos,
      expense_date: expenseDate,
      description: description.trim(),
      category: category,
      reference_note: referenceNote.trim() || undefined,
    });

    setSubmitting(false);
    setShowConfirmModal(false);

    if (result.error) {
      setFeedbackError(result.error);
    } else {
      setFeedbackSuccess(
        `Depans ${formatBRL(amountCentavos)} anrejistre avèk siksè nan kès la!`
      );
      // Reset form
      setAmountBRL('');
      setDescription('');
      setReferenceNote('');
      await loadData();
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Title Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            Jesyon Depans ak Retrè
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
            Depans yo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Anrejistre ak kontwole tout lajan ki depanse oswa bay pou soutyen legliz la
          </p>
        </div>

        <div className="bg-rose-50 px-5 py-3 rounded-2xl border border-rose-100 flex items-center gap-3">
          <div className="text-2xl font-black text-rose-700">
            {formatBRL(totalExpensesCentavos)}
          </div>
          <div className="text-xs font-semibold text-rose-900 leading-tight">
            total depans anrejistre
          </div>
        </div>
      </div>

      {feedbackSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Record Expense Form (Admin Only) */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-rose-600" />
              Anrejistre Yon Nouvo Depans
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Chak depans diminye balans disponib la
            </p>
          </div>

          <form onSubmit={handleOpenConfirm} className="space-y-4">
            <div>
              <label
                htmlFor="exp_amount"
                className="block text-xs font-bold uppercase text-slate-600 mb-1"
              >
                Montan (BRL) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">
                  R$
                </span>
                <input
                  id="exp_amount"
                  type="text"
                  required
                  placeholder="50,00"
                  value={amountBRL}
                  onChange={(e) => setAmountBRL(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="exp_date"
                className="block text-xs font-bold uppercase text-slate-600 mb-1"
              >
                Dat Depans lan *
              </label>
              <input
                id="exp_date"
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="exp_category"
                className="block text-xs font-bold uppercase text-slate-600 mb-1"
              >
                Kategori *
              </label>
              <select
                id="exp_category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="Sipò ak Aktivite">Sipò ak Aktivite Legliz</option>
                <option value="Reyinyon">Reyinyon ak Rafrechisman</option>
                <option value="Èd Sosyal">Èd Sosyal pou Manm</option>
                <option value="Transfè Don">Transfè Don Ofisyèl nan Kès Legliz</option>
                <option value="Lòt">Lòt Depans</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="exp_desc"
                className="block text-xs font-bold uppercase text-slate-600 mb-1"
              >
                Deskripsyon Depans lan *
              </label>
              <textarea
                id="exp_desc"
                rows={2}
                required
                placeholder="Poukisa lajan sa a te depanse..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="exp_ref"
                className="block text-xs font-bold uppercase text-slate-600 mb-1"
              >
                Referans / Nimewo Resi (Opsyonèl)
              </label>
              <input
                id="exp_ref"
                type="text"
                placeholder="Resi #1234 oswa prèv"
                value={referenceNote}
                onChange={(e) => setReferenceNote(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={!isAdmin}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition"
            >
              Verifye & Anrejistre Depans
            </button>
          </form>
        </div>

        {/* Expenses List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Istwa Depans yo</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tout depans ak retrè ki anrejistre nan kont lan
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">Chajman depans yo...</div>
          ) : expenses.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold text-slate-600">Pa gen okenn depans ki anrejistre</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {expenses.map((exp) => (
                <div key={exp.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{exp.description}</span>
                    <span className="text-sm font-extrabold text-rose-600">
                      -{formatBRL(exp.amount_centavos)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-400" />
                      Kategori: <strong className="text-slate-700">{exp.category}</strong>
                    </span>
                    <span>Dat: {formatDateCreole(exp.expense_date)}</span>
                    <span>Otorize pa: {exp.authorized_by_name}</span>
                  </div>

                  {exp.reference_note && (
                    <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded inline-block">
                      Referans: {exp.reference_note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Konfime Enskripsyon Depans lan
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Aksyon sa a pral retire montan sa a sou balans kès la epi l ap anrejistre nan rapò ofisyèl la.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-1.5 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Montan:</span>
                <span className="font-extrabold text-rose-600">
                  R$ {amountBRL}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dat:</span>
                <span className="font-semibold text-slate-800">{formatDateCreole(expenseDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kategori:</span>
                <span className="font-semibold text-slate-800">{category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Deskripsyon:</span>
                <span className="font-semibold text-slate-800">{description}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Anile
              </button>
              <button
                disabled={submitting}
                onClick={handleRecordExpense}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition"
              >
                {submitting ? 'Anrejistreman...' : 'Konfime & Sove Depans'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
