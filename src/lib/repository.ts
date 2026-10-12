import { isSupabaseConfigured, createClient } from './supabase/client';
import { demoStorage } from './demo-storage';
import {
  AuditLogEntry,
  ContributionSubmission,
  ExpenseRecord,
  FinancialSummary,
  UserProfile,
} from './types';

export interface RepositoryState {
  isDemo: boolean;
  currentUser: UserProfile | null;
  getFinancialSummary: () => Promise<FinancialSummary>;
  getPublicTransactions: () => Promise<{
    id: string;
    driver_name: string;
    amount_centavos: number;
    work_date: string;
    payment_date: string;
    approval_date: string;
    status: string;
  }[]>;
  getDriverSubmissions: (driverId: string) => Promise<ContributionSubmission[]>;
  getPendingSubmissions: () => Promise<ContributionSubmission[]>;
  getAllSubmissions: () => Promise<ContributionSubmission[]>;
  getAllExpenses: () => Promise<ExpenseRecord[]>;
  getAllAuditLogs: () => Promise<AuditLogEntry[]>;
  getAllMembers: () => Promise<UserProfile[]>;
  submitContribution: (data: {
    driver_id: string;
    work_date: string;
    payment_date: string;
    amount_centavos: number;
    payment_method: 'PIX' | 'Espès' | 'Transfè' | 'Lòt';
    transaction_ref?: string;
    receipt_url?: string;
    note?: string;
  }) => Promise<{ submission: ContributionSubmission | null; error?: string }>;
  approveSubmission: (
    submissionId: string,
    adminId: string
  ) => Promise<{ success: boolean; error?: string }>;
  rejectSubmission: (
    submissionId: string,
    adminId: string,
    rejectionReason: string
  ) => Promise<{ success: boolean; error?: string }>;
  recordExpense: (data: {
    admin_id: string;
    amount_centavos: number;
    expense_date: string;
    description: string;
    category: string;
    reference_note?: string;
  }) => Promise<{ expense: ExpenseRecord | null; error?: string }>;
  recordDirectContribution: (data: {
    admin_id: string;
    driver_id: string;
    work_date: string;
    payment_date: string;
    amount_centavos: number;
    payment_method: 'PIX' | 'Espès' | 'Transfè' | 'Lòt';
    note?: string;
  }) => Promise<{ submission: ContributionSubmission | null; error?: string }>;
  switchDemoUser: (userId: string) => UserProfile | null;
}

export const repository: RepositoryState = {
  get isDemo() {
    return !isSupabaseConfigured();
  },

  get currentUser() {
    return demoStorage.getCurrentUser();
  },

  async getFinancialSummary(): Promise<FinancialSummary> {
    if (!isSupabaseConfigured()) {
      return demoStorage.getFinancialSummary();
    }
    const supabase = createClient();
    if (!supabase) return demoStorage.getFinancialSummary();

    // Query from Supabase RPC or view
    const { data, error } = await supabase.rpc('get_financial_summary');
    if (error || !data) {
      return demoStorage.getFinancialSummary();
    }
    return data as FinancialSummary;
  },

  async getPublicTransactions() {
    if (!isSupabaseConfigured()) {
      return demoStorage.getPublicTransactions();
    }
    const supabase = createClient();
    if (!supabase) return demoStorage.getPublicTransactions();

    const { data } = await supabase
      .from('public_financial_records')
      .select('id, driver_name, amount_centavos, work_date, payment_date, approval_date, status')
      .order('approval_date', { ascending: false })
      .limit(50);

    return data || [];
  },

  async getDriverSubmissions(driverId: string) {
    if (!isSupabaseConfigured()) {
      return demoStorage.getSubmissionsForDriver(driverId);
    }
    const supabase = createClient();
    if (!supabase) return demoStorage.getSubmissionsForDriver(driverId);

    const { data } = await supabase
      .from('contribution_submissions')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    return data || [];
  },

  async getPendingSubmissions() {
    if (!isSupabaseConfigured()) {
      return demoStorage.getAllPendingSubmissions();
    }
    const supabase = createClient();
    if (!supabase) return demoStorage.getAllPendingSubmissions();

    const { data } = await supabase
      .from('contribution_submissions')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    return data || [];
  },

  async getAllSubmissions() {
    if (!isSupabaseConfigured()) {
      return demoStorage.getAllSubmissions();
    }
    const supabase = createClient();
    if (!supabase) return demoStorage.getAllSubmissions();

    const { data } = await supabase
      .from('contribution_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    return data || [];
  },

  async getAllExpenses() {
    if (!isSupabaseConfigured()) {
      return demoStorage.getAllExpenses();
    }
    const supabase = createClient();
    if (!supabase) return demoStorage.getAllExpenses();

    const { data } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false });

    return data || [];
  },

  async getAllAuditLogs() {
    if (!isSupabaseConfigured()) {
      return demoStorage.getAllAuditLogs();
    }
    const supabase = createClient();
    if (!supabase) return demoStorage.getAllAuditLogs();

    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    return data || [];
  },

  async getAllMembers() {
    if (!isSupabaseConfigured()) {
      return demoStorage.getAllProfiles();
    }
    const supabase = createClient();
    if (!supabase) return demoStorage.getAllProfiles();

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    return data || [];
  },

  async submitContribution(data) {
    if (!isSupabaseConfigured()) {
      return demoStorage.submitContribution(data);
    }
    const supabase = createClient();
    if (!supabase) return demoStorage.submitContribution(data);

    // Check duplicate
    const { data: existing } = await supabase
      .from('contribution_submissions')
      .select('id')
      .eq('driver_id', data.driver_id)
      .eq('work_date', data.work_date)
      .neq('status', 'REJECTED')
      .maybeSingle();

    if (existing) {
      return {
        submission: null,
        error: `Ou te deja soumèt yon kontribisyon pou dat travay sa a (${data.work_date}).`,
      };
    }

    const { data: inserted, error } = await supabase
      .from('contribution_submissions')
      .insert({
        driver_id: data.driver_id,
        work_date: data.work_date,
        payment_date: data.payment_date,
        amount_centavos: data.amount_centavos,
        payment_method: data.payment_method,
        transaction_ref: data.transaction_ref,
        receipt_url: data.receipt_url,
        note: data.note,
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) {
      return { submission: null, error: error.message };
    }
    return { submission: inserted };
  },

  async approveSubmission(submissionId, adminId) {
    if (!isSupabaseConfigured()) {
      return demoStorage.approveSubmission(submissionId, adminId);
    }
    const supabase = createClient();
    if (!supabase) return demoStorage.approveSubmission(submissionId, adminId);

    // Call atomic RPC stored procedure
    const { error } = await supabase.rpc('approve_contribution', {
      p_submission_id: submissionId,
      p_admin_id: adminId,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  async rejectSubmission(submissionId, adminId, rejectionReason) {
    if (!isSupabaseConfigured()) {
      return demoStorage.rejectSubmission(submissionId, adminId, rejectionReason);
    }
    const supabase = createClient();
    if (!supabase) return demoStorage.rejectSubmission(submissionId, adminId, rejectionReason);

    const { error } = await supabase.rpc('reject_contribution', {
      p_submission_id: submissionId,
      p_admin_id: adminId,
      p_reason: rejectionReason,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  async recordExpense(data) {
    if (!isSupabaseConfigured()) {
      return demoStorage.recordExpense(data);
    }
    const supabase = createClient();
    if (!supabase) return demoStorage.recordExpense(data);

    const { data: inserted, error } = await supabase
      .from('expenses')
      .insert({
        amount_centavos: data.amount_centavos,
        expense_date: data.expense_date,
        description: data.description,
        category: data.category,
        reference_note: data.reference_note,
        authorized_by: data.admin_id,
      })
      .select()
      .single();

    if (error) {
      return { expense: null, error: error.message };
    }
    return { expense: inserted };
  },

  async recordDirectContribution(data) {
    if (!isSupabaseConfigured()) {
      return demoStorage.recordDirectContribution(data);
    }
    const supabase = createClient();
    if (!supabase) return demoStorage.recordDirectContribution(data);

    const { data: inserted, error } = await supabase
      .from('contribution_submissions')
      .insert({
        driver_id: data.driver_id,
        work_date: data.work_date,
        payment_date: data.payment_date,
        amount_centavos: data.amount_centavos,
        payment_method: data.payment_method,
        note: data.note,
        status: 'APPROVED',
        reviewed_by: data.admin_id,
        reviewed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { submission: null, error: error.message };
    }
    return { submission: inserted };
  },

  switchDemoUser(userId: string) {
    return demoStorage.setCurrentUser(userId);
  },
};
