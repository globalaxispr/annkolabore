'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { repository } from '@/lib/repository';
import { PublicApprovedContributor } from '@/lib/types';
import { formatBRL, formatDateCreole } from '@/lib/formatters';
import { StatusBadge } from './StatusBadge';
import { initialsOf } from './shell/SidebarContent';
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  Calendar,
  CreditCard,
  Loader2,
  Users,
} from 'lucide-react';

interface RecentContributorsPaginatedProps {
  pageSize?: number;
}

export const RecentContributorsPaginated: React.FC<RecentContributorsPaginatedProps> = ({
  pageSize = 10,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial page from URL query ?paj=X
  const initialPage = Math.max(1, parseInt(searchParams.get('paj') || '1', 10) || 1);

  const [page, setPage] = useState<number>(initialPage);
  const [contributors, setContributors] = useState<PublicApprovedContributor[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadPageData = async (targetPage: number) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await repository.getPaginatedPublicContributors(targetPage, pageSize);
      setContributors(res.data);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch (err: any) {
      console.error('Erè pandan rekiperasyon kontribisyon yo:', err);
      setErrorMsg(err.message || 'Erè pandan lekti kontribisyon yo nan baz done a.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData(page);

    // Listen for realtime balance updates to auto-refresh first page
    const unsubscribe = repository.subscribeToGlobalBalance(() => {
      loadPageData(page);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;

    startTransition(() => {
      setPage(newPage);
      // Update URL query ?paj=X without full page reload
      const params = new URLSearchParams(window.location.search);
      params.set('paj', newPage.toString());
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState(null, '', newUrl);
    });

    loadPageData(newPage);
  };

  return (
    <section
      role="region"
      aria-label="Dènye Kontribisyon yo"
      className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden space-y-0"
    >
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Dènye Kontribisyon yo
            </h2>
            {totalCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                {totalCount} total
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Lis tout kontribisyon ofisyèl chofè yo ki valide epi apwouve pa trezorye a
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100/60">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Transparans Piblik
        </div>
      </div>

      {/* Content / Rows */}
      {loading ? (
        // Loading Skeleton
        <div className="divide-y divide-slate-100 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="space-y-1.5 text-right">
                <div className="h-4 w-20 bg-slate-200 rounded ml-auto" />
                <div className="h-3 w-14 bg-slate-100 rounded ml-auto" />
              </div>
            </div>
          ))}
        </div>
      ) : errorMsg ? (
        <div className="py-12 px-6 text-center text-rose-800 bg-rose-50/50 space-y-2">
          <p className="text-xs font-semibold">{errorMsg}</p>
          <button
            onClick={() => loadPageData(page)}
            className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition"
          >
            Eseye Ankò
          </button>
        </div>
      ) : contributors.length === 0 ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <Clock className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">
            Poko gen kontribisyon ki anrejistre.
          </p>
          <p className="text-xs text-slate-400">
            Lè yon kontribisyon valide pa trezorye a, l ap parèt nan lis sa a otomatikman.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {contributors.map((c) => {
            return (
              <div
                key={c.id}
                className="p-4 sm:p-5 hover:bg-slate-50/60 transition flex items-center justify-between gap-3 text-xs"
              >
                {/* Driver Photo & Name */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 bg-slate-100 flex items-center justify-center">
                    {c.driver_avatar_url ? (
                      <img
                        src={c.driver_avatar_url}
                        alt={c.driver_name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-xs font-bold text-slate-600">
                        {initialsOf(c.driver_name)}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-sm truncate">
                      {c.driver_name}
                    </div>
                    <div className="text-slate-500 text-[11px] flex items-center gap-2 mt-0.5">
                      <span>Dat travay: {formatDateCreole(c.work_date)}</span>
                      {c.payment_method && (
                        <span className="text-slate-400">• {c.payment_method}</span>
                      )}
                    </div>
                    {c.approval_date && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Apwouve: {formatDateCreole(c.approval_date, 'long')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount & Status Badge */}
                <div className="text-right shrink-0">
                  <div className="text-sm sm:text-base font-black font-mono text-emerald-700">
                    +{formatBRL(c.amount_centavos)}
                  </div>
                  <div className="mt-1">
                    <StatusBadge status="APPROVED" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="p-4 sm:p-5 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Current Page Status */}
          <div className="text-slate-500 font-medium text-center sm:text-left">
            Montre paj <strong className="text-slate-900 font-bold">{page}</strong> sou{' '}
            <strong className="text-slate-900 font-bold">{totalPages}</strong> ({totalCount} kontribisyon)
          </div>

          {/* Navigation Buttons: Anvan & Apre */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || loading}
              aria-label="Paj anvan"
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Anvan
            </button>

            {/* Page Pill Indicators */}
            <span className="px-3 py-2 rounded-xl bg-slate-100 font-mono font-bold text-slate-800">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || loading}
              aria-label="Paj apre"
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700 transition"
            >
              Apre
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
