'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { repository } from '@/lib/repository';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    // Check if user has an active session or recovery token
    if (!isSupabaseConfigured()) {
      setHasValidSession(true);
      setCheckingSession(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setHasValidSession(false);
      setCheckingSession(false);
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data, error }: { data: { session: any }; error: any }) => {
      if (data?.session && !error) {
        setHasValidSession(true);
      }
      setCheckingSession(false);
    });

    // Also listen for PASSWORD_RECOVERY event
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setHasValidSession(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (password.length < 6) {
      setErrorMsg('Modpas la dwe gen omwen 6 karaktè.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('De modpas yo pa koresponn. Tanpri verifye yo.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await repository.updatePassword(password);
      if (res.error) {
        setErrorMsg(res.error);
        return;
      }

      // Clear sensitive form state immediately
      setPassword('');
      setConfirmPassword('');
      setSuccess(true);

      // Automatically sign out so user can log in with new password cleanly
      await repository.signOut();
    } finally {
      setSubmitting(false);
    }
  };

  // Password strength calculation
  const hasMinLength = password.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isStrong = hasMinLength && hasLetter && hasNumber;

  return (
    <div className="max-w-md mx-auto my-8 space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Kreye yon nouvo modpas
          </h1>
          <p className="text-xs text-slate-500">
            Chwazi yon nouvo modpas an sekirite pou kont ou an
          </p>
        </div>

        {checkingSession ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <p className="text-xs">Verifikasyon lyen an...</p>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-emerald-950">
                  Modpas ou chanje avèk siksè!
                </p>
                <p className="text-emerald-800 leading-relaxed">
                  Kounye a ou ka konekte nan kont ou avèk nouvo modpas ou fenk kreye a.
                </p>
              </div>
            </div>

            <Link
              href="/auth/login"
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-xs transition flex items-center justify-center gap-2"
            >
              Konekte Kounye a
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : !hasValidSession && isSupabaseConfigured() ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-950">Lyen an pa valab oswa li ekspire</p>
                <p className="text-amber-800 leading-relaxed">
                  Lyen rekiperasyon modpas la ka ekspire oswa li te deja itilize. Tanpri mande yon nouvo lyen.
                </p>
              </div>
            </div>

            <Link
              href="/auth/esqueci-senha"
              className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xs transition flex items-center justify-center gap-2"
            >
              Mande yon nouvo lyen
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label htmlFor="new-password" className="block font-bold uppercase text-slate-600 mb-1.5">
                Nouvo Modpas *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Omwen 6 karaktè"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Kache modpas' : 'Montre modpas'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-1">
                    <div
                      className={`flex-1 rounded-full ${
                        hasMinLength ? 'bg-amber-500' : 'bg-slate-200'
                      }`}
                    />
                    <div
                      className={`flex-1 rounded-full ${
                        hasMinLength && (hasLetter || hasNumber)
                          ? 'bg-amber-500'
                          : 'bg-slate-200'
                      }`}
                    />
                    <div
                      className={`flex-1 rounded-full ${
                        isStrong ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {isStrong
                      ? 'Modpas solid!'
                      : 'Sijesyon: Konbine lèt ak chif pou plis sekirite (min. 6 karaktè).'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirm-new-password" className="block font-bold uppercase text-slate-600 mb-1.5">
                Konfime Nouvo Modpas la *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  id="confirm-new-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Tape menm modpas la ankò"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600"
                  aria-label={showConfirmPassword ? 'Kache modpas' : 'Montre modpas'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Anrejistre nouvo modpas la
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
