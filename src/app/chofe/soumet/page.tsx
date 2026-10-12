'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { demoStorage } from '@/lib/demo-storage';
import { repository } from '@/lib/repository';
import { UserProfile, PaymentMethod } from '@/lib/types';
import { DEFAULT_CONTRIBUTION_CENTAVOS } from '@/lib/financial';
import { formatBRL } from '@/lib/formatters';
import {
  Calendar,
  DollarSign,
  CreditCard,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Info,
} from 'lucide-react';

export default function SubmitContributionPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Form State
  const [workDate, setWorkDate] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [amountBRL, setAmountBRL] = useState('10,00');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [transactionRef, setTransactionRef] = useState('');
  const [note, setNote] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setWorkDate(today);
    setPaymentDate(today);
    setCurrentUser(demoStorage.getCurrentUser());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentUser) {
      setErrorMsg('Tanpri chwazi yon kont chofè anvan ou soumèt.');
      return;
    }

    if (!workDate) {
      setErrorMsg('Tanpri antre dat travay la.');
      return;
    }

    setSubmitting(true);

    try {
      // Parse amount
      const cleanNum = parseFloat(amountBRL.replace(',', '.'));
      const amountCentavos = isNaN(cleanNum)
        ? DEFAULT_CONTRIBUTION_CENTAVOS
        : Math.round(cleanNum * 100);

      const result = await repository.submitContribution({
        driver_id: currentUser.id,
        work_date: workDate,
        payment_date: paymentDate || workDate,
        amount_centavos: amountCentavos,
        payment_method: paymentMethod,
        transaction_ref: transactionRef || undefined,
        note: note || undefined,
        receipt_url: receiptFileName ? `mock-receipt://${receiptFileName}` : undefined,
      });

      if (result.error) {
        setErrorMsg(result.error);
      } else {
        setSuccessMsg(
          `Kontribisyon ${formatBRL(amountCentavos)} pou jou travay ${workDate} soumèt avèk siksè! L ap parèt nan eta "An Atant" jiskaske trezorye a verifye li.`
        );
        // Reset form
        setTransactionRef('');
        setNote('');
        setReceiptFileName('');
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Gen yon erè ki pase pandan soumisyon an.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/chofe"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retounen nan Kont Mwen
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs">
        <div className="border-b border-slate-100 pb-5 mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Soumèt Kontribisyon
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Anrejistre kontribisyon R$ 10,00 ou pou yon jou ou te travay
          </p>
        </div>

        {/* Rule reminder callout */}
        <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-950 leading-relaxed">
            <strong>Règ Gwoup la:</strong> Ou kontribye R$ 10,00 sèlman pou jou ou te travay reyèlman. Si ou pa t travay, ou pa gen anyen pou w peye. Lè ou soumèt fòmilè sa a, li rete <em>An Atant</em> jiskaske trezorye a konfime li.
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p>{successMsg}</p>
              <div className="flex gap-2">
                <Link
                  href="/chofe"
                  className="inline-block text-xs font-bold text-emerald-700 underline"
                >
                  Gade Kont Mwen
                </Link>
                <Link
                  href="/"
                  className="inline-block text-xs font-bold text-emerald-700 underline"
                >
                  Gade Tablo Finansye Piblik
                </Link>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Chofè Selector / Display */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Chofè K ap Soumèt la
            </label>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800">
              {currentUser?.full_name} ({currentUser?.email})
            </div>
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="work_date"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Dat Travay la *
              </label>
              <div className="relative">
                <input
                  id="work_date"
                  type="date"
                  required
                  value={workDate}
                  onChange={(e) => {
                    setWorkDate(e.target.value);
                    if (!paymentDate) setPaymentDate(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Jou ou te fè travay la</p>
            </div>

            <div>
              <label
                htmlFor="payment_date"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Dat Peman an *
              </label>
              <div className="relative">
                <input
                  id="payment_date"
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Jou ou te fè transfè a oswa remèt kòb la</p>
            </div>
          </div>

          {/* Montan & Metòd Peman */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="amount"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Montan (BRL) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">
                  R$
                </span>
                <input
                  id="amount"
                  type="text"
                  required
                  value={amountBRL}
                  onChange={(e) => setAmountBRL(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Nòmalman se R$ 10,00 pa jou</p>
            </div>

            <div>
              <label
                htmlFor="payment_method"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Metòd Peman *
              </label>
              <select
                id="payment_method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
              >
                <option value="PIX">PIX</option>
                <option value="Espès">Espès (Lajan kach)</option>
                <option value="Transfè">Transfè Labank (TED/DOC)</option>
                <option value="Lòt">Lòt</option>
              </select>
            </div>
          </div>

          {/* Transaction Reference */}
          <div>
            <label
              htmlFor="trans_ref"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Nimewo Referans Tranzaksyon (Opsyonèl)
            </label>
            <input
              id="trans_ref"
              type="text"
              placeholder="Egzanp: PIX-98234-JB oswa ID tranzaksyon labank"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
            />
          </div>

          {/* Receipt Proof Upload Simulation */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Prèv Peman / Resi (Opsyonèl)
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-emerald-500 transition cursor-pointer bg-slate-50/50">
              <UploadCloud className="w-7 h-7 mx-auto text-slate-400 mb-1" />
              <input
                type="file"
                accept="image/*,.pdf"
                id="receipt_file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setReceiptFileName(e.target.files[0].name);
                  }
                }}
              />
              <label htmlFor="receipt_file" className="cursor-pointer">
                {receiptFileName ? (
                  <span className="text-xs font-semibold text-emerald-700">
                    Fichye chwazi: {receiptFileName}
                  </span>
                ) : (
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-emerald-700">
                      Klike la a pou chaje yon foto resi oswa kapti ekran PIX
                    </span>
                    <p className="text-[11px] text-slate-400">PNG, JPG, PDF jiska 5MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Note */}
          <div>
            <label
              htmlFor="note"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Nòt / Remak (Opsyonèl)
            </label>
            <textarea
              id="note"
              rows={2}
              placeholder="Nenpòt ti enfòmasyon anplis pou trezorye a..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Soumisyon an kouran...' : 'Soumèt Kontribisyon Sa a'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
