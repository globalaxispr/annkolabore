'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { repository } from '@/lib/repository';
import { demoStorage } from '@/lib/demo-storage';
import { Lock, Mail, AlertTriangle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
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
        if (res.user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/chofe');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoLogin = (userId: string) => {
    repository.switchDemoUser(userId);
    const user = repository.getCurrentUser();
    if (user?.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/chofe');
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
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
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

        {/* Demo Quick login shortcuts - Only shown during development demo mode */}
        {repository.isDemo && (
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase text-center">
              Aksè Rapid (Mod Demo Sèlman)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('usr-driver-01')}
                className="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-xl text-left text-xs transition"
              >
                <div className="font-bold text-slate-800">Jean Baptiste Pierre</div>
                <div className="text-[11px] text-emerald-700 font-medium">Konekte kòm Chofè</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('usr-admin-01')}
                className="p-2.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 rounded-xl text-left text-xs transition"
              >
                <div className="font-bold text-slate-800">Frantz Augustin</div>
                <div className="text-[11px] text-amber-700 font-medium">Konekte kòm Trezorye</div>
              </button>
            </div>
          </div>
        )}

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
