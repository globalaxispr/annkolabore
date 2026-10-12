'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { repository } from '@/lib/repository';
import { PublicDonationSubmission, UserProfile } from '@/lib/types';
import { formatBRL } from '@/lib/formatters';
import {
  HeartHandshake,
  Check,
  X,
  Eye,
  Calendar,
  DollarSign,
  User,
  Clock,
  AlertTriangle,
  FileText,
  Search,
  ExternalLink,
  ShieldCheck,
  Building2,
} from 'lucide-react';

export default function AdminDonationsPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [donations, setDonations] = useState<PublicDonationSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Approval Modal State
  const [approvalModalDonation, setApprovalModalDonation] = useState<PublicDonationSubmission | null>(null);
  const [approving, setApproving] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  // Rejection Modal State
  const [rejectionModalDonation, setRejectionModalDonation] = useState<PublicDonationSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  // Receipt Preview Modal State
  const [previewDonation, setPreviewDonation] = useState<PublicDonationSubmission | null>(null);
  const [previewSignedUrl, setPreviewSignedUrl] = useState<string | null>(null);
  const [loadingSignedUrl, setLoadingSignedUrl] = useState(false);

  const fetchDonations = async () => {
    try {
      const list = await repository.getAllDonationSubmissions();
      setDonations(list);
    } catch (err) {
      console.error('Erè lekti donasyon yo:', err);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const user = await repository.getAuthUser();
        setCurrentUser(user);
        await fetchDonations();
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenReceipt = async (donation: PublicDonationSubmission) => {
    setPreviewDonation(donation);
    setLoadingSignedUrl(true);
    setPreviewSignedUrl(null);

    try {
      if (donation.receipt_storage_path.startsWith('data:')) {
        setPreviewSignedUrl(donation.receipt_storage_path);
      } else {
        const signedUrl = await repository.createSignedReceiptUrl(donation.receipt_storage_path);
        setPreviewSignedUrl(signedUrl || donation.receipt_storage_path);
      }
    } catch (err) {
      console.error('Erè jwenn lyen resi a:', err);
    } finally {
      setLoadingSignedUrl(false);
    }
  };

  const handleApprove = async () => {
    if (!approvalModalDonation || !currentUser) return;
    setApproving(true);
    setApprovalError(null);

    try {
      const res = await repository.approveDonationSubmission(
        approvalModalDonation.id,
        currentUser.id
      );

      if (!res.success) {
        throw new Error(res.error || 'Erè pandan apwobasyon donasyon an.');
      }

      setApprovalModalDonation(null);
      await fetchDonations();
    } catch (err: any) {
      setApprovalError(err.message || 'Erè pandan apwobasyon an.');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionModalDonation || !currentUser) return;
    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      setRejectionError('Tanpri bay yon rezon klè (omwen 5 karaktè).');
      return;
    }

    setRejecting(true);
    setRejectionError(null);

    try {
      const res = await repository.rejectDonationSubmission(
        rejectionModalDonation.id,
        currentUser.id,
        rejectionReason.trim()
      );

      if (!res.success) {
        throw new Error(res.error || 'Erè pandan refi donasyon an.');
      }

      setRejectionModalDonation(null);
      setRejectionReason('');
      await fetchDonations();
    } catch (err: any) {
      setRejectionError(err.message || 'Erè pandan refi a.');
    } finally {
      setRejecting(false);
    }
  };

  const filteredDonations = donations.filter((d) => {
    const statusLower = (d.status || '').toLowerCase();
    const matchesFilter = filterTab === 'all' || statusLower === filterTab;
    const matchesSearch =
      d.donor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.donor_contact && d.donor_contact.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.message && d.message.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const pendingCount = donations.filter((d) => (d.status || '').toLowerCase() === 'pending').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 md:pb-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold mb-2">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Verifikasyon Donasyon PIX</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Donasyon Piblik
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Verifye peman PIX vizitè yo sou kont labank la anvan ou apwouve yo nan fon an.
          </p>
        </div>

        <Link
          href="/admin/configuracoes/pix"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-xs"
        >
          <span>Konfigirasyon PIX</span>
        </Link>
      </div>

      {/* Caution Reminder Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Règ Sekirite Finansye:</strong> Yon resi peman poukont li se pa yon prèv defini.
          Asire w ou louvri aplikasyon labank lan epi konfime ke lajan an vrèman antre nan kont lan
          anvan ou klike sou &quot;Apwouve&quot;. Apwobasyon an ap mete ajou balans kominote a egzakteman yon sèl fwa.
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              filterTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tout ({donations.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('pending')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              filterTab === 'pending'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>An Atant</span>
            {pendingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('approved')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              filterTab === 'approved'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Apwouve
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('rejected')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              filterTab === 'rejected'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rejte
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Chèche non, kontak..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 animate-pulse h-48" />
      ) : filteredDonations.length === 0 ? (
        <div className="p-10 rounded-3xl bg-white border border-slate-200/80 text-center space-y-2">
          <HeartHandshake className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">Pa gen okenn donasyon nan kategori sa a</h3>
          <p className="text-xs text-slate-400">
            Lè yon vizitè soumèt yon donasyon PIX, l ap parèt isit la pou verifikasyon.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDonations.map((don) => {
            const isPending = (don.status || '').toLowerCase() === 'pending';
            const isApproved = (don.status || '').toLowerCase() === 'approved';
            const isRejected = (don.status || '').toLowerCase() === 'rejected';

            return (
              <div
                key={don.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-800 text-sm shrink-0">
                      {don.donor_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {don.donor_name}
                        </span>
                        {/* Status Badge */}
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                            An Atant
                          </span>
                        )}
                        {isApproved && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                            Apwouve
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-bold">
                            Rejte
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                        <span>Peman: {don.payment_date}</span>
                        <span>•</span>
                        <span>
                          Soumèt: {new Date(don.created_at).toLocaleDateString()}
                        </span>
                        {don.donor_contact && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-slate-700">
                              {don.donor_contact}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900 block">
                      {formatBRL(don.amount_cents || don.amount_centavos || 0)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      REF: DON-{don.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Optional Message */}
                {don.message && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                    &ldquo;{don.message}&rdquo;
                  </div>
                )}

                {/* Rejection reason if rejected */}
                {isRejected && don.rejection_reason && (
                  <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    <strong>Rezon refi a:</strong> {don.rejection_reason}
                  </div>
                )}

                {/* Actions Row */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenReceipt(don)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Gade Resi</span>
                  </button>

                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRejectionModalDonation(don);
                          setRejectionReason('');
                          setRejectionError(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Refize</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setApprovalModalDonation(don);
                          setApprovalError(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apwouve Donasyon</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* APPROVAL CONFIRMATION MODAL (Strict bank verification) */}
      {approvalModalDonation && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Konfime Apwobasyon Donasyon an
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Èske ou vrèman verifye peman{' '}
                <strong className="text-slate-900 font-extrabold">
                  {formatBRL(approvalModalDonation.amount_cents)}
                </strong>{' '}
                la antre nan kont labank la pou{' '}
                <strong className="text-slate-900">
                  {approvalModalDonation.donor_name}
                </strong>
                ?
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
              ⚠️ Lè ou apwouve, montan sa a ap ajoute otomatikman nan balans ofisyèl kominote a.
            </div>

            {approvalError && (
              <div className="text-xs text-rose-600 font-semibold">{approvalError}</div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={approving}
                onClick={() => setApprovalModalDonation(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Anile
              </button>
              <button
                type="button"
                disabled={approving}
                onClick={handleApprove}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {approving ? (
                  <span>Ap apwouve...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Wi, Mwen Konfime Peman an</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION MODAL */}
      {rejectionModalDonation && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <X className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Refize Donasyon Piblik</h3>
              <p className="text-xs text-slate-500 mt-1">
                Pou donasyon {rejectionModalDonation.donor_name} (
                {formatBRL(rejectionModalDonation.amount_cents)}).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rezon Refi a (omwen 5 karaktè)
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ekzanp: Peman an pa t antre nan kont labank la oswa resi a pa lizib..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            {rejectionError && (
              <div className="text-xs text-rose-600 font-semibold">{rejectionError}</div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={rejecting}
                onClick={() => setRejectionModalDonation(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Anile
              </button>
              <button
                type="button"
                disabled={rejecting}
                onClick={handleReject}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {rejecting ? <span>Ap refize...</span> : <span>Konfime Refi a</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT PREVIEW MODAL */}
      {previewDonation && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Resi Peman Donasyon: {previewDonation.donor_name}
                </h3>
                <span className="text-xs text-slate-500">
                  Montan: {formatBRL(previewDonation.amount_cents)} • Dat: {previewDonation.payment_date}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDonation(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 rounded-2xl p-4 border border-slate-100 min-h-[300px]">
              {loadingSignedUrl ? (
                <div className="text-xs text-slate-400">Ap chaje resi sekirize a...</div>
              ) : previewSignedUrl ? (
                previewSignedUrl.endsWith('.pdf') || previewSignedUrl.includes('application/pdf') ? (
                  <iframe
                    src={previewSignedUrl}
                    className="w-full h-96 rounded-xl border border-slate-200"
                    title="PDF Resi"
                  />
                ) : (
                  <img
                    src={previewSignedUrl}
                    alt="Resi Peman"
                    className="max-h-[70vh] rounded-xl object-contain shadow-md"
                  />
                )
              ) : (
                <div className="text-xs text-slate-400">Resi a pa disponib oswa ekspire.</div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewDonation(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
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
