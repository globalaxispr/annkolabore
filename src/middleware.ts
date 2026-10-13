import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig } from './lib/supabase/config';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { url, anonKey, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isDriverRoute =
    pathname === '/chofe' ||
    pathname.startsWith('/chofe/') ||
    pathname === '/perfil' ||
    pathname.startsWith('/perfil/');
  const isAuthRoute =
    pathname === '/auth/login' ||
    pathname.startsWith('/auth/login/') ||
    pathname === '/auth/register' ||
    pathname.startsWith('/auth/register/');

  // Prevent browser back-navigation caching on protected dashboard routes
  if (isAdminRoute || isDriverRoute) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  // 1. Unauthenticated users trying to access protected routes -> redirect to /auth/login
  if (!user && (isAdminRoute || isDriverRoute)) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated user authorization checks
  if (user) {
    if (isAdminRoute || isAuthRoute) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      const role = profile?.role || 'driver';

      // Non-admin trying to access admin dashboard -> redirect to driver dashboard
      if (isAdminRoute && role !== 'admin') {
        return NextResponse.redirect(new URL('/chofe', request.url));
      }

      // Already logged-in user visiting login/register -> redirect to appropriate area
      if (isAuthRoute) {
        return NextResponse.redirect(new URL(role === 'admin' ? '/admin' : '/chofe', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
