import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseConfig, isSupabaseConfigured } from './config';

export { isSupabaseConfigured };

export function createClient() {
  const { url, anonKey, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    return null;
  }

  return createBrowserClient(url, anonKey);
}

