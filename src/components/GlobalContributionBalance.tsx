'use client';

import React, { useEffect, useState, useRef } from 'react';
import { repository } from '@/lib/repository';
import { GlobalContributionSummary } from '@/lib/types';
import { formatBRL, formatDateCreole, formatTime } from '@/lib/formatters';
import { RefreshCw, ShieldCheck, CheckCircle2 } from 'lucide-react';

export interface GlobalContributionBalanceProps {
  /**
   * 'hero': Oversized Nubank/Revolut-style presentation for public homepage.
   * 'compact': Clean financial card for driver/admin dashboards and reports.
   * 'sidebar': Dedicated layout tailored for the desktop navigation sidebar.
   * 'header': Ultra-compact inline pill for headers.
   */
  variant?: 'hero' | 'compact' | 'sidebar' | 'header';
  /** Optional custom title override while preserving Haitian Creole standard */
  label?: string;
  className?: string;
  showRefreshButton?: boolean;
  onRefresh?: () => void;
}

export const GlobalContributionBalance: React.FC<GlobalContributionBalanceProps> = ({
  variant = 'compact',
  label = 'Kantite Kòb ki Ranmase',
  className = '',
  showRefreshButton = true,
  onRefresh,
}) => {
  const [summary, setSummary] = useState<GlobalContributionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const prevAmountRef = useRef<number | null>(null);

  // Authoritative data loading & realtime subscription
  useEffect(() => {
    let isMounted = true;

    async function fetchAuthoritativeBalance() {
      setErrorMsg(null);
      try {
        const data = await repository.getPublicGlobalBalance();
        if (isMounted) {
          if (
            prevAmountRef.current !== null &&
            prevAmountRef.current !== data.total_approved_contributions_centavos
          ) {
            setIsPulsing(true);
            setTimeout(() => setIsPulsing(false), 1200);
          }
          prevAmountRef.current = data.total_approved_contributions_centavos;
          setSummary(data);
        }
      } catch (err: any) {
        console.error('Erè pandan chajman balans ofisyèl la:', err);
        if (isMounted) {
          setErrorMsg(err.message || 'Gen yon erè pandan lekti balans lan nan baz done a.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    fetchAuthoritativeBalance();

    // Subscribe to realtime balance notifications
    const unsubscribe = repository.subscribeToGlobalBalance((freshBalance) => {
      if (!isMounted) return;
      if (
        prevAmountRef.current !== null &&
        prevAmountRef.current !== freshBalance.total_approved_contributions_centavos
      ) {
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 1200);
      }
      prevAmountRef.current = freshBalance.total_approved_contributions_centavos;
      setSummary(freshBalance);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setErrorMsg(null);
    try {
      const data = await repository.getPublicGlobalBalance();
      setSummary(data);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gen yon erè pandan lekti balans lan nan baz done a.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Error state: show genuine error message in Haitian Creole instead of false zero
  if (errorMsg && !summary) {
    return (
      <div
        role="alert"
        className={`bg-rose-50 border border-rose-200 rounded-3xl p-6 text-rose-900 ${className}`}
      >
        <div className="flex items-center gap-2 font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-rose-600 shrink-0" />
          <span>Erè pandan chajman balans lan</span>
        </div>
        <p className="text-xs text-rose-700 mt-1">{errorMsg}</p>
        <button
          onClick={handleManualRefresh}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Eseye Ankò
        </button>
      </div>
    );
  }

  // 1. SKELETON LOADING STATE (Never show fake zero to users while loading)
  if (loading || !summary) {
    if (variant === 'hero') {
      return (
        <div
          role="status"
          aria-label="Chajman balans ofisyèl fon an ap fèt..."
          className={`bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xs animate-pulse space-y-4 ${className}`}
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-44 bg-slate-200 rounded-md" />
            <div className="h-4 w-16 bg-slate-100 rounded-full" />
          </div>
          <div className="h-12 sm:h-16 w-3/4 max-w-md bg-slate-200 rounded-2xl" />
          <div className="h-3 w-48 bg-slate-100 rounded" />
        </div>
      );
    }

    if (variant === 'sidebar') {
      return (
        <div
          role="status"
          aria-label="Chajman balans fon an..."
          className={`p-3.5 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse space-y-2 ${className}`}
        >
          <div className="h-3 w-28 bg-slate-200 rounded" />
          <div className="h-6 w-32 bg-slate-200 rounded-lg" />
        </div>
      );
    }

    if (variant === 'header') {
      return (
        <div
          role="status"
          className="h-8 w-32 bg-slate-100 rounded-full animate-pulse inline-block"
        />
      );
    }

    // Default compact skeleton
    return (
      <div
        role="status"
        aria-label="Chajman balans ofisyèl la..."
        className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-xs animate-pulse space-y-2.5 ${className}`}
      >
        <div className="h-3.5 w-36 bg-slate-200 rounded" />
        <div className="h-7 w-40 bg-slate-200 rounded-lg" />
        <div className="h-2.5 w-24 bg-slate-100 rounded" />
      </div>
    );
  }

  const formattedAmount = formatBRL(summary.total_approved_contributions_centavos);

  // 2. HERO VARIANT (Public Homepage Primary Visual Element)
  if (variant === 'hero') {
    return (
      <section
        role="region"
        aria-label={`${label}: ${formattedAmount}`}
        className={`bg-white rounded-3xl p-6 sm:p-10 border border-slate-100/90 shadow-xs relative overflow-hidden space-y-6 ${className}`}
      >
        {/* Top Header with live badge & refresh */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {label}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100/60">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Ofisyèl & Transparan
            </span>
          </div>

          {showRefreshButton && (
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              aria-label="Rafrechi balans lan"
              title="Rafrechi balans lan"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`}
              />
            </button>
          )}
        </div>

        {/* Oversized Financial Typography with Smooth Pulse Transition */}
        <div className="space-y-1">
          <div
            aria-live="polite"
            className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 font-mono transition-transform duration-500 break-words ${
              isPulsing ? 'scale-[1.02] text-emerald-700' : ''
            }`}
          >
            {formattedAmount}
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Total tout kontribisyon chofè yo ki valide epi apwouve nan fon legliz la.
          </p>
        </div>

        {/* Supporting Meta Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              <strong>{summary.total_approved_count}</strong> kontribisyon valide
            </span>
          </div>
          {summary.last_updated && (
            <span className="text-[11px] text-slate-400 ml-auto">
              Mizajou: {formatDateCreole(summary.last_updated)} {formatTime(summary.last_updated)}
            </span>
          )}
        </div>
      </section>
    );
  }

  // 3. SIDEBAR VARIANT (Desktop Sidebar)
  if (variant === 'sidebar') {
    return (
      <div
        role="region"
        aria-label={`${label}: ${formattedAmount}`}
        className={`mx-3 my-2 p-3.5 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200/70 shadow-2xs space-y-1.5 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
              {label}
            </span>
          </div>
          {showRefreshButton && (
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              aria-label="Rafrechi balans"
              title="Rafrechi balans"
              className="p-1 rounded text-slate-400 hover:text-slate-600"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          )}
        </div>
        <div
          aria-live="polite"
          className="text-lg sm:text-xl font-black font-mono tracking-tight text-slate-900 truncate"
        >
          {formattedAmount}
        </div>
        <p className="text-[10px] text-slate-400">
          Fon Global Kominotè
        </p>
      </div>
    );
  }

  // 4. HEADER PILL VARIANT
  if (variant === 'header') {
    return (
      <div
        role="region"
        aria-label={`${label}: ${formattedAmount}`}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 text-xs ${className}`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-slate-500 font-medium text-[11px] hidden sm:inline">
          {label}:
        </span>
        <span className="font-bold font-mono text-slate-900">{formattedAmount}</span>
      </div>
    );
  }

  // 5. COMPACT VARIANT (Driver Dashboard, Admin Dashboard, Reports)
  return (
    <div
      role="region"
      aria-label={`${label}: ${formattedAmount}`}
      className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-1.5 relative ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {label}
          </span>
        </div>
        {showRefreshButton && (
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            aria-label="Rafrechi balans lan"
            title="Rafrechi balans lan"
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
          >
            <RefreshCw
              className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`}
            />
          </button>
        )}
      </div>

      <div
        aria-live="polite"
        className={`text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight transition-transform duration-300 ${
          isPulsing ? 'scale-[1.02] text-emerald-700' : ''
        }`}
      >
        {formattedAmount}
      </div>

      <p className="text-[11px] text-slate-400">
        Fon ofisyèl gwoup chofè yo ({summary.total_approved_count} kontribisyon apwouve)
      </p>
    </div>
  );
};
