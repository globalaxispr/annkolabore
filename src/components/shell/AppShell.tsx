'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { repository } from '@/lib/repository';
import { UserProfile } from '@/lib/types';
import { SidebarContent } from './SidebarContent';
import { GlobalContributionBalance } from '@/components/GlobalContributionBalance';
import {
  Menu,
  X,
  Home,
  PlusCircle,
  Car,
  Shield,
  User,
  LogIn,
  HeartHandshake,
} from 'lucide-react';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function loadUserState() {
      try {
        const authUser = await repository.getAuthUser();
        if (!isCurrent) return;
        setUser(authUser);

        if (authUser?.role === 'admin') {
          try {
            const pending = await repository.getPendingSubmissions();
            if (isCurrent) setPendingCount(pending.length);
          } catch {
            if (isCurrent) setPendingCount(0);
          }
        } else {
          setPendingCount(0);
        }
      } catch {
        if (isCurrent) {
          setUser(null);
          setPendingCount(0);
        }
      } finally {
        if (isCurrent) {
          setMounted(true);
        }
      }
    }

    loadUserState();

    return () => {
      isCurrent = false;
    };
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      await repository.signOut();
      setUser(null);
      setMobileDrawerOpen(false);
      window.location.href = '/auth/login';
    } catch (err) {
      console.error('Erè pandan dekoneksyon:', err);
    }
  };

  const isAdmin = user?.role === 'admin';
  const currentYear = mounted ? new Date().getFullYear() : 2026;

  return (
    <div className="min-h-screen bg-white flex overflow-x-hidden">
      {/* 1. DESKTOP PERMANENT SIDEBAR */}
      <aside
        aria-label="Sidebar prensipal"
        className="hidden lg:flex lg:w-64 lg:flex-col fixed inset-y-0 left-0 z-30 bg-white border-r border-slate-200/80 shadow-2xs"
      >
        <SidebarContent
          user={user}
          pathname={pathname}
          pendingCount={pendingCount}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* 2. MAIN APPLICATION CONTENT AREA */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen w-full">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 h-16 flex items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white font-black text-sm">
              CL
            </span>
            <div className="leading-tight">
              <span className="block text-sm font-bold text-slate-900">Chofè Legliz</span>
              <span className="block text-[10px] text-slate-500">Fon Kominotè</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <GlobalContributionBalance variant="header" label="Fon" />

            <button
              type="button"
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label={mobileDrawerOpen ? 'Fèmen meni' : 'Ouvri meni'}
            >
              {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer Overlay */}
        {mobileDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileDrawerOpen(false)}
            />

            {/* Drawer Panel */}
            <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
                    CL
                  </div>
                  <span className="text-sm font-bold text-slate-900">Meni Navigasyon</span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <SidebarContent
                  user={user}
                  pathname={pathname}
                  pendingCount={pendingCount}
                  onNavigate={() => setMobileDrawerOpen(false)}
                  onSignOut={handleSignOut}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-8 min-w-0">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-100 py-8 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 space-y-2.5">
            <p className="font-semibold text-slate-700">
              Sistèm Jesyon Kontribisyon Chofè Legliz — Brezil
            </p>
            <p className="text-slate-400 text-[11px]">
              Règ: Chak chofè lib pou kontribye nenpòt montan selon kapasite li. Pa gen montan minimòm obligatwa.
            </p>
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 text-xs text-slate-400">
              <span className="font-medium text-slate-600">
                Chofè Legliz © {currentYear}
              </span>
              <span className="hidden sm:inline opacity-30 text-slate-300">•</span>
              <span className="text-slate-500 font-medium">
                Developed by Johnny Frantz T Rene
              </span>
            </div>
          </div>
        </footer>

        {/* Mobile Bottom Thumb Navigation */}
        <nav
          aria-label="Navigasyon mobil"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-3 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] flex items-center justify-around text-[10px] font-semibold text-slate-500 shadow-[0_-4px_16px_rgba(15,23,42,0.06)]"
        >
          <Link
            href="/"
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg ${
              pathname === '/' ? 'text-slate-900 font-bold' : 'hover:text-slate-900'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Akèy</span>
          </Link>

          {user ? (
            <>
              <Link
                href="/chofe/soumet"
                prefetch={false}
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg ${
                  pathname === '/chofe/soumet' ? 'text-emerald-700 font-bold' : 'hover:text-emerald-700'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <span>Soumèt</span>
              </Link>

              <Link
                href="/chofe"
                prefetch={false}
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg ${
                  pathname === '/chofe' ? 'text-slate-900 font-bold' : 'hover:text-slate-900'
                }`}
              >
                <Car className="w-4 h-4" />
                <span>Kont Mwen</span>
              </Link>
            </>
          ) : (
            <Link
              href="/kontribye"
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg ${
                pathname === '/kontribye' ? 'text-emerald-700 font-bold' : 'hover:text-emerald-700'
              }`}
            >
              <HeartHandshake className="w-4 h-4 text-emerald-600" />
              <span>Kontribiye</span>
            </Link>
          )}

          {isAdmin ? (
            <Link
              href="/admin"
              prefetch={false}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg ${
                pathname.startsWith('/admin') ? 'text-amber-800 font-bold' : 'hover:text-amber-800'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-600" />
              <span>Admin</span>
            </Link>
          ) : user ? (
            <Link
              href="/perfil"
              prefetch={false}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg ${
                pathname === '/perfil' ? 'text-slate-900 font-bold' : 'hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4 text-slate-600" />
              <span>Pwofil</span>
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg ${
                pathname === '/auth/login' ? 'text-slate-900 font-bold' : 'hover:text-slate-900'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Konekte</span>
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
};
