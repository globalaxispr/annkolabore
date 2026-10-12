import { isSupabaseConfigured, createClient } from './supabase/client';
import { DEFAULT_PIX_SETTINGS, demoStorage } from './demo-storage';
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

/** Cached user session in browser memory for sync components */
let cachedUser: UserProfile | null = null;

/**
 * Data access facade. Connects directly to Supabase when configured,
 * and seamlessly provides development-only demo fallback when credentials are not yet set.
 */
export const repository = {
  get isDemo() {
    return !isSupabaseConfigured();
  },

  get currentUser(): UserProfile | null {
    return this.getCurrentUser();
  },

  getCurrentUser(): UserProfile | null {
    if (cachedUser) return cachedUser;
    if (isSupabaseConfigured()) return null;
    return demoStorage.getCurrentUser();
  },

  /**
   * Fetch current authenticated user and profile from Supabase
   */
  async getAuthUser(): Promise<UserProfile | null> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      cachedUser = demoStorage.getCurrentUser();
      return cachedUser;
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
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      const all = demoStorage.getAllProfiles();
      const found = all.find((p) => p.email.toLowerCase() === email.toLowerCase());
      if (!found) {
        return { user: null, error: 'Nou pa jwenn okenn kont avèk adrès imèl sa a.' };
      }
      demoStorage.setCurrentUser(found.id);
      cachedUser = found;
      return { user: found };
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
        }
        return { user: null, error: kreyolMsg };
      }

      if (!data.user) {
        return { user: null, error: 'Koneksyon an echwe. Tanpri eseye ankò.' };
      }

      const userProfile = await this.getAuthUser();
      return { user: userProfile };
    } catch (err: any) {
      return { user: null, error: err.message || 'Erè pandan koneksyon an.' };
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

    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      const res = demoStorage.registerUser(fullName.trim(), email.trim());
      if (res.error) return { user: null, error: res.error };
      cachedUser = res.user;
      return { user: res.user };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'driver', // Always driver by default
          },
        },
      });

      if (error) {
        let kreyolMsg = error.message;
        if (error.message.includes('User already registered')) {
          kreyolMsg = 'Adrès imèl sa a deja gen yon kont nan sistèm nan.';
        } else if (error.message.includes('Password should be at least')) {
          kreyolMsg = 'Modpas la dwe gen omwen 6 karaktè.';
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
      demoStorage.signOut();
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
      return { success: true };
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
      const res = demoStorage.updateProfile(userId, data);
      if (res.user) cachedUser = res.user;
      return { ...res, profile: res.user };
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

      // Also update auth user metadata
      await supabase.auth.updateUser({
        data: updates,
      });

      const updated = await this.getAuthUser();
      return { success: true, user: updated || undefined, profile: updated || undefined };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erè pandan mizajou pwofil la.' };
    }
  },

  switchDemoUser(userId: string) {
    const user = demoStorage.setCurrentUser(userId);
    cachedUser = user;
    return user;
  },

  /**
   * Authoritative public global contribution total.
   * Publicly accessible by anonymous visitors without authentication.
   */
  async getPublicGlobalBalance(): Promise<GlobalContributionSummary> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) return demoStorage.getPublicGlobalBalance();

    try {
      // 1. Try secure RPC
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

      // 2. Database view
      const { data: viewData, error: viewError } = await supabase
        .from('global_contribution_balance')
        .select('*')
        .maybeSingle();

      if (!viewError) {
        return {
          total_approved_contributions_centavos: Number(
            viewData?.total_approved_contributions_centavos || 0
          ),
          total_approved_count: Number(viewData?.total_approved_count || 0),
          last_updated: viewData?.calculated_at || new Date().toISOString(),
        };
      }

      throw new Error(viewError.message);
    } catch (err: any) {
      console.error('Erè lekti balans nan Supabase:', err);
      throw new Error(err.message || 'Erè pandan lekti balans lan nan baz done a.');
    }
  },

  /**
   * Subscribe to authoritative real-time updates for the global fund balance.
   * Idempotent: re-fetches authoritative balance from database to prevent duplicate additions.
   */
  subscribeToGlobalBalance(
    callback: (summary: GlobalContributionSummary) => void
  ): () => void {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) {
      return demoStorage.subscribeToGlobalBalance(callback);
    }

    try {
      const channel = supabase
        .channel('public_global_balance_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'contribution_submissions',
          },
          async () => {
            try {
              const fresh = await repository.getPublicGlobalBalance();
              callback(fresh);
            } catch (e) {
              console.error('Erè rafrechi balans realtime:', e);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      return () => {};
    }
  },

  /**
   * Paginated recent contributors for public homepage.
   * Includes driver avatar, display name, amount in BRL, date and approval status.
   */
  async getPaginatedPublicContributors(
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedContributorsResult> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) return demoStorage.getPaginatedPublicContributors(page, pageSize);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await supabase
      .from('public_approved_contributors')
      .select('*', { count: 'exact' })
      .order('approval_date', { ascending: false })
      .order('id', { ascending: false }) // Stable secondary sort key
      .range(from, to);

    if (error) {
      console.error('Erè lekti kontribitè yo nan Supabase:', error);
      throw new Error('Erè pandan lekti kontribisyon yo nan baz done a: ' + error.message);
    }

    const items = data || [];
    const totalCount = count !== null && count !== undefined ? count : items.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return {
      data: items.map((d: any) => ({
        id: d.id,
        driver_id: d.driver_id,
        driver_name: d.driver_name,
        driver_avatar_url: d.driver_avatar_url,
        amount_cents: Number(d.amount_cents || d.amount_centavos || 0),
        amount_centavos: Number(d.amount_cents || d.amount_centavos || 0),
        work_date: d.work_date,
        payment_date: d.payment_date,
        approval_date: d.approval_date,
        payment_method: d.payment_method,
        status: 'Apwouve',
      })),
      page,
      pageSize,
      totalCount,
      totalPages,
    };
  },

  async getFinancialSummary(): Promise<FinancialSummary> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) return demoStorage.getFinancialSummary();

    const { data, error } = await supabase.rpc('get_financial_summary');
    if (error) {
      console.error('Erè RPC financial summary:', error);
      throw new Error('Erè pandan jenerasyon rapò finansye a: ' + error.message);
    }

    if (!data) {
      return {
        opening_balance_centavos: 0,
        total_contributions_centavos: 0,
        current_balance_centavos: 0,
        month_contributions_centavos: 0,
        today_contributions_centavos: 0,
        pending_count: 0,
        pending_centavos: 0,
        members_count: 0,
      };
    }

    return data as FinancialSummary;
  },

  async getUnifiedTransactions(): Promise<UnifiedTransactionItem[]> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) return demoStorage.getUnifiedTransactions();

    const { data, error } = await supabase
      .from('public_approved_contributors')
      .select('*')
      .order('approval_date', { ascending: false })
      .order('id', { ascending: false })
      .limit(500);

    if (error) {
      throw new Error('Erè pandan lekti tranzaksyon yo: ' + error.message);
    }
    if (!data) return [];
    return data.map((d: any) => ({
      id: d.id,
      type: 'CONTRIBUTION' as const,
      title: d.driver_name,
      driver_avatar_url: d.driver_avatar_url,
      amount_centavos: Number(d.amount_cents || d.amount_centavos),
      date: d.payment_date,
      timestamp: d.approval_date,
      status: 'Apwouve' as const,
      method: d.payment_method,
      subtitle: `Dat travay: ${d.work_date}`,
    }));
  },

  async getPublicTransactions(): Promise<PublicContribution[]> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) return demoStorage.getPublicTransactions();

    const { data, error } = await supabase
      .from('public_approved_contributors')
      .select('*')
      .order('approval_date', { ascending: false })
      .limit(500);

    if (error) {
      throw new Error('Erè lekti kontribisyon piblik: ' + error.message);
    }
    if (!data) return [];
    return data.map((d: any) => ({
      id: d.id,
      driver_name: d.driver_name,
      driver_avatar_url: d.driver_avatar_url,
      amount_centavos: Number(d.amount_cents || d.amount_centavos),
      work_date: d.work_date,
      payment_date: d.payment_date,
      approval_date: d.approval_date,
      status: 'APPROVED' as const,
    }));
  },

  async getDriverSubmissions(driverId: string): Promise<ContributionSubmission[]> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) return demoStorage.getSubmissionsForDriver(driverId);
    const { data } = await supabase
      .from('contribution_submissions')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });
    if (!data) return [];
    return data.map((d: any) => ({
      ...d,
      amount_centavos: Number(d.amount_cents || d.amount_centavos),
      status: d.status.toUpperCase() as any,
    }));
  },

  async getPendingSubmissions(): Promise<ContributionSubmission[]> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) return demoStorage.getAllPendingSubmissions();
    const { data } = await supabase
      .from('contribution_submissions')
      .select('*, driver:profiles(full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (!data) return [];
    return data.map((d: any) => ({
      ...d,
      driver_name: d.driver?.full_name || 'Chofè',
      amount_centavos: Number(d.amount_cents || d.amount_centavos),
      status: 'PENDING',
    }));
  },

  async getAllSubmissions(): Promise<ContributionSubmission[]> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) return demoStorage.getAllSubmissions();
    const { data } = await supabase
      .from('contribution_submissions')
      .select('*, driver:profiles(full_name)')
      .order('created_at', { ascending: false });
    if (!data) return [];
    return data.map((d: any) => ({
      ...d,
      driver_name: d.driver?.full_name || 'Chofè',
      amount_centavos: Number(d.amount_cents || d.amount_centavos),
      status: d.status.toUpperCase() as any,
    }));
  },

  async getAllAuditLogs(): Promise<AuditLogEntry[]> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) return demoStorage.getAllAuditLogs();
    const { data } = await supabase
      .from('audit_logs')
      .select('*, actor:profiles(full_name, role)')
      .order('created_at', { ascending: false });
    if (!data) return [];
    return data.map((d: any) => ({
      id: d.id,
      action: d.action,
      entity_type: d.entity_type,
      entity_id: d.entity_id,
      actor_id: d.actor_id,
      actor_name: d.actor?.full_name || 'Sistèm',
      actor_role: d.actor?.role || 'admin',
      metadata: d.metadata,
      details: d.details,
      created_at: d.created_at,
    }));
  },

  async getAllMembers(): Promise<UserProfile[]> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) return demoStorage.getAllProfiles();
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });
    return data || [];
  },

  async submitContribution(data: {
    driver_id: string;
    work_date: string;
    payment_date: string;
    amount_centavos: number;
    payment_method: PaymentMethod;
    transaction_ref?: string;
    receipt_url?: string;
    note?: string;
  }): Promise<{ submission: ContributionSubmission | null; error?: string }> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) return demoStorage.submitContribution(data);

    if (
      !Number.isInteger(data.amount_centavos) ||
      data.amount_centavos < MINIMUM_CONTRIBUTION_CENTAVOS
    ) {
      return { submission: null, error: 'Kontribisyon an dwe omwen R$ 10,00.' };
    }

    const { data: inserted, error } = await supabase
      .from('contribution_submissions')
      .insert({
        driver_id: data.driver_id,
        work_date: data.work_date,
        payment_date: data.payment_date,
        amount_cents: data.amount_centavos,
        payment_method: data.payment_method,
        payment_reference: data.transaction_ref,
        receipt_path: data.receipt_url,
        note: data.note,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return {
          submission: null,
          error: `Ou te deja soumèt yon kontribisyon pou dat travay sa a (${data.work_date}).`,
        };
      }
      return { submission: null, error: 'Soumisyon an pa t pase: ' + error.message };
    }

    return {
      submission: {
        ...inserted,
        amount_centavos: Number(inserted.amount_cents),
        status: 'PENDING',
      },
    };
  },

  async recordDirectContribution(data: {
    admin_id: string;
    driver_id: string;
    work_date: string;
    payment_date: string;
    amount_centavos: number;
    payment_method: PaymentMethod;
    note?: string;
  }): Promise<{ submission: ContributionSubmission | null; error?: string }> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) return demoStorage.recordDirectContribution(data);

    const subRes = await this.submitContribution({
      driver_id: data.driver_id,
      work_date: data.work_date,
      payment_date: data.payment_date,
      amount_centavos: data.amount_centavos,
      payment_method: data.payment_method,
      note: data.note || 'Anrejistre dirèk pa trezorye',
    });

    if (subRes.error || !subRes.submission) {
      return subRes;
    }

    const approveRes = await this.approveSubmission(subRes.submission.id, data.admin_id);
    if (!approveRes.success) {
      return { submission: null, error: approveRes.error || 'Erè pandan apwobasyon an.' };
    }

    return {
      submission: {
        ...subRes.submission,
        status: 'APPROVED',
      },
    };
  },

  async approveSubmission(
    submissionId: string,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) return demoStorage.approveSubmission(submissionId, adminId);

    // The RPC identifies the admin from auth.uid()
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
    if (!supabase) return demoStorage.rejectSubmission(submissionId, adminId, rejectionReason);

    const { error } = await supabase.rpc('reject_contribution', {
      p_submission_id: submissionId,
      p_reason: rejectionReason,
    });
    return error ? { success: false, error: error.message } : { success: true };
  },

  // --- PIX Settings ---
  async getPixSettings(): Promise<PixSettings> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) return demoStorage.getPixSettings();

    try {
      const { data, error } = await supabase
        .from('pix_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error || !data) {
        return DEFAULT_PIX_SETTINGS;
      }

      return {
        id: data.id,
        pix_key: data.pix_key,
        pix_key_type: data.pix_key_type,
        beneficiary_name: data.beneficiary_name,
        city: data.city,
        instructions: data.instructions,
        is_active: data.is_active,
        updated_at: data.updated_at,
      };
    } catch {
      return DEFAULT_PIX_SETTINGS;
    }
  },

  async updatePixSettings(
    data: Partial<PixSettings>,
    adminId: string
  ): Promise<{ success: boolean; settings?: PixSettings; error?: string }> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) return demoStorage.updatePixSettings(data, adminId);

    try {
      const { data: updated, error } = await supabase
        .from('pix_settings')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, settings: updated as PixSettings };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erè mete ajou konfigirasyon PIX.' };
    }
  },

  // --- Public Donation Submissions ---
  async submitPublicDonation(data: {
    donor_name: string;
    donor_contact?: string;
    amount_cents: number;
    payment_date: string;
    receipt_storage_path: string;
    message?: string;
  }): Promise<{ submission: PublicDonationSubmission | null; error?: string }> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) return demoStorage.submitPublicDonation(data);

    try {
      const { data: created, error } = await supabase
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

      if (error) {
        return { submission: null, error: error.message };
      }

      return {
        submission: {
          ...created,
          amount_centavos: created.amount_cents,
        },
      };
    } catch (err: any) {
      return { submission: null, error: err.message || 'Erè soumèt donasyon an.' };
    }
  },

  async getAllDonationSubmissions(): Promise<PublicDonationSubmission[]> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) return demoStorage.getAllDonationSubmissions();

    try {
      const { data, error } = await supabase
        .from('public_donation_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data.map((d: any) => ({
        ...d,
        amount_centavos: d.amount_cents,
      }));
    } catch {
      return [];
    }
  },

  async getPendingDonationSubmissions(): Promise<PublicDonationSubmission[]> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) return demoStorage.getPendingDonationSubmissions();

    try {
      const { data, error } = await supabase
        .from('public_donation_submissions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data.map((d: any) => ({
        ...d,
        amount_centavos: d.amount_cents,
      }));
    } catch {
      return [];
    }
  },

  async approveDonationSubmission(
    donationId: string,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) return demoStorage.approveDonationSubmission(donationId, adminId);

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
    if (!supabase) return demoStorage.rejectDonationSubmission(donationId, adminId, rejectionReason);

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
        .createSignedUrl(storagePath, 3600);

      if (error || !data?.signedUrl) return null;
      return data.signedUrl;
    } catch {
      return null;
    }
  },
};
