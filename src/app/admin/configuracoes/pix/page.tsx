'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { repository } from '@/lib/repository';
import { PixKeyType, PixSettings, UserProfile } from '@/lib/types';
import { validateCpf, formatCpf } from '@/lib/pix';
import {
  QrCode,
  Save,
  Check,
  AlertCircle,
  Building2,
  FileText,
  ShieldCheck,
  ArrowLeft,
  ToggleLeft,
  ToggleRight,
  Info,
} from 'lucide-react';

export default function AdminPixSettingsPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('CPF');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [city, setCity] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const user = await repository.getAuthUser();
        setCurrentUser(user);

        const settings = await repository.getPixSettings();
        if (settings) {
          setPixKey(settings.pix_key || '');
          setPixKeyType(settings.pix_key_type || 'CPF');
          setBeneficiaryName(settings.beneficiary_name || 'Frantzciou Dorleans');
          setCity(settings.city || 'Pato Branco');
          setInstructions(settings.instructions || '');
          setIsActive(settings.is_active);
        }
      } catch (err) {
        console.error('Erè lekti konfigirasyon:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveSuccess(false);

    if (!currentUser || currentUser.role !== 'admin') {
      setErrorMessage('Ou dwe konekte kòm administratè pou chanje paramèt sa yo.');
      return;
    }

    if (!pixKey.trim()) {
      setErrorMessage('Tanpri antre yon kle PIX ki valab.');
      return;
    }

    if (pixKeyType === 'CPF') {
      const isCpfValid = validateCpf(pixKey);
      if (!isCpfValid) {
        setErrorMessage(
          'Chif kontwòl CPF la pa valab. Tanpri verifye 11 chif yo kòrèkteman.'
        );
        return;
      }
    }

    if (!beneficiaryName.trim()) {
      setErrorMessage('Tanpri mete non benefisyè a.');
      return;
    }

    setSaving(true);

    try {
      const res = await repository.updatePixSettings(
        {
          pix_key: pixKey.trim(),
          pix_key_type: pixKeyType,
          beneficiary_name: beneficiaryName.trim(),
          city: city.trim() || 'Sao Paulo',
          instructions: instructions.trim() || undefined,
          is_active: isActive,
        },
        currentUser.id
      );

      if (!res.success) {
        throw new Error(res.error || 'Erè pandan anrejistreman konfigirasyon PIX la.');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erè pandan anrejistreman an.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-64 bg-white rounded-3xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 md:pb-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Konfigirasyon PIX</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Jere kle PIX, benefisyè, ak estati donasyon piblik yo.
            </p>
          </div>
        </div>

        <Link
          href="/kontribye"
          target="_blank"
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition"
        >
          Gade Paj Piblik la ↗
        </Link>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Konfigirasyon PIX la mete ajou avèk siksè nan sistèm nan!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
        {/* Active Toggle */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              Aksepte Donasyon Piblik PIX
            </span>
            <span className="text-[11px] text-slate-500 block">
              Lè li etenn, vizitè yo ap wè yon mesaj ki di sistèm nan tanporèman pa disponib.
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className="flex items-center gap-2 cursor-pointer"
          >
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <Check className="w-3.5 h-3.5" />
                Aktif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
                Dezaktive
              </span>
            )}
          </button>
        </div>

        {/* PIX Key & Key Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tip Kle PIX
            </label>
            <select
              value={pixKeyType}
              onChange={(e) => setPixKeyType(e.target.value as PixKeyType)}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900 bg-white"
            >
              <option value="CPF">CPF</option>
              <option value="CNPJ">CNPJ</option>
              <option value="Email">Email</option>
              <option value="Telefone">Telefòn</option>
              <option value="Chave Aleatória">Chave Aleatória</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Kle PIX Ofisyèl
            </label>
            <input
              type="text"
              required
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="70310589290"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
            />
            {pixKeyType === 'CPF' && pixKey.trim().length === 11 && (
              <span className="text-[11px] text-slate-500 mt-1 block">
                Fòma: {formatCpf(pixKey)} •{' '}
                {validateCpf(pixKey) ? (
                  <span className="text-emerald-600 font-bold">✓ CPF Valab</span>
                ) : (
                  <span className="text-rose-600 font-bold">✗ CPF Envalab</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Beneficiary Name & City */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Non Benefisyè a (Titilè Kont)
            </label>
            <input
              type="text"
              required
              value={beneficiaryName}
              onChange={(e) => setBeneficiaryName(e.target.value)}
              placeholder="Frantzciou Dorleans"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Vil (City)
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Pato Branco"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
            />
          </div>
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Enstriksyon Peman Pou Vizitè Yo
          </label>
          <textarea
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Fè transfè PIX la nan aplikasyon labank ou, answit soumèt resi peman an anba a pou administratè a ka konfime li."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 resize-none"
          />
        </div>

        {/* Save Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <span>Ap anrejistre...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Anrejistre Konfigirasyon PIX</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
