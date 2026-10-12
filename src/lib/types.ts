export type UserRole = 'driver' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  created_at: string;
  updated_at?: string;
}

export type PaymentMethod = 'PIX' | 'Espès' | 'Transfè' | 'Lòt';

export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ContributionSubmission {
  id: string;
  driver_id: string;
  driver_name: string;
  work_date: string; // YYYY-MM-DD
  payment_date: string; // YYYY-MM-DD
  amount_centavos: number; // e.g. 1000 = R$ 10,00, can be > 1000
  payment_method: PaymentMethod;
  transaction_ref?: string;
  receipt_url?: string;
  note?: string;
  status: SubmissionStatus;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at?: string;
}

export type TransactionType = 'CONTRIBUTION' | 'WITHDRAWAL' | 'REVERSAL' | 'CORRECTION';

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  amount_centavos: number;
  submission_id?: string;
  withdrawal_id?: string;
  driver_id?: string;
  driver_name?: string;
  work_date?: string;
  payment_date?: string;
  transaction_date: string;
  description: string;
  recorded_by: string;
  recorded_by_name: string;
  created_at: string;
}

export type WithdrawalStatus = 'Pwograme' | 'An Atant' | 'Egzekite' | 'Anile';

export interface ScheduledWithdrawal {
  id: string;
  description: string;
  amount_centavos: number;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time?: string;
  status: WithdrawalStatus;
  created_by: string;
  created_by_name: string;
  note?: string;
  executed_by?: string;
  executed_by_name?: string;
  executed_at?: string;
  cancelled_by?: string;
  cancelled_by_name?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Historical Expense interface preserved for backward-compatibility migration
 */
export interface ExpenseRecord {
  id: string;
  amount_centavos: number;
  expense_date: string;
  description: string;
  category: string;
  authorized_by: string;
  authorized_by_name: string;
  reference_note?: string;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  action:
    | 'SUBMIT_CONTRIBUTION'
    | 'APPROVE_CONTRIBUTION'
    | 'REJECT_CONTRIBUTION'
    | 'SCHEDULE_WITHDRAWAL'
    | 'EXECUTE_WITHDRAWAL'
    | 'CANCEL_WITHDRAWAL'
    | 'RECORD_EXPENSE'
    | 'REVERSE_TRANSACTION'
    | 'DIRECT_CONTRIBUTION';
  entity_type: 'submission' | 'withdrawal' | 'expense' | 'transaction' | 'profile';
  entity_id: string;
  actor_id: string;
  actor_name: string;
  actor_role: UserRole;
  details: string;
  created_at: string;
}

export interface FinancialSummary {
  total_contributions_centavos: number;
  total_withdrawals_centavos: number;
  current_balance_centavos: number;
  scheduled_withdrawals_centavos: number;
  projected_balance_centavos: number;
  members_count: number;
  today_contributions_centavos: number;
  month_contributions_centavos: number;
  last_updated?: string;
}
