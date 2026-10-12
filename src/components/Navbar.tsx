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
  DollarSign,
  Users,
  BarChart3,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  History,
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:bg-emerald-700 transition">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-base font-bold tracking-tight text-slate-900 leading-tight">
                Chofè Legliz
              </span>
              <span className="block text-xs font-medium text-emerald-700">
                Kontribisyon R$ 10 / Jou
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                pathname === '/'
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Home className="w-4 h-4 text-emerald-600" />
                Akèy
              </span>
            </Link>

            <Link
              href="/chofe"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                pathname === '/chofe'
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Car className="w-4 h-4 text-slate-500" />
                Kont Mwen
              </span>
            </Link>

            <Link
              href="/chofe/soumet"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                pathname === '/chofe/soumet'
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                Soumèt Kontribisyon
              </span>
            </Link>

            {isAdmin && (
              <div className="flex items-center gap-1 border-l border-slate-200 ml-2 pl-2">
                <Link
                  href="/admin/atant"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    pathname === '/admin/atant'
                      ? 'bg-amber-50 text-amber-900 font-semibold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-amber-600" />
                    Kontribisyon an Atant
                  </span>
                </Link>

                <Link
                  href="/admin/depans"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    pathname === '/admin/depans'
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-slate-500" />
                    Depans yo
                  </span>
                </Link>

                <Link
                  href="/admin/manm"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    pathname === '/admin/manm'
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-500" />
                    Manm Gwoup la
                  </span>
                </Link>

                <Link
                  href="/admin/rapo"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    pathname === '/admin/rapo'
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-slate-500" />
                    Rapò Finansye
                  </span>
                </Link>

                <Link
                  href="/admin/odit"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    pathname === '/admin/odit'
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-500" />
                    Istwa Odit
                  </span>
                </Link>
              </div>
            )}
          </nav>

          {/* User profile & actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-full">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    isAdmin ? 'bg-amber-600' : 'bg-emerald-600'
                  }`}
                >
                  {user.full_name.charAt(0)}
                </div>
                <div className="text-left text-xs">
                  <div className="font-semibold text-slate-800 leading-tight">
                    {user.full_name}
                  </div>
                  <div className="text-slate-500 leading-none">
                    {isAdmin ? 'Trezorye / Admin' : 'Chofè'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-3 py-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900"
                >
                  Konekte
                </Link>
                <Link
                  href="/auth/register"
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm"
                >
                  Kreye Kont
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Meni"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-2 pb-6 space-y-2 shadow-lg">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Home className="w-4 h-4 text-emerald-600" />
            Akèy
          </Link>

          <Link
            href="/chofe"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Car className="w-4 h-4 text-emerald-600" />
            Kont Mwen
          </Link>

          <Link
            href="/chofe/soumet"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            Soumèt Kontribisyon
          </Link>

          {isAdmin && (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Kont Gwoup la (Administrasyon)
              </div>
              <Link
                href="/admin/atant"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-amber-800 bg-amber-50"
              >
                <FileCheck2 className="w-4 h-4 text-amber-600" />
                Kontribisyon an Atant
              </Link>
              <Link
                href="/admin/depans"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <DollarSign className="w-4 h-4 text-slate-500" />
                Depans yo
              </Link>
              <Link
                href="/admin/manm"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Users className="w-4 h-4 text-slate-500" />
                Manm Gwoup la
              </Link>
              <Link
                href="/admin/rapo"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <BarChart3 className="w-4 h-4 text-slate-500" />
                Rapò Finansye
              </Link>
              <Link
                href="/admin/odit"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <History className="w-4 h-4 text-slate-500" />
                Istwa Odit
              </Link>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100">
            {user ? (
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                <div className="text-xs">
                  <div className="font-semibold text-slate-800">{user.full_name}</div>
                  <div className="text-slate-500">{user.email}</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700"
                >
                  Konekte
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 bg-emerald-600 rounded-lg text-sm font-semibold text-white"
                >
                  Kreye Kont
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
