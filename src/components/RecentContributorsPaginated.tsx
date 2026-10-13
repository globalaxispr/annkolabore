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
  Loader2,
  RefreshCw,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface RecentContributorsPaginatedProps {
  pageSize?: number;
}

export const RecentContributorsPaginated: React.FC<RecentContributorsPaginatedProps> = ({
  pageSize = 5,
}) => {
  const [contributors, setContributors] = useState<PublicApprovedContributor[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await repository.getPaginatedPublicContributors(1, pageSize);
      setContributors(res.data);
      setTotalCount(res.totalCount);
      setPage(1);
    } catch (err: any) {
      console.error('Erè pandan rekiperasyon kontribisyon yo:', err);
      setErrorMsg(
        err?.message ||
          'Pa ka jwenn lis kontribisyon yo kounye a. Tanpri verifye koneksyon an.'
      );
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  const handleLoadMore = async () => {
    if (loadingMore || contributors.length >= totalCount) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await repository.getPaginatedPublicContributors(nextPage, pageSize);

      setContributors((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const newUnique = res.data.filter((c) => !existingIds.has(c.id));
        return [...prev, ...newUnique];
      });
      setPage(nextPage);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      console.error('Erè pandan chajman lòt kontribisyon yo:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Auto-refresh when an administrator approves a contribution in real time
    const unsubscribe = repository.subscribeToGlobalBalance(() => {
      loadInitialData();
    });

    return () => {
      unsubscribe();
    };
  }, [loadInitialData]);

  const hasMore = contributors.length < totalCount;

  return (
    <section
      role="region"
      aria-label="Dènye Kontribisyon yo"
      className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Dènye Kontribisyon yo
            </h2>
            {totalCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                {totalCount} ofisyèl
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Lis tout kontribisyon ofisyèl chofè yo ki valide epi apwouve pa trezorye a
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadInitialData}
            disabled={loading}
            title="Rafrechi lis la"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100/60">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Transparans Piblik
          </div>
        </div>
      </div>

      {/* Content / Rows */}
      {loading ? (
        // Loading Skeleton
        <div className="divide-y divide-slate-100 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
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
            onClick={loadInitialData}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition shadow-xs"
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
                className="p-4 sm:p-5 hover:bg-slate-50/50 transition flex items-center justify-between gap-3 text-xs bg-white"
              >
                {/* Driver Photo & Name */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200/80 bg-slate-100 flex items-center justify-center">
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

                {/* Amount & Green Approved Status */}
                <div className="text-right shrink-0 space-y-1">
                  <div className="text-sm sm:text-base font-black font-mono text-emerald-700 tracking-tight">
                    +{formatBRL(c.amount_centavos)}
                  </div>
                  <div>
                    <StatusBadge status="APPROVED" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* "Gade plis" Button for Pagination */}
      {!loading && !errorMsg && hasMore && (
        <div className="p-4 sm:p-5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 font-bold text-xs text-slate-800 shadow-xs transition"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                Chajman...
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                Gade plis ({totalCount - contributors.length} ki rete)
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
};

