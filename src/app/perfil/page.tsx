'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { repository } from '@/lib/repository';
import { demoStorage } from '@/lib/demo-storage';
import { uploadProfileAvatar, deleteProfileAvatar } from '@/lib/supabase/storage';
import { ContributionSubmission, UserProfile } from '@/lib/types';
import { formatBRL, formatDateCreole } from '@/lib/formatters';
import { initialsOf } from '@/components/shell/SidebarContent';
import {
  User,
  Camera,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Calendar,
  Shield,
  Car,
  Clock,
  ArrowLeft,
  Loader2,
  LogOut,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [submissions, setSubmissions] = useState<ContributionSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingName, setSavingName] = useState(false);

  // Feedback notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadUserData = async () => {
    try {
      const current = await repository.getAuthUser();
      setUser(current);
      if (current) {
        setEditName(current.full_name);
        const subs = await repository.getDriverSubmissions(current.id);
        setSubmissions(subs);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const approvedSubs = submissions.filter(
    (s) => s.status === 'APPROVED' || s.status === 'approved'
  );
  const pendingSubs = submissions.filter(
    (s) => s.status === 'PENDING' || s.status === 'pending'
  );
  const totalContributedCentavos = approvedSubs.reduce(
    (sum, s) => sum + (s.amount_cents || s.amount_centavos || 0),
    0
  );

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setUploadingPhoto(true);

    try {
      const res = await uploadProfileAvatar(file, user.id);
      if (res.error) {
        setErrorMessage(res.error);
        return;
      }

      if (res.url) {
        const updateRes = await repository.updateProfile(user.id, {
          avatar_url: res.url,
        });

        if (updateRes.error) {
          setErrorMessage(updateRes.error);
        } else {
          setUser((prev) => (prev ? { ...prev, avatar_url: res.url } : null));
          setSuccessMessage('Foto pwofil ou a mete ajou avèk siksè!');
        }
      }
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!user || !user.avatar_url) return;
    if (!window.confirm('Èske ou vle retire foto pwofil ou a reyèlman?')) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setUploadingPhoto(true);

    try {
      await deleteProfileAvatar(user.avatar_url, user.id);
      const updateRes = await repository.updateProfile(user.id, {
        avatar_url: '',
      });

      if (updateRes.error) {
        setErrorMessage(updateRes.error);
      } else {
        setUser((prev) => (prev ? { ...prev, avatar_url: undefined } : null));
        setSuccessMessage('Foto pwofil la retire avèk siksè.');
      }
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (editName.trim().length < 3) {
      setErrorMessage('Non an dwe gen omwen 3 karaktè.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setSavingName(true);

    try {
      const updateRes = await repository.updateProfile(user.id, {
        full_name: editName.trim(),
      });

      if (updateRes.error) {
        setErrorMessage(updateRes.error);
      } else {
        setUser((prev) => (prev ? { ...prev, full_name: editName.trim() } : null));
        setIsEditingName(false);
        setSuccessMessage('Non ou mete ajou avèk siksè!');
      }
    } finally {
      setSavingName(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto my-8 p-8 bg-white rounded-3xl border border-slate-100 animate-pulse space-y-4">
        <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto" />
        <div className="h-6 w-48 bg-slate-200 rounded mx-auto" />
        <div className="h-4 w-32 bg-slate-100 rounded mx-auto" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-8 bg-white rounded-3xl border border-slate-100 space-y-4">
        <User className="w-12 h-12 text-slate-300 mx-auto" />
        <h1 className="text-xl font-bold text-slate-900">Ou poko konekte</h1>
        <p className="text-xs text-slate-500">
          Tanpri konekte pou w ka wè ak modifye pwofil ou.
        </p>
        <Link
          href="/auth/login"
          className="inline-block px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black"
        >
          Konekte
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 md:pb-6">
      {/* Back button */}
      <div>
        <Link
          href={user.role === 'admin' ? '/admin' : '/chofe'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Retounen nan Tablo de Bò
        </Link>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xs space-y-8">
        {/* Header / Avatar */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Image or Initials Fallback */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm relative bg-slate-100 flex items-center justify-center">
              {user.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={user.full_name}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-600">
                  {initialsOf(user.full_name)}
                </span>
              )}

              {uploadingPhoto && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
          </div>

          {/* User Details & Photo Actions */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                  user.role === 'admin'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-emerald-100 text-emerald-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                {user.role === 'admin' ? 'Trezorye / Administratè' : 'Chofè'}
              </span>

              {user.created_at && (
                <span className="text-[11px] text-slate-400">
                  Manm depi: {formatDateCreole(user.created_at, 'long')}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {user.full_name}
              </h1>
              <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
              </p>
            </div>

            {/* Photo Action Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition"
              >
                <Camera className="w-3.5 h-3.5" />
                {user.avatar_url ? 'Chanje Foto' : 'Telechaje Foto'}
              </button>

              {user.avatar_url && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={uploadingPhoto}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600 text-xs font-semibold transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Retire Foto
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              Fòma aksepte: JPEG, PNG, WebP (Maks: 3 MB)
            </p>
          </div>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Edit Display Name Section */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-slate-900">Non Afiche a</h2>
            {!isEditingName && (
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                Modifye Non
              </button>
            )}
          </div>

          {isEditingName ? (
            <form onSubmit={handleSaveName} className="space-y-3">
              <div>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full max-w-md px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={savingName}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  {savingName && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Anrejistre
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingName(false);
                    setEditName(user.full_name);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Anile
                </button>
              </div>
            </form>
          ) : (
            <p className="text-xs text-slate-600">{user.full_name}</p>
          )}
        </div>

        {/* Personal Contribution Summary (Driver Fund Statistics) */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h2 className="text-sm font-bold text-slate-900">
            Bilan Pèsonèl Kontribisyon Ou
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Apwouve
              </span>
              <div className="text-xl font-extrabold text-slate-900 font-mono">
                {formatBRL(totalContributedCentavos)}
              </div>
              <p className="text-[10px] text-slate-400">
                {approvedSubs.length} jou travay konfime
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                An Atant
              </span>
              <div className="text-xl font-extrabold text-amber-700 font-mono">
                {pendingSubs.length}
              </div>
              <p className="text-[10px] text-slate-400">
                {pendingSubs.length > 0 ? 'Ap tann trezorye' : 'Pa gen anyen an atant'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Soumisyon
              </span>
              <div className="text-xl font-extrabold text-slate-900 font-mono">
                {submissions.length}
              </div>
              <p className="text-[10px] text-slate-400">Dosye soumèt nan sistèm nan</p>
            </div>
          </div>

          {/* Dekonekte Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Ou fini sa ou t ap fè a?
            </span>
            <button
              type="button"
              onClick={async () => {
                await repository.signOut();
                router.replace('/auth/login');
                router.refresh();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Dekonekte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
