'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  DollarSign,
  Users,
  BarChart3,
  History,
  Shield,
} from 'lucide-react';

export default function AdminDashboardIndex() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          Espas Administratè & Trezorye
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
          Kont Gwoup la (Administrasyon)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Chwazi yon seksyon pou jere kontribisyon, depans, manm, oswa rapò finansye yo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Link
          href="/admin/atant"
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs hover:border-amber-300 hover:shadow-md transition group space-y-3"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Kontribisyon an Atant</h2>
            <p className="text-xs text-slate-500 mt-1">
              Revize epi apwouve oswa refize kontribisyon chofè yo soumèt.
            </p>
          </div>
        </Link>

        <Link
          href="/admin/depans"
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs hover:border-rose-300 hover:shadow-md transition group space-y-3"
        >
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Depans yo</h2>
            <p className="text-xs text-slate-500 mt-1">
              Anrejistre tout depans ak retrè ofisyèl pou legliz la.
            </p>
          </div>
        </Link>

        <Link
          href="/admin/manm"
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs hover:border-emerald-300 hover:shadow-md transition group space-y-3"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Manm Gwoup la</h2>
            <p className="text-xs text-slate-500 mt-1">
              Gade lis tout chofè yo epi anrejistre kontribisyon dirèk.
            </p>
          </div>
        </Link>

        <Link
          href="/admin/rapo"
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs hover:border-blue-300 hover:shadow-md transition group space-y-3"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Rapò Finansye</h2>
            <p className="text-xs text-slate-500 mt-1">
              Bilan konplè tout fon, rantre ak sòti pou chak mwa.
            </p>
          </div>
        </Link>

        <Link
          href="/admin/odit"
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-300 hover:shadow-md transition group space-y-3"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Istwa Odit</h2>
            <p className="text-xs text-slate-500 mt-1">
              Gade tout aksyon ki pase nan sistèm nan avèk dat ak detay.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
