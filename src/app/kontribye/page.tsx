'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { repository } from '@/lib/repository';
import { PixSettings } from '@/lib/types';
import { formatCpf, generatePixPayload, generatePixQrDataUrl, validateCpf } from '@/lib/pix';
import { formatBRL } from '@/lib/formatters';
import {
  HeartHandshake,
  QrCode,
  Copy,
  Check,
  Upload,
  FileText,
  AlertCircle,
  Clock,
  Send,
  Building2,
  Calendar,
  DollarSign,
  User,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export default function KontribyePage() {
  const [pixSettings, setPixSettings] = useState<PixSettings | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);

  // Form State
  const [donorName, setDonorName] = useState('');
  const [donorContact, setDonorContact] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [message, setMessage] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successReference, setSuccessReference] = useState<string | null>(null);

  useEffect(() => {
    setPaymentDate(new Date().toISOString().split('T')[0]);

    async function loadSettings() {
      try {
        const settings = await repository.getPixSettings();
        setPixSettings(settings);

        if (settings && settings.is_active && settings.pix_key) {
          // If CPF, validate check digits
          if (settings.pix_key_type === 'CPF' && !validateCpf(settings.pix_key)) {
            console.warn('CPF la pa pase verifikasyon chif kontwòl yo.');
          }

          try {
            const payload = generatePixPayload({
              key: settings.pix_key,
              keyType: settings.pix_key_type,
              name: settings.beneficiary_name || 'Frantzciou Dorleans',
              city: settings.city || 'Pato Branco',
              description: 'Donasyon Chofe Legliz',
            });
            const qrUrl = await generatePixQrDataUrl(payload);
            setQrDataUrl(qrUrl);
          } catch (qrErr) {
            console.error('Erè jenerasyon kòd QR PIX:', qrErr);
          }
        }
      } catch (err) {
        console.error('Erè pandan chajman konfigirasyon PIX:', err);
      } finally {
        setLoadingSettings(false);
      }
    }

    loadSettings();
  }, []);

  const handleCopyKey = () => {
    if (!pixSettings?.pix_key) return;
    // Copies purely digits 70310589290 without any formatting
    const rawKey = pixSettings.pix_key.replace(/\D/g, '') || pixSettings.pix_key;
    navigator.clipboard.writeText(rawKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Fichye resi a twò gwo. Gwosè maksimòm lan se 5 MB.');
      return;
    }

    setFormError(null);
    setReceiptFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!donorName.trim()) {
      setFormError('Tanpri antre non konplè ou.');
      return;
    }

    if (!amountStr.trim()) {
      setFormError('Tanpri endike montan ou te bay la.');
      return;
    }

    if (!receiptFile) {
      setFormError('Tanpri chaje resi peman PIX ou an.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('donor_name', donorName.trim());
      formData.append('donor_contact', donorContact.trim());
      formData.append('amount', amountStr.trim());
      formData.append('payment_date', paymentDate);
      formData.append('message', message.trim());
      formData.append('receipt', receiptFile);
      formData.append('hp_website', ''); // Honeypot bot protection

      const res = await fetch('/api/donations/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erè pandan voye resi a.');
      }

      setSuccessReference(data.reference);
      // Reset form
      setDonorName('');
      setDonorContact('');
      setAmountStr('');
      setMessage('');
      setReceiptFile(null);
      setReceiptPreview(null);
    } catch (err: any) {
      setFormError(err.message || 'Erè pandan voye resi a. Tanpri eseye ankò.');
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW (Feature 10)
  if (successReference) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-inner">
            <Check className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Nou resevwa resi ou a!
            </h1>
            <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              Mèsi anpil pou kontribisyon ou. Administratè a ap verifye peman an anvan li antre nan
              balans kominote a.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 max-w-sm mx-auto text-left space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Nimewo Referans Donasyon
            </span>
            <span className="font-mono text-base font-extrabold text-slate-900 tracking-wider block">
              {successReference}
            </span>
            <span className="text-[11px] text-amber-700 font-medium block pt-1">
              • Eta: An Atant Verifikasyon
            </span>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setSuccessReference(null)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-bold transition shadow-xs"
            >
              Fè Yon Lòt Donasyon
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition text-center"
            >
              Retounen sou Akèy
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 md:pb-8">
      {/* HEADER SECTION (Feature 1) */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60 text-xs font-semibold">
          <HeartHandshake className="w-3.5 h-3.5 text-rose-600" />
          <span>Donasyon Piblik PIX</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Kontribiye Kounye a
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto font-normal">
          Sipòte kominote Chofè Legliz la. Nenpòt moun ka fè yon donasyon dirèk atravè PIX epi voye
          resi a pou verifikasyon.
        </p>
      </div>

      {/* 3-STEP EXPERIENCE GUIDE (Feature 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm shrink-0 border border-emerald-200/60">
            1
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Fè peman an</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Eskane kòd QR PIX la oswa kopye kle ofisyèl la nan aplikasyon bank ou.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-sm shrink-0 border border-blue-200/60">
            2
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Voye resi a</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Ranpli ti fòm lan ak non ou epi telechaje resi tranzaksyon an (imaj oswa PDF).
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black text-sm shrink-0 border border-amber-200/60">
            3
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Tann konfimasyon</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Administratè a ap verifye peman an anvan li antre ofisyèlman nan fon kominotè a.
            </p>
          </div>
        </div>
      </div>

      {/* PIX INFORMATION & PAYMENT CARD (Feature 2) */}
      {loadingSettings ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 animate-pulse h-64" />
      ) : !pixSettings || !pixSettings.is_active || !pixSettings.pix_key ? (
        <div className="p-8 rounded-3xl bg-amber-50/70 border border-amber-200 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
          <h2 className="text-lg font-bold text-amber-900">Sistèm PIX la Poko Disponib</h2>
          <p className="text-xs sm:text-sm text-amber-700 max-w-md mx-auto leading-relaxed">
            Administratè a poko aktive oswa konfigire kle PIX pou donasyon piblik yo. Tanpri retounen
            pi ta oswa kontakte lidèchip la.
          </p>
        </div>
      ) : (
        <div className="bg-gradient-to-b from-white to-slate-50/50 rounded-3xl border border-slate-200/80 shadow-lg p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* PIX QR CODE COLUMN */}
            <div className="md:col-span-5 flex flex-col items-center text-center">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm relative group">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Kòd QR PIX Ofisyèl"
                    className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                    Kòd QR ap prepare...
                  </div>
                )}
                <div className="mt-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-slate-600" />
                  <span>Eskane ak App Bank Ou</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 max-w-xs">
                Sipòte tout aplikasyon labank brezilyen (Nubank, Itaú, Bradesco, Inter, elatriye).
              </p>
            </div>

            {/* PIX DETAILS COLUMN */}
            <div className="md:col-span-7 space-y-5">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-700 block mb-1">
                  ENFÒMASYON PIX OFISYÈL
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Chofè Legliz
                </h2>
                <div className="mt-3 space-y-1.5 text-xs sm:text-sm text-slate-600">
                  <p className="flex items-center gap-2 font-medium">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      Benefisyè PIX:{' '}
                      <strong className="text-slate-900 font-bold">
                        {pixSettings.beneficiary_name || 'Frantzciou Dorleans'}
                      </strong>
                    </span>
                  </p>
                  <p className="flex items-center gap-2 font-medium">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      Vil:{' '}
                      <strong className="text-slate-900 font-semibold">
                        {pixSettings.city
                          ? pixSettings.city.includes('PR')
                            ? pixSettings.city
                            : `${pixSettings.city} – PR`
                          : 'Pato Branco – PR'}
                      </strong>
                    </span>
                  </p>
                </div>
              </div>

              {/* PIX Key Box with Copy Button */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Kle PIX ({pixSettings.pix_key_type}): {pixSettings.pix_key_type === 'CPF' ? formatCpf(pixSettings.pix_key) : pixSettings.pix_key}
                </span>

                <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono text-sm sm:text-base font-bold text-slate-900">
                  <span className="truncate tracking-wide">
                    {pixSettings.pix_key_type === 'CPF'
                      ? formatCpf(pixSettings.pix_key)
                      : pixSettings.pix_key}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                      copiedKey
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 hover:bg-black text-white'
                    }`}
                  >
                    {copiedKey ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Kopye!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopye Kle PIX la</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Instructions */}
              {pixSettings.instructions && (
                <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200/60 text-xs text-slate-600 leading-relaxed">
                  <strong>Enstriksyon:</strong> {pixSettings.instructions}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT SUBMISSION FORM (Feature 4) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">Soumèt Resi Peman an</h2>
            <p className="text-xs text-slate-500 mt-1">
              Ranpli fòm sa a apre ou fin fè peman PIX la pou nou ka verifye li.
            </p>
          </div>

          {formError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Donor Name */}
            <div>
              <label
                htmlFor="donor_name"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Non Konplè Ou <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="donor_name"
                  type="text"
                  required
                  placeholder="Ekzanp: Jean Pierre Augustin"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <label
                htmlFor="donor_contact"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Imèl oswa WhatsApp <span className="text-slate-400 text-[10px] lowercase">(opsyonèl)</span>
              </label>
              <input
                id="donor_contact"
                type="text"
                placeholder="Ekzanp: +55 11 99999-9999 oswa imel@egzanp.com"
                value={donorContact}
                onChange={(e) => setDonorContact(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
              />
            </div>

            {/* Amount and Date (Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="amount"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Montan Peye (BRL) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="amount"
                    type="text"
                    required
                    placeholder="Ekzanp: 50,00"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="payment_date"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Dat Peman an <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="payment_date"
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Receipt File Upload */}
            <div>
              <label
                htmlFor="receipt_file"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Resi Peman an (Imaj oswa PDF, max 5 MB) <span className="text-rose-500">*</span>
              </label>
              <div className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-2xl p-5 text-center transition bg-slate-50/50">
                <input
                  id="receipt_file"
                  type="file"
                  required
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="receipt_file"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  {receiptFile ? (
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 block">{receiptFile.name}</span>
                      <span className="text-slate-400">
                        {(receiptFile.size / (1024 * 1024)).toFixed(2)} MB • Klike pou chanje
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs">
                      <span className="font-bold text-emerald-700 hover:underline">
                        Klike pou chwazi fichye a
                      </span>{' '}
                      <span className="text-slate-500">oswa glise li la a</span>
                      <span className="block text-[11px] text-slate-400 mt-0.5">
                        JPEG, PNG, WebP oswa PDF (maksimòm 5 MB)
                      </span>
                    </div>
                  )}
                </label>

                {receiptPreview && (
                  <div className="mt-4 pt-3 border-t border-slate-200 flex justify-center">
                    <img
                      src={receiptPreview}
                      alt="Apèsi resi"
                      className="max-h-36 rounded-lg object-contain border border-slate-200 shadow-xs"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Optional Message */}
            <div>
              <label
                htmlFor="message"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Mesaj / Priyè <span className="text-slate-400 text-[10px] lowercase">(opsyonèl)</span>
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <textarea
                  id="message"
                  rows={2}
                  maxLength={500}
                  placeholder="Yon ti mo benediksyon oswa kòmantè pou kominote a..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <span>Ap voye resi a...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Soumèt Resi Donasyon an</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Fichye resi ou an estoke an sekirite epi sèlman administratè a gen aksè ladan l.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
