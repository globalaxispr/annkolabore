/**
 * Supabase client-safe configuration helper.
 * Normalizes Project URLs (handling accidental /rest/v1 endpoints)
 * and supports both anon key and current publishable key variables.
 */

export function normalizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  // Strip trailing /rest/v1 or /rest/v1/ if user pasted REST endpoint instead of Project URL
  url = url.replace(/\/rest\/v1\/?$/i, '');
  // Strip any trailing slashes
  url = url.replace(/\/+$/, '');
  return url;
}

export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ''
  ).trim();

  const url = normalizeSupabaseUrl(rawUrl);
  const isConfigured = Boolean(
    url &&
    anonKey &&
    !url.includes('example.supabase.co') &&
    url.startsWith('https://')
  );

  return { url, anonKey, isConfigured };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig().isConfigured;
}
