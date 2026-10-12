'use client';

import React, { useState, useEffect } from 'react';
import { repository } from '@/lib/repository';
import { demoStorage, DEMO_PROFILES } from '@/lib/demo-storage';
import { UserProfile } from '@/lib/types';
import { AlertTriangle, UserCheck, RefreshCw } from 'lucide-react';

export const DemoBanner: React.FC<{ onUserChange?: () => void }> = ({ onUserChange }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentUser(repository.getCurrentUser());
  }, []);

  if (!mounted || !repository.isDemo) {
    return null;
  }

  const handleSwitchUser = (userId: string) => {
    repository.switchDemoUser(userId);
    setCurrentUser(demoStorage.getCurrentUser());
    if (onUserChange) onUserChange();
    window.location.reload();
  };

  const handleResetData = () => {
    if (window.confirm('Èske ou vle reyinisyalize tout done demo yo?')) {
      demoStorage.resetDemoData();
      window.location.reload();
    }
  };

  return (
    <div className="bg-amber-500 text-slate-900 border-b border-amber-600 px-4 py-2.5 text-xs sm:text-sm font-medium shadow-inner">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0" />
          <span>
            <strong>MOD DEMO DEVLOPMAN:</strong> Done sa yo se pou tès lokal sèlman, yo pa reprezante tranzaksyon reyèl.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-slate-950 font-semibold">
            <UserCheck className="w-3.5 h-3.5" />
            Wòl Aktyèl:
          </span>
          <select
            value={currentUser?.id || ''}
            onChange={(e) => handleSwitchUser(e.target.value)}
            className="bg-white border border-amber-600 rounded px-2 py-1 text-xs font-semibold text-slate-900 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            {DEMO_PROFILES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.role === 'admin' ? '🛡️ Trezorye: ' : '🚗 Chofè: '} {p.full_name}
              </option>
            ))}
          </select>

          <button
            onClick={handleResetData}
            title="Reyinisyalize Done Demo"
            className="inline-flex items-center gap-1 bg-amber-600/30 hover:bg-amber-600/50 text-slate-950 px-2 py-1 rounded text-xs transition"
          >
            <RefreshCw className="w-3 h-3" />
            Reyinisyalize
          </button>
        </div>
      </div>
    </div>
  );
};
