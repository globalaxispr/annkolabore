import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig } from './lib/supabase/config';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
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
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
        if (headers) {
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value)
          );
        }
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

  // Helper to build redirects that propagate refreshed cookies and prohibit router caching
  const createRedirect = (targetUrl: URL | string) => {
    const redirectResponse = NextResponse.redirect(targetUrl);
    // Propagate all session cookies onto the redirect response
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    // Never cache redirects so Next.js prefetch cache is never poisoned
    redirectResponse.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    redirectResponse.headers.set('Pragma', 'no-cache');
    redirectResponse.headers.set('Expires', '0');
    return redirectResponse;
  };

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
    return createRedirect(loginUrl);
  }

  // 2. Authenticated user authorization checks
  if (user) {
    if (isAdminRoute || isAuthRoute) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        const role = profile?.role || 'driver';

        // Non-admin trying to access admin dashboard -> redirect to driver dashboard
        if (isAdminRoute && role !== 'admin') {
          return createRedirect(new URL('/chofe', request.url));
        }

        // Already logged-in user visiting login/register -> redirect to appropriate area
        if (isAuthRoute) {
          return createRedirect(new URL(role === 'admin' ? '/admin' : '/chofe', request.url));
        }
      } catch (err) {
        console.error('Middleware profile check error:', err);
        // Fallback: If profile lookup is delayed or fails, preserve authenticated access
        if (isAdminRoute) {
          return createRedirect(new URL('/chofe', request.url));
        }
        if (isAuthRoute) {
          return createRedirect(new URL('/chofe', request.url));
        }
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
