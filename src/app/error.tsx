'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log sanitized error digest for production monitoring without leaking to user interface
    if (process.env.NODE_ENV === 'development') {
      console.error('Erè sistèm:', error);
    }
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xs text-center space-y-6">
        <div className="w-16 h-16 bg-rose-100 rounded-2xl mx-auto flex items-center justify-center text-rose-600 shadow-md shadow-rose-600/10">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Yon erè enprevi pase
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sistèm nan rankontre yon difikilte pou chaje enfòmasyon sa yo. Tanpri eseye ankò oswa retounen nan paj prensipal la.
          </p>
          {error.digest && (
            <p className="text-[10px] text-slate-400 font-mono">
              Kòd referans: {error.digest}
            </p>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-xs transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Eseye Ankò
          </button>
          <Link
            href="/"
            className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Akèy
          </Link>
        </div>
      </div>
    </div>
  );
}
