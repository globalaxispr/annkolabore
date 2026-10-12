import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  // Prevent open redirect vulnerabilities:
  // Ensure next path starts with a single '/' and does not start with '//' or backslashes
  const isSafeRelativeUrl =
    next.startsWith('/') &&
    !next.startsWith('//') &&
    !next.startsWith('/\\') &&
    !next.includes('://');

  const safeRedirectPath = isSafeRelativeUrl ? next : '/';

  if (code) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(safeRedirectPath, requestUrl.origin));
      }
      console.error('Erè pandan exchangeCodeForSession:', error.message);
    }
  }

  // If code exchange failed or expired, redirect to reset or login with informative parameter
  return NextResponse.redirect(
    new URL('/auth/login?error=sesyon_ekspire', requestUrl.origin)
  );
}
