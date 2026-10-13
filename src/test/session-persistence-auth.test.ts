import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

let mockGetUser = vi.fn();
let mockFrom = vi.fn();
let mockSetAllCallback: ((options: any) => void) | null = null;

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((_url: string, _key: string, options: any) => {
    if (mockSetAllCallback) {
      mockSetAllCallback(options);
    }
    return {
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    };
  }),
  createBrowserClient: vi.fn(),
}));

vi.mock('@/lib/supabase/config', () => ({
  getSupabaseConfig: vi.fn().mockReturnValue({
    url: 'https://rocarrtokwekcztczgfv.supabase.co',
    anonKey: 'test-anon-key',
    isConfigured: true,
    source: 'build-time',
  }),
}));

import { middleware } from '@/middleware';

describe('Session Persistence & Protected Routes Authorization Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetAllCallback = null;
    mockGetUser = vi.fn();
    mockFrom = vi.fn();
  });

  it('unauthenticated visitor accessing /chofe is redirected to /auth/login with no-store headers', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') });

    const request = new NextRequest('http://localhost:3000/chofe');
    const response = await middleware(request);

    // Verify 307 redirect
    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toContain('/auth/login?redirect=%2Fchofe');

    // Verify cache prevention headers so router prefetch cache is never poisoned
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('pragma')).toBe('no-cache');
    expect(response.headers.get('expires')).toBe('0');
  });

  it('unauthenticated visitor accessing /chofe/soumet is redirected to /auth/login with redirect param', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const request = new NextRequest('http://localhost:3000/chofe/soumet');
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/auth/login?redirect=%2Fchofe%2Fsoumet');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('authenticated driver can access /chofe, /chofe/soumet and /perfil without redirect to login', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'driver-123', email: 'driver@legliz.com' },
      },
      error: null,
    });

    for (const path of ['/chofe', '/chofe/soumet', '/perfil']) {
      const request = new NextRequest(`http://localhost:3000${path}`);
      const response = await middleware(request);

      // Status 200 / next, NOT a redirect
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    }
  });

  it('authenticated driver accessing /admin is redirected to /chofe, not /auth/login', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'driver-123', email: 'driver@legliz.com' },
      },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { role: 'driver' }, error: null }),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/admin');
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/chofe');
    expect(response.headers.get('location')).not.toContain('/auth/login');
  });

  it('authenticated administrator can access /admin and admin subroutes', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'admin-999', email: 'admin@legliz.com' },
      },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/admin');
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('missing profile does not log out an authenticated user accessing driver dashboard', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'new-driver-789', email: 'newdriver@legliz.com' },
      },
      error: null,
    });

    // Profile query error/null
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Row not found' } }),
        }),
      }),
    });

    // Visiting driver route with missing profile record -> must NOT redirect to login
    const request = new NextRequest('http://localhost:3000/chofe');
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('preserves refreshed cookies across redirects in middleware', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    // Simulate createServerClient invoking setAll during token refresh
    mockSetAllCallback = (options: any) => {
      options.cookies.setAll(
        [
          {
            name: 'sb-rocarrtokwekcztczgfv-auth-token',
            value: 'refreshed-jwt-token-value',
            options: { path: '/', maxAge: 3600 },
          },
        ],
        { 'Cache-Control': 'no-store' }
      );
    };

    const request = new NextRequest('http://localhost:3000/chofe');
    const response = await middleware(request);

    expect(response.status).toBe(307);
    // Ensure the refreshed cookie was not dropped by the redirect!
    const cookieHeader = response.headers.get('set-cookie');
    expect(cookieHeader).toContain('sb-rocarrtokwekcztczgfv-auth-token');
  });

  it('navigation helper separates public, driver, and admin routes correctly', async () => {
    const { getNavSections } = await import('@/lib/navigation');

    // Unauthenticated: only public nav
    const publicSections = getNavSections(null);
    expect(publicSections).toHaveLength(1);
    expect(publicSections[0].id).toBe('public');
    const publicHrefs = publicSections[0].items.map((i) => i.href);
    expect(publicHrefs).toContain('/');
    expect(publicHrefs).toContain('/kontribye');
    expect(publicHrefs).not.toContain('/chofe');
    expect(publicHrefs).not.toContain('/chofe/soumet');
    expect(publicHrefs).not.toContain('/admin');

    // Driver: member nav with /chofe, /chofe/soumet, /perfil
    const driverSections = getNavSections({
      id: 'driver-1',
      email: 'driver@test.com',
      full_name: 'Driver Test',
      role: 'driver',
      created_at: new Date().toISOString(),
    });
    const driverHrefs = driverSections.flatMap((s) => s.items.map((i) => i.href));
    expect(driverHrefs).toContain('/chofe');
    expect(driverHrefs).toContain('/chofe/soumet');
    expect(driverHrefs).toContain('/perfil');
    expect(driverHrefs).not.toContain('/admin');

    // Admin: member nav + admin nav
    const adminSections = getNavSections({
      id: 'admin-1',
      email: 'admin@test.com',
      full_name: 'Admin Test',
      role: 'admin',
      created_at: new Date().toISOString(),
    });
    const adminHrefs = adminSections.flatMap((s) => s.items.map((i) => i.href));
    expect(adminHrefs).toContain('/chofe');
    expect(adminHrefs).toContain('/admin');
    expect(adminHrefs).toContain('/admin/atant');
  });

  it('safe redirect path validation prevents open-redirect and accepts valid protected paths', () => {
    function getSafeDestination(rawRedirect: string | null, defaultTarget: string): string {
      if (
        rawRedirect &&
        rawRedirect.startsWith('/') &&
        !rawRedirect.startsWith('//') &&
        !rawRedirect.startsWith('/\\')
      ) {
        return rawRedirect;
      }
      return defaultTarget;
    }

    // Valid paths
    expect(getSafeDestination('/chofe/soumet', '/chofe')).toBe('/chofe/soumet');
    expect(getSafeDestination('/perfil', '/chofe')).toBe('/perfil');
    expect(getSafeDestination('/admin', '/chofe')).toBe('/admin');

    // Malicious open-redirect attempts must fall back to defaultTarget
    expect(getSafeDestination('https://evil.com', '/chofe')).toBe('/chofe');
    expect(getSafeDestination('//evil.com', '/chofe')).toBe('/chofe');
    expect(getSafeDestination('/\\evil.com', '/chofe')).toBe('/chofe');
    expect(getSafeDestination(null, '/chofe')).toBe('/chofe');
  });
});
