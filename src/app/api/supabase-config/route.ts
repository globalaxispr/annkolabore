import { NextResponse } from 'next/server';
import { getSupabaseConfig, getSupabaseDiagnostics } from '@/lib/supabase/config';

export async function GET() {
  const config = getSupabaseConfig();
  const diagnostics = getSupabaseDiagnostics();

  // Test network connectivity to Supabase Auth health endpoint
  let networkPing: {
    reachable: boolean;
    latency_ms?: number;
    gotrue_version?: string;
    error?: string;
  } = { reachable: false };

  if (config.url && config.anonKey) {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${config.url}/auth/v1/health`, {
        headers: {
          apikey: config.anonKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        networkPing = {
          reachable: true,
          latency_ms: latencyMs,
          gotrue_version: data?.version || 'active',
        };
      } else {
        networkPing = {
          reachable: false,
          latency_ms: latencyMs,
          error: `HTTP ${res.status}: ${res.statusText}`,
        };
      }
    } catch (err: any) {
      networkPing = {
        reachable: false,
        error: err.name === 'AbortError' ? 'Koneksyon pran twòp tan (Timeout)' : err.message || 'Erè rezo',
      };
    }
  }

  const envPresenceCheck = {
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    SUPABASE_ANON_KEY: Boolean(process.env.SUPABASE_ANON_KEY),
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    SUPABASE_PUBLISHABLE_KEY: Boolean(process.env.SUPABASE_PUBLISHABLE_KEY),
    NEXT_PUBLIC_SUPABASE_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_KEY),
    SUPABASE_KEY: Boolean(process.env.SUPABASE_KEY),
    NEXT_PUBLIC_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_ANON_KEY),
    ANON_KEY: Boolean(process.env.ANON_KEY),
  };

  const vercelBuildInfo = {
    vercel_env: process.env.VERCEL_ENV || 'local',
    vercel_git_commit_ref: process.env.VERCEL_GIT_COMMIT_REF || 'unknown',
    vercel_git_commit_sha: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
    vercel_git_repo_slug: process.env.VERCEL_GIT_REPO_SLUG || 'unknown',
    vercel_git_repo_owner: process.env.VERCEL_GIT_REPO_OWNER || 'unknown',
  };

  return NextResponse.json({
    // Public browser credentials only (never server-only keys or service_role)
    url: config.url,
    anonKey: config.anonKey,
    isConfigured: config.isConfigured,
    diagnostics: {
      ...diagnostics,
      networkPing,
    },
    envPresenceCheck,
    vercelBuildInfo,
    environment: process.env.NODE_ENV,
  });
}
