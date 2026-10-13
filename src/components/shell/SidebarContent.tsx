'use client';

import React from 'react';
import Link from 'next/link';
import { Church, LogOut, LogIn, UserPlus } from 'lucide-react';
import { getNavSections, isNavItemActive } from '@/lib/navigation';
import { GlobalContributionBalance } from '@/components/GlobalContributionBalance';
import { UserAccountSection } from '@/components/UserAccountSection';
import type { UserProfile } from '@/lib/types';

interface SidebarContentProps {
  user: UserProfile | null;
  pathname: string;
  pendingCount: number;
  onNavigate?: () => void;
  onSignOut: () => void;
}

export function initialsOf(name: string): string {
  return name
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
}

export const roleLabel = (role: UserProfile['role']) =>
  role === 'admin' ? 'Trezorye' : 'Chofè';

export const SidebarContent: React.FC<SidebarContentProps> = ({
  user,
  pathname,
  pendingCount,
  onNavigate,
  onSignOut,
}) => {
  const sections = getNavSections(user);

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-3 px-5 h-16 shrink-0 border-b border-slate-100"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
          <Church className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold tracking-tight text-slate-900">
            Chofè Legliz
          </span>
          <span className="block text-[11px] text-slate-500">Fon Kontribisyon</span>
        </span>
      </Link>

      {/* Global Contribution Balance (Authoritative Group Total) */}
      <div className="pt-2 pb-1 border-b border-slate-100">
        <GlobalContributionBalance variant="sidebar" />
      </div>

      {/* Navigation */}
      <nav aria-label="Navigasyon prensipal" className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map((section) => (
          <div key={section.id}>
            {section.title && (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isNavItemActive(pathname, item);
                const Icon = item.icon;
                return (
                  <li key={`${section.id}-${item.href}`}>
                    <Link
                      href={item.href}
                      prefetch={false}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors ${
                        active
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          active ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                        strokeWidth={1.75}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.showPendingBadge && pendingCount > 0 && (
                        <span className="min-w-5 rounded-full bg-amber-100 px-1.5 py-0.5 text-center text-[10px] font-semibold text-amber-800 tabular-nums">
                          {pendingCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Profile / auth section */}
      <div className="shrink-0 border-t border-slate-100 p-3">
        <UserAccountSection user={user} onNavigate={onNavigate} layout="sidebar" />
      </div>
    </div>
  );
};
