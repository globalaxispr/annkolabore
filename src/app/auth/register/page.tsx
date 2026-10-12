'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { demoStorage } from '@/lib/demo-storage';
import { registerSchema } from '@/lib/validations';
import { UserPlus, User, Mail, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate using Zod schema
    const validationResult = registerSchema.safeParse({
      full_name: fullName,
      email: email,
      password: password,
      confirm_password: confirmPassword,
    });

    if (!validationResult.success) {
      setErrorMsg(validationResult.error.issues[0]?.message || 'Erè nan enfòmasyon yo');
      return;
    }

    setSubmitting(true);

    // Register user in demo storage
    const res = demoStorage.registerUser(fullName.trim(), email.trim());
    if (res.error) {
      setErrorMsg(res.error);
      setSubmitting(false);
      return;
    }

    // Success -> redirect to driver dashboard
    router.push('/chofe');
  };

  return (
    <div className="max-w-md mx-auto my-8 space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Kreye Kont</h1>
          <p className="text-xs text-slate-500">
            Enskri kòm chofè pou w ka kòmanse soumèt kontribisyon ou
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase text-slate-600 mb-1.5">
              Non Konplè *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Non ak Siyati ou"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

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
            <label className="block font-bold uppercase text-slate-600 mb-1.5">
              Modpas (omwen 6 karaktè) *
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

          <div>
            <label className="block font-bold uppercase text-slate-600 mb-1.5">
              Konfime Modpas la *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
            * Tout nouvo kont enskri resevwa wòl <strong>Chofè</strong> otomatikman. Se sèlman administratè legliz la ki ka atribye privilèj trezorye.
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-xs transition"
          >
            {submitting ? 'Kreyasyon an kouran...' : 'Kreye Kont Mwen'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2">
          Ou gen yon kont deja?{' '}
          <Link href="/auth/login" className="font-bold text-emerald-700 hover:underline">
            Konekte La a
          </Link>
        </div>
      </div>
    </div>
  );
}
