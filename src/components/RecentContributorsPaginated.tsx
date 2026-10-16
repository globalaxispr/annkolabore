'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { repository } from '@/lib/repository';
import { PublicApprovedContributor } from '@/lib/types';
import { formatBRL, formatDateCreole } from '@/lib/formatters';
import { StatusBadge } from './StatusBadge';
import { initialsOf } from './shell/SidebarContent';
import {
  ShieldCheck,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  User,
} from 'lucide-react';

interface RecentContributorsPaginatedProps {
  pageSize?: number;
}

export const RecentContributorsPaginated: React.FC<RecentContributorsPaginatedProps> = ({
  pageSize = 6,
}) => {
  const [contributors, setContributors] = useState<PublicApprovedContributor[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await repository.getPaginatedPublicContributors(targetPage, pageSize);
        setContributors(res.data);
        setTotalCount(res.totalCount);
        setPage(targetPage);
      } catch (err: unknown) {
        console.error('Erè pandan rekiperasyon kontribisyon yo:', err);
        const msg = (err as Error)?.message || 'Pa ka jwenn lis kontribisyon yo kounye a. Tanpri verifye koneksyon an.';
        setErrorMsg(msg);
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    fetchPage(page);

    // Auto-refresh when an administrator approves a contribution in real time
    const unsubscribe = repository.subscribeToGlobalBalance(() => {
      fetchPage(page);
    });

    return () => {
      unsubscribe();
    };
  }, [fetchPage, page]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handlePrevPage = () => {
    if (page > 1 && !loading) {
      fetchPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages && !loading) {
      fetchPage(page + 1);
    }
  };

  const handleGoToPage = (p: number) => {
    if (p !== page && p >= 1 && p <= totalPages && !loading) {
      fetchPage(p);
    }
  };

  // Build page jump numbers (e.g. 1, 2, 3...)
  const pageNumbers: number[] = [];
  const maxButtons = 5;
  let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
  const endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <section
      role="region"
      aria-label="Dènye kontribisyon ki apwouve yo"
      className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Dènye kontribisyon ki apwouve yo
            </h2>
            {totalCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                {totalCount} ofisyèl
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Men dènye kontribisyon responsab fon an verifye epi apwouve.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchPage(page)}
            disabled={loading}
            title="Rafrechi lis la"
            aria-label="Rafrechi lis kontribisyon yo"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100/60">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Transparans pou tout kominote a
          </div>
        </div>
      </div>

      {/* Content / Rows */}
      {loading ? (
        // Loading Skeleton with 6 items
        <div className="divide-y divide-slate-100 animate-pulse">
          {Array.from({ length: pageSize }).map((_, i) => (
            <div key={i} className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 bg-slate-100 rounded" />
                  <div className="h-3 w-24 bg-slate-50 rounded" />
                </div>
              </div>
              <div className="space-y-1.5 text-right">
                <div className="h-4 w-20 bg-slate-100 rounded ml-auto" />
                <div className="h-3 w-14 bg-slate-50 rounded ml-auto" />
              </div>
            </div>
          ))}
        </div>
      ) : errorMsg ? (
        <div className="py-12 px-6 text-center text-rose-800 bg-rose-50/40 space-y-3">
          <div className="flex items-center justify-center gap-2 text-rose-700 font-semibold text-xs">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchPage(page)}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition shadow-xs"
          >
            Eseye Ankò
          </button>
        </div>
      ) : contributors.length === 0 ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <Clock className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">
            Poko gen kontribisyon ki apwouve.
          </p>
          <p className="text-xs text-slate-400">
            Lè responsab fon an fin valide yon kontribisyon, l ap parèt nan lis sa a otomatikman.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {contributors.map((c) => {
            return (
              <div
                key={c.id}
                className="p-4 sm:p-5 hover:bg-slate-50/60 transition flex items-center justify-between gap-3 text-xs bg-white"
              >
                {/* Contributor Photo & Name (Privacy-Safe Public Fields Only) */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200/80 bg-slate-100 flex items-center justify-center text-slate-600">
                    {c.driver_avatar_url ? (
                      <img
                        src={c.driver_avatar_url}
                        alt={c.driver_name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : c.driver_name ? (
                      <span className="text-xs font-bold text-slate-700">
                        {initialsOf(c.driver_name)}
                      </span>
                    ) : (
                      <User className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-sm truncate">
                      {c.driver_name}
                    </div>
                    <div className="text-slate-500 text-[11px] flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Dat travay: <strong className="text-slate-700">{formatDateCreole(c.work_date)}</strong>
                      </span>
                      {c.payment_method && (
                        <span className="text-slate-400 hidden sm:inline">• {c.payment_method}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount & Approved Status */}
                <div className="text-right shrink-0 space-y-1">
                  <div className="text-sm sm:text-base font-black font-mono text-emerald-700 tracking-tight">
                    +{formatBRL(c.amount_centavos)}
                  </div>
                  <div>
                    <StatusBadge status="Apwouve" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Accessible Pagination Bar: Anvan / Page Number / Apre */}
      {!loading && !errorMsg && totalCount > 0 && (
        <nav
          aria-label="Pajinasyon kontribisyon yo"
          className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
        >
          {/* Current Page and Total Indicator */}
          <div className="text-slate-500 font-medium">
            Afiche <strong className="text-slate-800">{contributors.length}</strong> sou{' '}
            <strong className="text-slate-800">{totalCount}</strong> kontribisyon • Paj{' '}
            <strong className="text-slate-800">{page}</strong> sou{' '}
            <strong className="text-slate-800">{totalPages}</strong>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5">
            {/* Anvan Button */}
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={page <= 1 || loading}
              aria-label="Paj anvan"
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 shadow-xs transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anvan</span>
            </button>

            {/* Numeric Page Buttons */}
            {totalPages > 1 && (
              <div className="hidden sm:flex items-center gap-1">
                {pageNumbers.map((p) => {
                  const isActive = p === page;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleGoToPage(p)}
                      disabled={loading}
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={`Ale nan paj ${p}`}
                      className={`min-w-8 h-8 px-2.5 rounded-xl font-bold text-xs transition ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Apre Button */}
            <button
              type="button"
              onClick={handleNextPage}
              disabled={page >= totalPages || loading}
              aria-label="Paj apre"
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 shadow-xs transition"
            >
              <span>Apre</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </nav>
      )}
    </section>
  );
};
