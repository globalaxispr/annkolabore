import { createBrowserClient } from '@supabase/ssr';
import {
  getSupabaseConfig,
  isSupabaseConfigured,
  getSupabaseDiagnostics,
  setRuntimeSupabaseConfig,
  SupabaseConfigDiagnostics,
} from './config';

export { isSupabaseConfigured, getSupabaseDiagnostics };
export type { SupabaseConfigDiagnostics };

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Returns the active Supabase browser client singleton.
 * Returns null if Supabase credentials are not configured.
 */
export function createClient() {
  const { url, anonKey, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(url, anonKey);
  }

  return browserClient;
}

/**
 * Ensures a Supabase client is initialized.
 * If build-time inlined variables were missing (e.g. stale Vercel cache before env var addition),
 * this attempts a lightweight fetch to `/api/supabase-config` to retrieve public credentials dynamically.
 */
export async function ensureSupabaseClient(): Promise<ReturnType<typeof createBrowserClient> | null> {
  const existing = createClient();
  if (existing) return existing;

  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/supabase-config', {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url && data.anonKey) {
          setRuntimeSupabaseConfig(data.url, data.anonKey);
          browserClient = null; // Re-create client with new config
          return createClient();
        }
      }
    } catch {
      // Ignore network errors on config fetch; fall back to normal diagnostics
    }
  }

  return null;
}
