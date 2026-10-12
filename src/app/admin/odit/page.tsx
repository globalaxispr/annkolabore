'use client';

import React, { useEffect, useState } from 'react';
import { repository } from '@/lib/repository';
import { AuditLogEntry } from '@/lib/types';
import { formatDateCreole, formatTime } from '@/lib/formatters';
import { History, ShieldCheck, User, Activity } from 'lucide-react';

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      const audit = await repository.getAllAuditLogs();
      setLogs(audit);
      setLoading(false);
    }
    loadLogs();
  }, []);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'APPROVE_CONTRIBUTION':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
            Apwobasyon
          </span>
        );
      case 'REJECT_CONTRIBUTION':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
            Refi
          </span>
        );
      case 'RECORD_EXPENSE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
            Depans
          </span>
        );
      case 'DIRECT_CONTRIBUTION':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
            Antre Dirèk
          </span>
        );
      case 'SUBMIT_CONTRIBUTION':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
            Soumisyon
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
            Trasabilite Enchanjab
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
            Istwa Odit
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tout aksyon finansye, apwobasyon, refi, ak depans anrejistre avèk non aktè a ak dat egzat
          </p>
        </div>

        <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200 flex items-center gap-3">
          <div className="text-2xl font-black text-slate-800">{logs.length}</div>
          <div className="text-xs font-semibold text-slate-600 leading-tight">
            aksyon anrejistre
          </div>
        </div>
      </div>

      {/* Log list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Chajman tras odit la...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-slate-600">Pa gen okenn tras pou kounye a</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getActionBadge(log.action)}
                    <span className="text-xs font-bold text-slate-900">{log.actor_name}</span>
                    <span className="text-[11px] text-slate-400">({log.actor_role})</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatDateCreole(log.created_at)} {formatTime(log.created_at)}
                  </div>
                </div>

                <p className="text-xs text-slate-700 font-medium pl-1">{log.details}</p>
                <div className="text-[10px] text-slate-400 font-mono pl-1">
                  ID: {log.id} • Antite: {log.entity_type} ({log.entity_id})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
