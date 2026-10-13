'use client';

import React, { useEffect, useState } from 'react';
import { repository } from '@/lib/repository';
import { UserProfile, ContributionSubmission } from '@/lib/types';
import { formatBRL, formatDateCreole } from '@/lib/formatters';
import {
  Users,
  Car,
  PlusCircle,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  X,
} from 'lucide-react';

export default function MembersAdminPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [submissions, setSubmissions] = useState<ContributionSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Direct Contribution Modal
  const [directModalDriver, setDirectModalDriver] = useState<UserProfile | null>(null);
  const [directWorkDate, setDirectWorkDate] = useState('');
  const [directPaymentDate, setDirectPaymentDate] = useState('');
  const [directAmount, setDirectAmount] = useState('10,00');
  const [directMethod, setDirectMethod] = useState<'PIX' | 'Espès' | 'Transfè' | 'Lòt'>('Espès');
  const [directNote, setDirectNote] = useState('');

  const [directSuccess, setDirectSuccess] = useState<string | null>(null);
  const [directError, setDirectError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    setDirectWorkDate(today);
    setDirectPaymentDate(today);
    const authUser = await repository.getAuthUser();
    setCurrentUser(authUser);
    const m = await repository.getAllMembers();
    const s = await repository.getAllSubmissions();
    setMembers(m);
    setSubmissions(s);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !directModalDriver) return;
    setDirectError(null);

    const cleanNum = parseFloat(directAmount.replace(',', '.'));
    const amountCentavos = isNaN(cleanNum) ? 1000 : Math.round(cleanNum * 100);

    const res = await repository.recordDirectContribution({
      admin_id: currentUser.id,
      driver_id: directModalDriver.id,
      work_date: directWorkDate,
      payment_date: directPaymentDate,
      amount_centavos: amountCentavos,
      payment_method: directMethod,
      note: directNote || `Remèt bay trezorye dirèk`,
    });

    if (res.error) {
      setDirectError(res.error);
    } else {
      setDirectSuccess(
        `Kontribisyon ${formatBRL(amountCentavos)} anrejistre pou ${directModalDriver.full_name}! Li plase nan eta "An Atant" epi li disponib kounye a nan lis Verifikasyon Trezorye (/admin/atant) pou apwobasyon ofisyèl.`
      );
      setDirectModalDriver(null);
      setDirectNote('');
      await loadData();
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  const driverMembers = members.filter((m) => m.role === 'driver');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            Rejis Manm yo
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
            Manm Gwoup la
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Lis tout chofè ki anrejistre nan gwoup la ak estatistik kontribisyon yo
          </p>
        </div>

        <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200 flex items-center gap-3">
          <div className="text-2xl font-black text-slate-800">{driverMembers.length}</div>
          <div className="text-xs font-semibold text-slate-600 leading-tight">
            chofè aktif
          </div>
        </div>
      </div>

      {directSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{directSuccess}</span>
          </div>
          <button onClick={() => setDirectSuccess(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {directError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{directError}</span>
          </div>
          <button onClick={() => setDirectError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Drivers List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Lis Chofè Enskri yo</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Chajman manm yo...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {driverMembers.map((driver) => {
              const driverSubs = submissions.filter((s) => s.driver_id === driver.id);
              const approved = driverSubs.filter((s) => s.status === 'APPROVED');
              const totalAmount = approved.reduce((sum, s) => sum + s.amount_centavos, 0);

              return (
                <div
                  key={driver.id}
                  className="p-5 hover:bg-slate-50/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-lg">
                      {driver.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-base">{driver.full_name}</div>
                      <div className="text-xs text-slate-500">
                        {driver.email} {driver.phone ? `• ${driver.phone}` : ''}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Enskri depi: {formatDateCreole(driver.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="text-base font-extrabold text-emerald-700">
                        {formatBRL(totalAmount)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {approved.length} jou travay kontribye
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => setDirectModalDriver(driver)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Anrejistre Dirèk
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Direct Contribution Modal */}
      {directModalDriver && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Anrejistre Kontribisyon Dirèk
                </h3>
                <p className="text-xs text-slate-500">
                  Pou chofè: <strong>{directModalDriver.full_name}</strong>
                </p>
              </div>
              <button
                onClick={() => setDirectModalDriver(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordDirect} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">
                  Dat Travay la *
                </label>
                <input
                  type="date"
                  required
                  value={directWorkDate}
                  onChange={(e) => setDirectWorkDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">
                  Dat Peman an *
                </label>
                <input
                  type="date"
                  required
                  value={directPaymentDate}
                  onChange={(e) => setDirectPaymentDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">
                    Montan (BRL) *
                  </label>
                  <input
                    type="text"
                    required
                    value={directAmount}
                    onChange={(e) => setDirectAmount(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">
                    Metòd *
                  </label>
                  <select
                    value={directMethod}
                    onChange={(e) =>
                      setDirectMethod(e.target.value as 'PIX' | 'Espès' | 'Transfè' | 'Lòt')
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  >
                    <option value="Espès">Espès (Kach)</option>
                    <option value="PIX">PIX</option>
                    <option value="Transfè">Transfè</option>
                    <option value="Lòt">Lòt</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">
                  Nòt (Opsyonèl)
                </label>
                <textarea
                  rows={2}
                  value={directNote}
                  placeholder="Egzanp: Remèt kach pandan reyinyon mèkredi a"
                  onChange={(e) => setDirectNote(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDirectModalDriver(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-700"
                >
                  Anile
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white shadow-xs"
                >
                  Anrejistre & Apwouve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
