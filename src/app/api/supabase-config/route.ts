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

  return NextResponse.json({
    // Public browser credentials only (never server-only keys or service_role)
    url: config.url,
    anonKey: config.anonKey,
    isConfigured: config.isConfigured,
    diagnostics: {
      ...diagnostics,
      networkPing,
    },
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV || 'local',
  });
}
