/**
 * Supabase client-safe configuration helper.
 * Normalizes Project URLs (handling accidental /rest/v1 endpoints or missing protocols)
 * and supports both legacy anon JWT keys and modern Supabase publishable keys.
 */

export const OFFICIAL_SUPABASE_PROJECT_URL = 'https://rocarrtokwekcztczgfv.supabase.co';

let runtimeConfig: { url: string; anonKey: string } | null = null;

/**
 * Allows the browser client to register runtime-fetched public configuration
 * if Next.js build-time inlining was missed or cached.
 */
export function setRuntimeSupabaseConfig(url: string, anonKey: string): void {
  if (url && anonKey) {
    runtimeConfig = {
      url: normalizeSupabaseUrl(url),
      anonKey: sanitizeSupabaseKey(anonKey),
    };
  }
}

export function normalizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  // Strip quotes if entered in dashboard with quotes
  url = url.replace(/^["']|["']$/g, '').trim();
  if (!url) return '';

  // Add https:// protocol if omitted
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  // Strip trailing /rest/v1 or /rest/v1/ if user pasted REST endpoint instead of Project URL
  url = url.replace(/\/rest\/v1\/?$/i, '');
  // Strip any trailing slashes
  url = url.replace(/\/+$/, '');
  return url;
}

export function sanitizeSupabaseKey(rawKey?: string): string {
  if (!rawKey) return '';
  let key = rawKey.trim();
  // Strip quotes
  key = key.replace(/^["']|["']$/g, '').trim();
  // Strip any trailing semicolons or whitespace
  key = key.replace(/;+$/, '').trim();
  return key;
}

export interface SupabaseConfigDiagnostics {
  isConfigured: boolean;
  hasUrl: boolean;
  urlHost: string;
  urlSource: 'NEXT_PUBLIC_SUPABASE_URL' | 'SUPABASE_URL' | 'DEFAULT_PROJECT_URL' | 'RUNTIME_API' | 'none';
  hasAnonKey: boolean;
  keyType: 'legacy_jwt' | 'sbp_publishable' | 'other' | 'none';
  keyLength: number;
  keySource: 'NEXT_PUBLIC_SUPABASE_ANON_KEY' | 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' | 'SUPABASE_ANON_KEY' | 'RUNTIME_API' | 'none';
  statusMessage: string;
  missingVariables: string[];
  recommendedAction?: string;
}

export function getSupabaseConfig(): {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  sourceUrl: 'NEXT_PUBLIC_SUPABASE_URL' | 'SUPABASE_URL' | 'DEFAULT_PROJECT_URL' | 'RUNTIME_API' | 'none';
  sourceKey: 'NEXT_PUBLIC_SUPABASE_ANON_KEY' | 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' | 'SUPABASE_ANON_KEY' | 'RUNTIME_API' | 'none';
} {
  // Check runtime config first (if injected via API)
  if (runtimeConfig?.url && runtimeConfig?.anonKey) {
    return {
      url: runtimeConfig.url,
      anonKey: runtimeConfig.anonKey,
      isConfigured: true,
      sourceUrl: 'RUNTIME_API',
      sourceKey: 'RUNTIME_API',
    };
  }

  // Read URL
  const envPublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serverUrl = typeof window === 'undefined' ? process.env.SUPABASE_URL : undefined;

  let rawUrl = '';
  let sourceUrl: 'NEXT_PUBLIC_SUPABASE_URL' | 'SUPABASE_URL' | 'DEFAULT_PROJECT_URL' | 'RUNTIME_API' | 'none' = 'none';

  if (envPublicUrl && envPublicUrl.trim()) {
    rawUrl = envPublicUrl;
    sourceUrl = 'NEXT_PUBLIC_SUPABASE_URL';
  } else if (serverUrl && serverUrl.trim()) {
    rawUrl = serverUrl;
    sourceUrl = 'SUPABASE_URL';
  } else {
    // Official Project URL fallback ensures that when the user adds the anon key to Vercel,
    // the system connects to the official church drivers project even if NEXT_PUBLIC_SUPABASE_URL
    // was not explicitly defined.
    rawUrl = OFFICIAL_SUPABASE_PROJECT_URL;
    sourceUrl = 'DEFAULT_PROJECT_URL';
  }

  const url = normalizeSupabaseUrl(rawUrl);

  // Read Anon / Publishable Key
  const envAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const envPublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serverAnonKey = typeof window === 'undefined' ? (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY) : undefined;

  let rawKey = '';
  let sourceKey: 'NEXT_PUBLIC_SUPABASE_ANON_KEY' | 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' | 'SUPABASE_ANON_KEY' | 'RUNTIME_API' | 'none' = 'none';

  if (envAnonKey && envAnonKey.trim()) {
    rawKey = envAnonKey;
    sourceKey = 'NEXT_PUBLIC_SUPABASE_ANON_KEY';
  } else if (envPublishableKey && envPublishableKey.trim()) {
    rawKey = envPublishableKey;
    sourceKey = 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY';
  } else if (serverAnonKey && serverAnonKey.trim()) {
    rawKey = serverAnonKey;
    sourceKey = 'SUPABASE_ANON_KEY';
  }

  const anonKey = sanitizeSupabaseKey(rawKey);

  const isConfigured = Boolean(
    url &&
    anonKey &&
    anonKey.length > 20 &&
    !url.includes('example.supabase.co') &&
    url.startsWith('https://')
  );

  return { url, anonKey, isConfigured, sourceUrl, sourceKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig().isConfigured;
}

export function getSupabaseDiagnostics(): SupabaseConfigDiagnostics {
  const config = getSupabaseConfig();
  const missingVariables: string[] = [];

  let urlHost = '';
  try {
    if (config.url) {
      const parsed = new URL(config.url);
      urlHost = parsed.hostname;
    }
  } catch {
    urlHost = 'invalid-url';
  }

  const hasUrl = Boolean(config.url && urlHost && urlHost !== 'invalid-url');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && config.sourceUrl === 'DEFAULT_PROJECT_URL') {
    // URL was defaulted to official project URL
  } else if (!hasUrl) {
    missingVariables.push('NEXT_PUBLIC_SUPABASE_URL');
  }

  const hasAnonKey = Boolean(config.anonKey && config.anonKey.length > 20);
  if (!hasAnonKey) {
    missingVariables.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  let keyType: 'legacy_jwt' | 'sbp_publishable' | 'other' | 'none' = 'none';
  if (config.anonKey) {
    if (config.anonKey.startsWith('eyJ')) {
      keyType = 'legacy_jwt';
    } else if (config.anonKey.startsWith('sbp_')) {
      keyType = 'sbp_publishable';
    } else {
      keyType = 'other';
    }
  }

  let statusMessage = '';
  let recommendedAction: string | undefined;

  if (config.isConfigured) {
    statusMessage = `Koneksyon Supabase konfigire kòrèkteman (Pwojè: ${urlHost}).`;
  } else if (!hasAnonKey && !hasUrl) {
    statusMessage = "Toude varyab Supabase yo manke nan Vercel (NEXT_PUBLIC_SUPABASE_URL ak NEXT_PUBLIC_SUPABASE_ANON_KEY).";
    recommendedAction = "Ajoute NEXT_PUBLIC_SUPABASE_URL ak NEXT_PUBLIC_SUPABASE_ANON_KEY nan Vercel Settings > Environment Variables, chwazi 'Production', epi fè yon Redeploy.";
  } else if (!hasAnonKey) {
    statusMessage = "Kle Supabase la (NEXT_PUBLIC_SUPABASE_ANON_KEY) manke oswa li pa t enkli pandan konpilasyon Vercel la.";
    recommendedAction = "Verifye nan Vercel Settings > Environment Variables ke NEXT_PUBLIC_SUPABASE_ANON_KEY prezan epi koche pou 'Production'. Apre sa, klike sou 'Redeploy' (san cache) pou Vercel entegre li nan kòd la.";
  } else if (!hasUrl) {
    statusMessage = "URL pwojè Supabase la (NEXT_PUBLIC_SUPABASE_URL) manke oswa li pa valab.";
    recommendedAction = "Mete NEXT_PUBLIC_SUPABASE_URL=https://rocarrtokwekcztczgfv.supabase.co nan Vercel Environment Variables epi relanse yon deplwaman.";
  } else {
    statusMessage = "Konfigirasyon Supabase la pa konplè. Tanpri verifye fòma varyab yo nan Vercel.";
    recommendedAction = "Verifye kle anon an ak URL la nan Vercel.";
  }

  return {
    isConfigured: config.isConfigured,
    hasUrl,
    urlHost,
    urlSource: config.sourceUrl,
    hasAnonKey,
    keyType,
    keyLength: config.anonKey.length,
    keySource: config.sourceKey,
    statusMessage,
    missingVariables,
    recommendedAction,
  };
}
