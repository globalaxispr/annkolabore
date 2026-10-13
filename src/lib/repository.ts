import { isSupabaseConfigured, createClient, ensureSupabaseClient, getSupabaseDiagnostics } from './supabase/client';
import { DEFAULT_PIX_SETTINGS } from './pix';
import { demoStorage } from './demo-storage';
import { MINIMUM_CONTRIBUTION_CENTAVOS } from './financial';
import {
  AuditLogEntry,
  ContributionSubmission,
  FinancialSummary,
  GlobalContributionSummary,
  PaginatedContributorsResult,
  PaymentMethod,
  PixSettings,
  PublicApprovedContributor,
  PublicContribution,
  PublicDonationSubmission,
  UnifiedTransactionItem,
  UserProfile,
} from './types';

export type { UnifiedTransactionItem, PublicApprovedContributor, PaginatedContributorsResult } from './types';

const isTestEnvironment = process.env.NODE_ENV === 'test';

/** Cached user session in browser memory for sync components */
let cachedUser: UserProfile | null = null;

/**
 * Data access layer. Connects directly to real Supabase PostgreSQL and Supabase Auth.
 * Demo mode and hardcoded fallback records are strictly disabled in production.
 */
export const repository = {
  get isDemo() {
    // Demo mode is NEVER active in production or development.
    // Only permitted in isolated automated unit testing if Supabase is unconfigured.
    return isTestEnvironment && !isSupabaseConfigured();
  },

  get currentUser(): UserProfile | null {
    return this.getCurrentUser();
  },

  getCurrentUser(): UserProfile | null {
    if (cachedUser) return cachedUser;
    if (isTestEnvironment && !isSupabaseConfigured()) {
      return demoStorage.getCurrentUser();
    }
    return null;
  },

  /**
   * Fetch current authenticated user and profile from Supabase
   */
  async getAuthUser(): Promise<UserProfile | null> {
    let supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      supabase = await ensureSupabaseClient();
    }

    if (!supabase) {
      if (isTestEnvironment) {
        cachedUser = demoStorage.getCurrentUser();
        return cachedUser;
      }
      cachedUser = null;
      return null;
    }

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        cachedUser = null;
        return null;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        cachedUser = {
          id: user.id,
          email: user.email || '',
          full_name: (user.user_metadata?.full_name as string) || 'Chofè',
          role: 'driver',
          avatar_url: user.user_metadata?.avatar_url as string | undefined,
          created_at: user.created_at,
        };
        return cachedUser;
      }

      cachedUser = {
        id: profile.id,
        email: user.email || '',
        full_name: profile.full_name,
        role: profile.role,
        avatar_url: profile.avatar_url,
        phone: profile.phone,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      };
      return cachedUser;
    } catch (err) {
      console.error('Erè pandan rekiperasyon itilizatè a:', err);
      cachedUser = null;
      return null;
    }
  },

  async signIn(
    email: string,
    password: string
  ): Promise<{ user: UserProfile | null; error?: string }> {
    let supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      supabase = await ensureSupabaseClient();
    }

    if (!supabase) {
      if (isTestEnvironment) {
        const all = demoStorage.getAllProfiles();
        const found = all.find((p) => p.email.toLowerCase() === email.toLowerCase());
        if (!found) {
          return { user: null, error: 'Nou pa jwenn okenn kont avèk adrès imèl sa a.' };
        }
        demoStorage.setCurrentUser(found.id);
        cachedUser = found;
        return { user: found };
      }
      const diag = getSupabaseDiagnostics();
      const detailedMsg = diag.recommendedAction
        ? `${diag.statusMessage} ${diag.recommendedAction}`
        : diag.statusMessage || 'Sistèm nan ap tann koneksyon Supabase. Tanpri verifye varyab anviwònman yo nan Vercel.';
      return {
        user: null,
        error: detailedMsg,
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        let kreyolMsg = error.message;
        if (error.message.includes('Invalid login credentials')) {
          kreyolMsg = 'Imèl oswa modpas la pa kòrèk. Tanpri verifye yo.';
        } else if (error.message.includes('Email not confirmed')) {
          kreyolMsg = 'Adrès imèl la poko konfime. Tanpri tcheke bwat mesaj ou a.';
        } else if (error.message.includes('API key') || (error as any).status === 401 || (error as any).status === 403) {
          kreyolMsg = 'Kle API Supabase la (NEXT_PUBLIC_SUPABASE_ANON_KEY) pa rekonèt. Tanpri verifye kle a nan Vercel.';
        }
        return { user: null, error: kreyolMsg };
      }

      if (!data.user) {
        return { user: null, error: 'Koneksyon an echwe. Tanpri eseye ankò.' };
      }

      const userProfile = await this.getAuthUser();
      return { user: userProfile };
    } catch (err: any) {
      const isNetwork = err?.name === 'TypeError' || err?.message?.includes('fetch') || err?.message?.includes('network');
      const errorMsg = isNetwork
        ? 'Erè koneksyon rezo: Pa ka kontakte sèvè Supabase la (https://rocarrtokwekcztczgfv.supabase.co). Tanpri verifye koneksyon entènèt la.'
        : (err.message || 'Erè pandan koneksyon an.');
      return { user: null, error: errorMsg };
    }
  },

  async signUp(
    emailOrOptions:
      | string
      | { email: string; password: string; full_name?: string; fullName?: string },
    maybePassword?: string,
    maybeFullName?: string
  ): Promise<{ user: UserProfile | null; error?: string }> {
    let email: string;
    let password: string;
    let fullName: string;

    if (typeof emailOrOptions === 'object') {
      email = emailOrOptions.email;
      password = emailOrOptions.password;
      fullName = emailOrOptions.full_name || emailOrOptions.fullName || '';
    } else {
      email = emailOrOptions;
      password = maybePassword || '';
      fullName = maybeFullName || '';
    }

    let supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      supabase = await ensureSupabaseClient();
    }

    if (!supabase) {
      if (isTestEnvironment) {
        const res = demoStorage.registerUser(fullName.trim(), email.trim());
        if (res.error) return { user: null, error: res.error };
        cachedUser = res.user;
        return { user: res.user };
      }
      const diag = getSupabaseDiagnostics();
      const detailedMsg = diag.recommendedAction
        ? `${diag.statusMessage} ${diag.recommendedAction}`
        : diag.statusMessage || 'Sistèm nan ap tann koneksyon Supabase. Tanpri verifye varyab anviwònman yo nan Vercel.';
      return {
        user: null,
        error: detailedMsg,
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'driver', // Toujou wòl chofè pa defo
          },
        },
      });

      if (error) {
        let kreyolMsg = error.message;
        if (error.message.includes('User already registered')) {
          kreyolMsg = 'Adrès imèl sa a deja gen yon kont nan sistèm nan.';
        } else if (error.message.includes('Password should be at least')) {
          kreyolMsg = 'Modpas la dwe gen omwen 6 karaktè.';
        } else if (error.message.includes('API key') || (error as any).status === 401 || (error as any).status === 403) {
          kreyolMsg = 'Kle API Supabase la (NEXT_PUBLIC_SUPABASE_ANON_KEY) pa rekonèt. Tanpri verifye kle a nan Vercel.';
        }
        return { user: null, error: kreyolMsg };
      }

      if (!data.user) {
        return { user: null, error: 'Enskripsyon an echwe. Tanpri eseye ankò.' };
      }

      // Immediately fetch profile
      const userProfile = await this.getAuthUser();
      return { user: userProfile };
    } catch (err: any) {
      return { user: null, error: err.message || 'Erè pandan kreyasyon kont lan.' };
    }
  },

  async signOut(): Promise<{ error?: string }> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    cachedUser = null;
    if (!supabase) {
      if (isTestEnvironment) {
        demoStorage.signOut();
      }
      return {};
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error: 'Erè pandan dekoneksyon an: ' + error.message };
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Erè pandan dekoneksyon an.' };
    }
  },

  /**
   * Request a password recovery email.
   * Prevents user enumeration by returning success unless a rate limit or fatal exception occurs.
   */
  async requestPasswordReset(
    email: string,
    redirectTo?: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      return { success: true };
    }

    try {
      const defaultRedirect =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/redefinir-senha`
          : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectTo || defaultRedirect,
      });

      if (error) {
        if (error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
          return {
            success: false,
            error: 'Ou voye twòp demand nan yon ti tan. Tanpri tann kèk minit anvan w eseye ankò.',
          };
        }
        console.warn('Avètisman resetPasswordForEmail:', error.message);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erè pandan voye lyen rekiperasyon an.' };
    }
  },

  /**
   * Update user password using the active session (recovery session)
   */
  async updatePassword(password: string): Promise<{ success: boolean; error?: string }> {
    if (!password || password.length < 6) {
      return { success: false, error: 'Modpas la dwe gen omwen 6 karaktè.' };
    }

    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      return { success: false, error: 'Sistèm nan pa konekte ak Supabase.' };
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        let kreyolMsg = error.message;
        if (error.message.includes('Password should be at least')) {
          kreyolMsg = 'Modpas la dwe gen omwen 6 karaktè.';
        } else if (
          error.message.includes('Auth session missing') ||
          error.message.includes('not logged in') ||
          error.message.includes('token is expired')
        ) {
          kreyolMsg = 'Sesyon rekiperasyon an ekspire oswa li pa valab. Tanpri mande yon nouvo lyen.';
        }
        return { success: false, error: kreyolMsg };
      }

      return { success: !!data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erè pandan anrejistreman nouvo modpas la.' };
    }
  },

  async updateProfile(
    userId: string,
    data: { full_name?: string; avatar_url?: string }
  ): Promise<{ success: boolean; user?: UserProfile; profile?: UserProfile; error?: string }> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      if (isTestEnvironment) {
        const res = demoStorage.updateProfile(userId, data);
        if (res.user) cachedUser = res.user;
        return { ...res, profile: res.user };
      }
      return { success: false, error: 'Sistèm nan pa konekte ak Supabase.' };
    }

    try {
      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (data.full_name) updates.full_name = data.full_name.trim();
      if (data.avatar_url !== undefined) updates.avatar_url = data.avatar_url;

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (profileError) {
        return { success: false, error: 'Erè pandan mizajou pwofil la: ' + profileError.message };
      }

      await supabase.auth.updateUser({
        data: updates,
      });

      const updated = await this.getAuthUser();
      return { success: true, user: updated || undefined, profile: updated || undefined };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erè pandan mizajou pwofil la.' };
    }
  },

  /**
   * Authoritative public global contribution total from real database.
   * If there are no approved contributions, truthfully returns R$ 0,00 (0 centavos).
   * Never hardcodes R$ 55,00 in production.
   */
  async getPublicGlobalBalance(): Promise<GlobalContributionSummary> {
    let supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      supabase = await ensureSupabaseClient();
    }
    if (!supabase) {
      if (isTestEnvironment) {
        return demoStorage.getPublicGlobalBalance();
      }
      return {
        total_approved_contributions_centavos: 0,
        total_approved_count: 0,
        last_updated: new Date().toISOString(),
      };
    }

    try {
      const { data, error } = await supabase.rpc('get_public_global_balance');
      if (!error && data) {
        return {
          total_approved_contributions_centavos: Number(
            data.total_approved_contributions_centavos || 0
          ),
          total_approved_count: Number(data.total_approved_count || 0),
          last_updated: data.last_updated || new Date().toISOString(),
        };
      }

      const { data: viewData, error: viewError } = await supabase
        .from('global_contribution_balance')
        .select('*')
        .maybeSingle();

      if (!viewError && viewData) {
        return {
          total_approved_contributions_centavos: Number(
            viewData.total_approved_contributions_centavos || 0
          ),
          total_approved_count: Number(viewData.total_approved_count || 0),
          last_updated: viewData.calculated_at || new Date().toISOString(),
        };
      }

      return {
        total_approved_contributions_centavos: 0,
        total_approved_count: 0,
        last_updated: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('Erè lekti balans nan Supabase:', err);
      return {
        total_approved_contributions_centavos: 0,
        total_approved_count: 0,
        last_updated: new Date().toISOString(),
      };
    }
  },

  subscribeToGlobalBalance(
    callback: (summary: GlobalContributionSummary) => void
  ): () => void {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      if (isTestEnvironment) {
        return demoStorage.subscribeToGlobalBalance(callback);
      }
      return () => {};
    }

    try {
      const channel = supabase
        .channel('public_global_balance_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'contribution_submissions' },
          async () => {
            try {
              const fresh = await this.getPublicGlobalBalance();
              callback(fresh);
            } catch (e) {
              console.error('Erè refresh balans kontribisyon:', e);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'public_donation_submissions' },
          async () => {
            try {
              const fresh = await this.getPublicGlobalBalance();
              callback(fresh);
            } catch (e) {
              console.error('Erè refresh balans donasyon:', e);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error('Erè Realtime subscribeToGlobalBalance:', err);
      return () => {};
    }
  },

  async getPaginatedPublicContributors(
    page: number = 1,
    pageSize: number = 5
  ): Promise<PaginatedContributorsResult> {
    let supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      supabase = await ensureSupabaseClient();
    }
    if (!supabase) {
      if (isTestEnvironment) {
        return demoStorage.getPaginatedPublicContributors(page, pageSize);
      }
      return {
        data: [],
        totalCount: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }

    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Query privacy-safe, publicly granted view public_approved_contributors
      const { data, count, error } = await supabase
        .from('public_approved_contributors')
        .select('*', { count: 'exact' })
        .order('approval_date', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Erè lekti kontribitè yo nan Supabase public_approved_contributors:', error);
        throw new Error(error.message || 'Erè pandan lekti kontribisyon piblik yo.');
      }

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      const mapped: PublicApprovedContributor[] = (data || []).map((row: any) => ({
        id: row.id,
        driver_id: row.driver_id,
        driver_name: row.driver_name || row.profiles?.full_name || 'Chofè',
        driver_avatar_url: row.driver_avatar_url || row.profiles?.avatar_url,
        amount_cents: Number(row.amount_cents ?? row.amount_centavos ?? 0),
        amount_centavos: Number(row.amount_centavos ?? row.amount_cents ?? 0),
        work_date: row.work_date,
        payment_date: row.payment_date,
        approval_date: row.approval_date || row.reviewed_at || row.payment_date,
        payment_method: row.payment_method || 'PIX',
        status: 'Apwouve',
      }));

      return {
        data: mapped,
        totalCount,
        page,
        pageSize,
        totalPages,
      };
    } catch (err: any) {
      console.error('Erè getPaginatedPublicContributors:', err);
      throw err;
    }
  },

  async getFinancialSummary(): Promise<FinancialSummary> {
    let supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      supabase = await ensureSupabaseClient();
    }
    if (!supabase) {
      if (isTestEnvironment) {
        return demoStorage.getFinancialSummary();
      }
      return {
        opening_balance_centavos: 0,
        total_contributions_centavos: 0,
        current_balance_centavos: 0,
        month_contributions_centavos: 0,
        today_contributions_centavos: 0,
        pending_count: 0,
        pending_centavos: 0,
        members_count: 0,
        last_updated: new Date().toISOString(),
      };
    }

    try {
      const { data, error } = await supabase.rpc('get_financial_summary');
      if (error) {
        console.error('Erè pandan apèl RPC get_financial_summary:', error);
        throw new Error(error.message);
      }
      return data as FinancialSummary;
    } catch (err: any) {
      console.error('Erè lekti rezime finansye nan Supabase:', err);
      return {
        opening_balance_centavos: 0,
        total_contributions_centavos: 0,
        current_balance_centavos: 0,
        month_contributions_centavos: 0,
        today_contributions_centavos: 0,
        pending_count: 0,
        pending_centavos: 0,
        members_count: 0,
        last_updated: new Date().toISOString(),
      };
    }
  },

  async getUnifiedTransactions(): Promise<UnifiedTransactionItem[]> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      if (isTestEnvironment) {
        return demoStorage.getUnifiedTransactions();
      }
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*, profiles(full_name, avatar_url)')
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((t: any) => ({
        id: t.id,
        type: 'CONTRIBUTION',
        title: t.profiles?.full_name ? `Kontribisyon: ${t.profiles.full_name}` : 'Donasyon PIX Piblik',
        amount_centavos: t.amount_cents,
        date: t.created_at ? t.created_at.split('T')[0] : '',
        timestamp: t.created_at,
        status: 'Apwouve',
        driver_avatar_url: t.profiles?.avatar_url,
      }));
    } catch {
      return [];
    }
  },

  async getPublicTransactions(): Promise<PublicContribution[]> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      if (isTestEnvironment) {
        return demoStorage.getPublicTransactions();
      }
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('public_approved_contributors')
        .select('*')
        .order('approval_date', { ascending: false });

      if (error || !data) return [];

      return data.map((sub: any) => ({
        id: sub.id,
        driver_name: sub.driver_name || 'Chofè',
        amount_centavos: Number(sub.amount_centavos ?? sub.amount_cents ?? 0),
        work_date: sub.work_date,
        payment_date: sub.payment_date,
        approval_date: sub.approval_date,
        status: 'Apwouve',
        driver_avatar_url: sub.driver_avatar_url,
      }));
    } catch {
      return [];
    }
  },

  async getSubmissionsForDriver(driverId: string): Promise<ContributionSubmission[]> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      if (isTestEnvironment) {
        return demoStorage.getSubmissionsForDriver(driverId);
      }
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('contribution_submissions')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data as ContributionSubmission[];
    } catch {
      return [];
    }
  },

  async getDriverSubmissions(driverId: string): Promise<ContributionSubmission[]> {
    return this.getSubmissionsForDriver(driverId);
  },

  async getAllPendingSubmissions(): Promise<ContributionSubmission[]> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      if (isTestEnvironment) {
        return demoStorage.getAllPendingSubmissions();
      }
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('contribution_submissions')
        .select('*, profiles!driver_id(full_name, avatar_url)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erè lekti kontribisyon an atant nan Supabase:', error);
        throw new Error(error.message || 'Erè lekti kontribisyon an atant yo');
      }

      return (data || []).map((sub: any) => ({
        ...sub,
        driver_name: sub.profiles?.full_name || 'Chofè',
        driver_avatar_url: sub.profiles?.avatar_url,
        amount_centavos: sub.amount_cents ?? sub.amount_centavos,
      }));
    } catch (err: any) {
      console.error('Erè getAllPendingSubmissions:', err);
      throw err;
    }
  },

  async getPendingSubmissions(): Promise<ContributionSubmission[]> {
    return this.getAllPendingSubmissions();
  },

  /**
   * Subscribe to real-time changes on contribution_submissions table for admin queue auto-refresh.
   */
  subscribeToPendingSubmissions(
    callback: () => void
  ): () => void {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) return () => {};

    try {
      const channel = supabase
        .channel('admin_pending_submissions_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'contribution_submissions' },
          () => {
            callback();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error('Erè Realtime subscribeToPendingSubmissions:', err);
      return () => {};
    }
  },

  async getAllSubmissions(): Promise<ContributionSubmission[]> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      if (isTestEnvironment) {
        return demoStorage.getAllSubmissions();
      }
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('contribution_submissions')
        .select('*, profiles!driver_id(full_name, avatar_url)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erè lekti tout kontribisyon nan Supabase:', error);
        throw new Error(error.message || 'Erè lekti tout kontribisyon yo');
      }

      return (data || []).map((sub: any) => ({
        ...sub,
        driver_name: sub.profiles?.full_name || 'Chofè',
        driver_avatar_url: sub.profiles?.avatar_url,
        amount_centavos: sub.amount_cents ?? sub.amount_centavos,
      }));
    } catch (err: any) {
      console.error('Erè getAllSubmissions:', err);
      throw err;
    }
  },

  async getAllAuditLogs(): Promise<AuditLogEntry[]> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      if (isTestEnvironment) {
        return demoStorage.getAllAuditLogs();
      }
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((log: any) => ({
        id: log.id,
        actor_id: log.actor_id,
        actor_name: log.profiles?.full_name || 'Sistèm',
        actor_role: (log.actor_role as any) || 'admin',
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        details: log.details || '',
        metadata: log.metadata,
        created_at: log.created_at,
      }));
    } catch {
      return [];
    }
  },

  async getAllProfiles(): Promise<UserProfile[]> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      if (isTestEnvironment) {
        return demoStorage.getAllProfiles();
      }
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (error || !data) return [];
      return data as UserProfile[];
    } catch {
      return [];
    }
  },

  async getAllMembers(): Promise<UserProfile[]> {
    return this.getAllProfiles();
  },

  async submitContribution(data: {
    driver_id?: string;
    work_date: string;
    payment_date?: string;
    amount_cents?: number;
    amount_centavos?: number;
    payment_method: PaymentMethod;
    transaction_ref?: string;
    receipt_url?: string;
    receipt_storage_path?: string;
    note?: string;
  }): Promise<{ submission?: ContributionSubmission | null; error?: string }> {
    const amount = data.amount_centavos ?? data.amount_cents ?? 0;
    if (amount < MINIMUM_CONTRIBUTION_CENTAVOS) {
      return { error: 'Kontribisyon an dwe omwen R$ 10,00.' };
    }

    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      if (isTestEnvironment) {
        return demoStorage.submitContribution({
          driver_id: data.driver_id || 'usr-driver-01',
          work_date: data.work_date,
          payment_date: data.payment_date || data.work_date,
          amount_centavos: amount,
          payment_method: data.payment_method,
          transaction_ref: data.transaction_ref,
          receipt_url: data.receipt_url,
          note: data.note,
        });
      }
      return { error: 'Sistèm nan pa konekte ak Supabase.' };
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const driverId = data.driver_id || user?.id;
      if (!driverId) {
        return { error: 'Ou dwe konekte pou w ka soumèt yon kontribisyon.' };
      }

      // Check duplicate work_date (rejected submissions may be re-submitted)
      const { data: existing } = await supabase
        .from('contribution_submissions')
        .select('id, status')
        .eq('driver_id', driverId)
        .eq('work_date', data.work_date)
        .neq('status', 'rejected')
        .limit(1)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'approved') {
          return { error: 'Ou te deja soumèt yon kontribisyon pou jou sa a epi li te apwouve.' };
        }
        if (existing.status === 'pending') {
          return { error: 'Ou gen yon kontribisyon ki deja an atant pou jou travay sa a.' };
        }
      }

      // Only columns that exist in public.contribution_submissions are sent.
      // The receipt is OPTIONAL: receipt_path is included only when a real path exists.
      const payload: Record<string, unknown> = {
        driver_id: driverId,
        work_date: data.work_date,
        amount_cents: amount,
        payment_method: data.payment_method,
        payment_date: data.payment_date || data.work_date,
        status: 'pending',
      };
      if (data.transaction_ref) payload.payment_reference = data.transaction_ref;
      if (data.note) payload.note = data.note;
      if (data.receipt_storage_path) payload.receipt_path = data.receipt_storage_path;

      const { data: inserted, error: insertError } = await supabase
        .from('contribution_submissions')
        .insert(payload)
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          return { error: 'Ou gen yon kontribisyon ki deja egziste pou jou travay sa a.' };
        }
        return { error: 'Erè pandan anrejistreman kontribisyon an: ' + insertError.message };
      }

      return { submission: inserted as ContributionSubmission };
    } catch (err: any) {
      return { error: err.message || 'Erè pandan soumèt kontribisyon an.' };
    }
  },

  async recordDirectContribution(data: {
    admin_id?: string;
    driver_id: string;
    work_date: string;
    amount_cents?: number;
    amount_centavos?: number;
    payment_method: PaymentMethod;
    payment_date: string;
    note?: string;
    notes?: string;
  }): Promise<{ submission?: ContributionSubmission | null; error?: string }> {
    const amount = data.amount_centavos ?? data.amount_cents ?? 0;
    const noteText = data.note || data.notes || '';
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      if (isTestEnvironment) {
        return demoStorage.recordDirectContribution({
          admin_id: data.admin_id || 'usr-admin-01',
          driver_id: data.driver_id,
          work_date: data.work_date,
          payment_date: data.payment_date,
          amount_centavos: amount,
          payment_method: data.payment_method,
          note: noteText,
        });
      }
      return { error: 'Sistèm nan pa konekte ak Supabase.' };
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const adminId = data.admin_id || user?.id;
      if (!adminId) {
        return { error: 'Otorizasyon manke.' };
      }

      if (amount < MINIMUM_CONTRIBUTION_CENTAVOS) {
        return { error: 'Kontribisyon an dwe omwen R$ 10,00.' };
      }

      // Atomic, admin-only, idempotent-by-unique-index RPC: creates the pending
      // submission and the audit log in ONE transaction.
      // Ledger entry is created ONLY when explicitly approved via approve_contribution.
      const { data: newId, error: rpcError } = await supabase.rpc('admin_record_contribution', {
        p_driver_id: data.driver_id,
        p_work_date: data.work_date,
        p_payment_date: data.payment_date,
        p_amount_cents: amount,
        p_payment_method: data.payment_method,
        p_note: noteText || null,
      });

      if (rpcError) {
        if (rpcError.code === 'PGRST202') {
          return {
            error:
              'Fonksyon baz done admin_record_contribution poko enstale. Egzekite migrasyon 20261013000000_admin_record_contribution.sql nan Supabase SQL Editor.',
          };
        }
        if (rpcError.code === '23505') {
          return { error: 'Gen yon kontribisyon ki deja egziste pou chofè sa a nan dat travay sa a.' };
        }
        return { error: 'Erè pandan anrejistreman dirèk la: ' + rpcError.message };
      }

      return {
        submission: {
          id: newId as string,
          driver_id: data.driver_id,
          work_date: data.work_date,
          payment_date: data.payment_date,
          amount_cents: amount,
          amount_centavos: amount,
          payment_method: data.payment_method,
          status: 'pending',
          created_by: adminId,
        } as unknown as ContributionSubmission,
      };
    } catch (err: any) {
      return { error: err.message || 'Erè pandan anrejistreman dirèk la.' };
    }
  },

  async approveSubmission(
    submissionId: string,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      if (isTestEnvironment) {
        return demoStorage.approveSubmission(submissionId, adminId);
      }
      return { success: false, error: 'Sistèm nan pa konekte ak Supabase.' };
    }

    const { error } = await supabase.rpc('approve_contribution', {
      p_submission_id: submissionId,
    });
    return error ? { success: false, error: error.message } : { success: true };
  },

  async rejectSubmission(
    submissionId: string,
    adminId: string,
    rejectionReason: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      if (isTestEnvironment) {
        return demoStorage.rejectSubmission(submissionId, adminId, rejectionReason);
      }
      return { success: false, error: 'Sistèm nan pa konekte ak Supabase.' };
    }

    const { error } = await supabase.rpc('reject_contribution', {
      p_submission_id: submissionId,
      p_reason: rejectionReason,
    });
    return error ? { success: false, error: error.message } : { success: true };
  },

  // --- PIX Settings ---
  async getPixSettings(): Promise<PixSettings> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) return DEFAULT_PIX_SETTINGS;

    try {
      const { data, error } = await supabase
        .from('pix_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error || !data) return DEFAULT_PIX_SETTINGS;
      return data as PixSettings;
    } catch {
      return DEFAULT_PIX_SETTINGS;
    }
  },

  async updatePixSettings(
    data: Partial<PixSettings>,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      if (isTestEnvironment) {
        return demoStorage.updatePixSettings(data, adminId);
      }
      return { success: false, error: 'Sistèm nan pa konekte ak Supabase.' };
    }

    try {
      const updates = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('pix_settings')
        .update(updates)
        .eq('id', 1);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // --- Public PIX Donations ---
  async submitPublicDonation(data: {
    donor_name: string;
    donor_contact?: string;
    amount_cents: number;
    payment_date: string;
    receipt_storage_path: string;
    message?: string;
  }): Promise<{ submission?: PublicDonationSubmission | null; error?: string }> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      if (isTestEnvironment) {
        return demoStorage.submitPublicDonation(data);
      }
      return { error: 'Sistèm nan pa konekte ak Supabase.' };
    }

    try {
      const { data: inserted, error: insertError } = await supabase
        .from('public_donation_submissions')
        .insert({
          donor_name: data.donor_name.trim(),
          donor_contact: data.donor_contact?.trim() || null,
          amount_cents: data.amount_cents,
          payment_date: data.payment_date,
          receipt_storage_path: data.receipt_storage_path,
          message: data.message?.trim() || null,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) {
        return { error: 'Erè pandan anrejistreman donasyon an: ' + insertError.message };
      }

      return {
        submission: {
          ...inserted,
          amount_centavos: inserted.amount_cents,
        } as PublicDonationSubmission,
      };
    } catch (err: any) {
      return { error: err.message || 'Erè pandan soumèt donasyon an.' };
    }
  },

  async getAllDonationSubmissions(): Promise<PublicDonationSubmission[]> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      if (isTestEnvironment) {
        return demoStorage.getAllDonationSubmissions();
      }
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('public_donation_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data.map((d: any) => ({
        ...d,
        amount_centavos: d.amount_cents,
      })) as PublicDonationSubmission[];
    } catch {
      return [];
    }
  },

  async getPendingDonationSubmissions(): Promise<PublicDonationSubmission[]> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      if (isTestEnvironment) {
        return demoStorage.getPendingDonationSubmissions();
      }
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('public_donation_submissions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error || !data) return [];
      return data.map((d: any) => ({
        ...d,
        amount_centavos: d.amount_cents,
      })) as PublicDonationSubmission[];
    } catch {
      return [];
    }
  },

  async approveDonationSubmission(
    donationId: string,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      if (isTestEnvironment) {
        return demoStorage.approveDonationSubmission(donationId, adminId);
      }
      return { success: false, error: 'Sistèm nan pa konekte ak Supabase.' };
    }

    const { error } = await supabase.rpc('approve_public_donation', {
      p_donation_id: donationId,
    });
    return error ? { success: false, error: error.message } : { success: true };
  },

  async rejectDonationSubmission(
    donationId: string,
    adminId: string,
    rejectionReason: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      if (isTestEnvironment) {
        return demoStorage.rejectDonationSubmission(donationId, adminId, rejectionReason);
      }
      return { success: false, error: 'Sistèm nan pa konekte ak Supabase.' };
    }

    const { error } = await supabase.rpc('reject_public_donation', {
      p_donation_id: donationId,
      p_reason: rejectionReason,
    });
    return error ? { success: false, error: error.message } : { success: true };
  },

  async createSignedReceiptUrl(storagePath: string): Promise<string | null> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      return storagePath.startsWith('data:') ? storagePath : null;
    }

    try {
      const { data, error } = await supabase.storage
        .from('donation-receipts')
        .createSignedUrl(storagePath, 600); // 10 minutes expiry

      if (error) {
        console.error('Erè pandan kreyasyon signed URL pou resi:', error);
        return null;
      }

      return data?.signedUrl || null;
    } catch (err) {
      console.error('Erè createSignedReceiptUrl:', err);
      return null;
    }
  },
};
