'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { demoStorage } from '@/lib/demo-storage';
import { UserProfile } from '@/lib/types';
import {
  Car,
  Home,
  PlusCircle,
  FileCheck2,
  CalendarClock,
  Users,
  BarChart3,
  History,
  Shield,
  Menu,
  X,
  CreditCard,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setUser(demoStorage.getCurrentUser());
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-sm tracking-tighter group-hover:bg-black transition">
                CL
              </div>
              <div>
                <span className="block text-sm font-bold tracking-tight text-slate-900 leading-tight">
                  Chofè Legliz
                </span>
                <span className="block text-[11px] text-slate-500 font-medium">
                  Fon Kominotè • Brezil
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
              <Link
                href="/"
                className={`px-3 py-2 rounded-xl transition ${
                  pathname === '/'
                    ? 'bg-slate-100 text-slate-950 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Akèy
              </Link>

              <Link
                href="/chofe"
                className={`px-3 py-2 rounded-xl transition ${
                  pathname === '/chofe'
                    ? 'bg-slate-100 text-slate-950 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Kont Mwen
              </Link>

              <Link
                href="/chofe/soumet"
                className={`px-3 py-2 rounded-xl transition ${
                  pathname === '/chofe/soumet'
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'text-emerald-700 hover:bg-emerald-50/60'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5" />
                  Soumèt Kontribisyon
                </span>
              </Link>

              {isAdmin && (
                <div className="flex items-center gap-1 border-l border-slate-200 ml-2 pl-2">
                  <Link
                    href="/admin/atant"
                    className={`px-3 py-2 rounded-xl transition ${
                      pathname === '/admin/atant'
                        ? 'bg-amber-50 text-amber-900 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
                      Kontribisyon an Atant
                    </span>
                  </Link>

                  <Link
                    href="/admin/retre"
                    className={`px-3 py-2 rounded-xl transition ${
                      pathname === '/admin/retre'
                        ? 'bg-slate-100 text-slate-900 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5 text-slate-600" />
                      Retrè Pwograme
                    </span>
                  </Link>

                  <Link
                    href="/admin/manm"
                    className={`px-3 py-2 rounded-xl transition ${
                      pathname === '/admin/manm'
                        ? 'bg-slate-100 text-slate-900 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Manm
                  </Link>

                  <Link
                    href="/admin/rapo"
                    className={`px-3 py-2 rounded-xl transition ${
                      pathname === '/admin/rapo'
                        ? 'bg-slate-100 text-slate-900 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Rapò
                  </Link>

                  <Link
                    href="/admin/odit"
                    className={`px-3 py-2 rounded-xl transition ${
                      pathname === '/admin/odit'
                        ? 'bg-slate-100 text-slate-900 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Odit
                  </Link>
                </div>
              )}
            </nav>

            {/* Profile badge / Auth */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200/70 bg-slate-50/50">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${
                      isAdmin ? 'bg-amber-600' : 'bg-slate-900'
                    }`}
                  >
                    {user.full_name.charAt(0)}
                  </div>
                  <div className="text-left text-xs">
                    <span className="font-semibold text-slate-900 leading-none block">
                      {user.full_name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {isAdmin ? 'Trezorye' : 'Chofè'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950"
                  >
                    Konekte
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl"
                  >
                    Kreye Kont
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu trigger */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                aria-label="Meni"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-2 text-xs font-medium">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-800"
            >
              <Home className="w-4 h-4 text-slate-500" />
              Akèy
            </Link>
            <Link
              href="/chofe"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-800"
            >
              <Car className="w-4 h-4 text-slate-500" />
              Kont Mwen
            </Link>
            <Link
              href="/chofe/soumet"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 font-semibold"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              Soumèt Kontribisyon
            </Link>

            {isAdmin && (
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Administrasyon & Trezori
                </span>
                <Link
                  href="/admin/atant"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-amber-900 bg-amber-50"
                >
                  <FileCheck2 className="w-4 h-4 text-amber-600" />
                  Kontribisyon an Atant
                </Link>
                <Link
                  href="/admin/retre"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-800"
                >
                  <CalendarClock className="w-4 h-4 text-slate-600" />
                  Retrè Pwograme
                </Link>
                <Link
                  href="/admin/manm"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-800"
                >
                  <Users className="w-4 h-4 text-slate-500" />
                  Manm Gwoup la
                </Link>
                <Link
                  href="/admin/rapo"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-800"
                >
                  <BarChart3 className="w-4 h-4 text-slate-500" />
                  Rapò Finansye
                </Link>
                <Link
                  href="/admin/odit"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-800"
                >
                  <History className="w-4 h-4 text-slate-500" />
                  Istwa Odit
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar (Fintech-style, thumb-friendly) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2 flex items-center justify-around text-[10px] font-semibold text-slate-500 shadow-lg">
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${
            pathname === '/' ? 'text-slate-900 font-bold' : 'hover:text-slate-900'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Akèy</span>
        </Link>

        <Link
          href="/chofe/soumet"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${
            pathname === '/chofe/soumet'
              ? 'text-emerald-700 font-bold'
              : 'hover:text-emerald-700'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-emerald-600" />
          <span>Soumèt</span>
        </Link>

        <Link
          href="/chofe"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${
            pathname === '/chofe' ? 'text-slate-900 font-bold' : 'hover:text-slate-900'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Kont Mwen</span>
        </Link>

        {isAdmin ? (
          <Link
            href="/admin/retre"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${
              pathname.startsWith('/admin') ? 'text-slate-900 font-bold' : 'hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-600" />
            <span>Admin</span>
          </Link>
        ) : (
          <Link
            href="/auth/login"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${
              pathname === '/auth/login' ? 'text-slate-900 font-bold' : 'hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Konekte</span>
          </Link>
        )}
      </nav>
    </>
  );
};
