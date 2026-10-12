'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { demoStorage } from '@/lib/demo-storage';
import { repository } from '@/lib/repository';
import { Car, Lock, Mail, ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // In demo mode: find user by email
    const allUsers = demoStorage.getAllProfiles();
    const found = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!found) {
      setErrorMsg('Nou pa jwenn okenn kont avèk adrès imèl sa a.');
      return;
    }

    demoStorage.setCurrentUser(found.id);
    if (found.role === 'admin') {
      router.push('/admin/atant');
    } else {
      router.push('/chofe');
    }
  };

  const handleQuickDemoLogin = (userId: string) => {
    demoStorage.setCurrentUser(userId);
    const user = demoStorage.getCurrentUser();
    if (user?.role === 'admin') {
      router.push('/admin/atant');
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
                placeholder="chofe@legliz.test"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-600 mb-1.5">
              Modpas *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
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
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs transition"
          >
            Konekte
          </button>
        </form>

        {/* Demo Quick login shortcuts */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase text-center">
            Aksè Rapid (Mod Demo)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickDemoLogin('usr-driver-01')}
              className="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-xl text-left text-xs transition"
            >
              <div className="font-bold text-slate-800">Jean Baptiste Pierre</div>
              <div className="text-[11px] text-emerald-700 font-medium">Konekte kòm Chofè</div>
            </button>
            <button
              onClick={() => handleQuickDemoLogin('usr-admin-01')}
              className="p-2.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 rounded-xl text-left text-xs transition"
            >
              <div className="font-bold text-slate-800">Frantz Augustin</div>
              <div className="text-[11px] text-amber-700 font-medium">Konekte kòm Trezorye</div>
            </button>
          </div>
        </div>

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
