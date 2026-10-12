import React from 'react';
import Link from 'next/link';
import { Home, Compass, ShieldAlert, HeartHandshake } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xs text-center space-y-6">
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 bg-emerald-100 rounded-3xl rotate-6 animate-pulse opacity-70" />
          <div className="relative w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
            <Compass className="w-8 h-8" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold tracking-wider uppercase">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            Erè 404
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            404 — Paj sa a pa egziste
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Nou pa jwenn paj ou t ap chèche a. Li posib adrès la pa kòrèk oswa paj la pa disponib ankò.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-xs transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Retounen nan Akèy
          </Link>
          <Link
            href="/kontribye"
            className="py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-sm border border-emerald-200 transition flex items-center justify-center gap-2"
          >
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
            Fè yon Don PIX
          </Link>
        </div>
      </div>
    </div>
  );
}
