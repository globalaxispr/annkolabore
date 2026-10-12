'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { repository } from '@/lib/repository';
import { UserProfile } from '@/lib/types';
import { LogOut, Loader2, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { initialsOf } from '@/components/shell/SidebarContent';

interface UserAccountSectionProps {
  user: UserProfile | null;
  onNavigate?: () => void;
  layout?: 'sidebar' | 'drawer' | 'navbar';
}

export const UserAccountSection: React.FC<UserAccountSectionProps> = ({
  user,
  onNavigate,
  layout = 'sidebar',
}) => {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignOut = async () => {
    setSigningOut(true);
    setErrorMsg(null);
    try {
      const res = await repository.signOut();
      if (res && res.error) {
        setErrorMsg(res.error);
        setSigningOut(false);
        return;
      }
      if (onNavigate) onNavigate();
      // Invalidate Next.js cache and navigate to /auth/login
      router.refresh();
      router.replace('/auth/login');
    } catch (err: any) {
      console.error('Erè pandan dekoneksyon an:', err);
      setErrorMsg('Erè pandan dekoneksyon an. Tanpri eseye ankò.');
      setSigningOut(false);
    }
  };

  // If user is not authenticated: show clean login / register links
  if (!user) {
    return (
      <div className="space-y-2">
        <Link
          href="/auth/login"
          onClick={onNavigate}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold transition"
        >
          <LogIn className="w-3.5 h-3.5" />
          Konekte
        </Link>
        <Link
          href="/auth/register"
          onClick={onNavigate}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Kreye Kont
        </Link>
      </div>
    );
  }

  const roleText = user.role === 'admin' ? 'Administratè' : 'Chofè';

  return (
    <div className="space-y-2">
      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* User Card */}
      <Link
        href="/perfil"
        onClick={onNavigate}
        className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 transition group"
        title="Gade oswa modifye pwofil ou"
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.full_name}
            className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200 shadow-2xs"
          />
        ) : (
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 shadow-2xs ${
              user.role === 'admin' ? 'bg-slate-900' : 'bg-emerald-600'
            }`}
          >
            {initialsOf(user.full_name)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
            {user.full_name}
          </p>
          <span
            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
              user.role === 'admin'
                ? 'bg-amber-100 text-amber-900'
                : 'bg-emerald-100 text-emerald-900'
            }`}
          >
            {roleText}
          </span>
        </div>
      </Link>

      {/* Explicit, visible Logout button ("Dekonekte") */}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 text-slate-600 hover:text-rose-700 text-xs font-bold transition disabled:opacity-50"
        aria-label="Dekonekte nan kont lan"
        title="Dekonekte"
      >
        {signingOut ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
            <span>Dekoneksyon an kouran...</span>
          </>
        ) : (
          <>
            <LogOut className="w-3.5 h-3.5" />
            <span>Dekonekte</span>
          </>
        )}
      </button>
    </div>
  );
};
