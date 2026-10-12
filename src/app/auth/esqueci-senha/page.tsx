'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { repository } from '@/lib/repository';
import { Mail, ArrowLeft, CheckCircle2, AlertTriangle, Loader2, KeyRound } from 'lucide-react';

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/redefinir-senha`
          : undefined;

      const res = await repository.requestPasswordReset(email, redirectUrl);

      if (res.error) {
        setErrorMsg(res.error);
        return;
      }

      // Always show success message to prevent user enumeration
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Ou bliye modpas ou?
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Antre adrès imèl ou pou nou ka voye yon lyen ki pèmèt ou kreye yon nouvo modpas.
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-emerald-950">Demann lan voye avèk siksè!</p>
                <p className="text-emerald-800 leading-relaxed">
                  Si adrès imèl sa a asosye ak yon kont, w ap resevwa yon mesaj pou renouvle modpas ou.
                </p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              Tcheke bwat mesaj ou a (ak bwat spam/kourye endezirab si sa nesesè).
            </p>
            <Link
              href="/auth/login"
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-xs transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retounen nan paj koneksyon an
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label htmlFor="recovery-email" className="block font-bold uppercase text-slate-600 mb-1.5">
                Adrès Imèl *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  id="recovery-email"
                  type="email"
                  required
                  placeholder="chofe@egzanp.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Voye lyen an
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Retounen nan paj koneksyon an
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
