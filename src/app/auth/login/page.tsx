'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { repository } from '@/lib/repository';
import { Lock, Mail, AlertTriangle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await repository.signIn(email, password);
      if (res.error) {
        setErrorMsg(res.error);
        return;
      }

      if (res.user) {
        // Read redirect query parameter if present
        let destination = res.user.role === 'admin' ? '/admin' : '/chofe';
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const redirectParam = params.get('redirect');
          if (
            redirectParam &&
            redirectParam.startsWith('/') &&
            !redirectParam.startsWith('//') &&
            !redirectParam.startsWith('/\\')
          ) {
            destination = redirectParam;
          }
        }

        // Full navigation purges any unauthenticated prefetch cache and ensures clean cookie headers
        window.location.href = destination;
        return;
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Konekte</h1>
          <p className="text-xs text-slate-500">
            Antre nan kont ou pou w ka soumèt oswa jere kontribisyon
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            {errorMsg.includes('Vercel') && (
              <div className="pt-2 border-t border-rose-200/80 text-[11px] text-rose-700 flex items-center justify-between">
                <span>Tcheke estati koneksyon sèvè a:</span>
                <a
                  href="/api/supabase-config"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline text-rose-900 hover:text-black ml-1"
                >
                  Ouvri Rapò Diagnostik ↗
                </a>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase text-slate-600 mb-1.5">
              Adrès Imèl *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                placeholder="chofe@egzanp.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="block font-bold uppercase text-slate-600">
                Modpas *
              </label>
              <Link
                href="/auth/esqueci-senha"
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold hover:underline"
              >
                Ou bliye modpas ou?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                id="login-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            Konekte
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2">
          Ou poko gen yon kont?{' '}
          <Link href="/auth/register" className="font-bold text-emerald-700 hover:underline">
            Kreye Kont Ou La a
          </Link>
        </div>
      </div>
    </div>
  );
}
