export type UserRole = 'driver' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at?: string;
}

export type PaymentMethod = 'PIX' | 'Espès' | 'Transfè' | 'Lòt';

export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ContributionSubmission {
  id: string;
  driver_id: string;
  driver_name: string;
  work_date: string; // YYYY-MM-DD
  payment_date: string; // YYYY-MM-DD
  amount_centavos: number; // integer centavos, positive amount (minimum 1 centavo / R$ 0,01)
  amount_cents?: number;
  payment_method: PaymentMethod;
  transaction_ref?: string;
  payment_reference?: string;
  receipt_url?: string;
  receipt_path?: string;
  note?: string;
  status: SubmissionStatus;
  rejection_reason?: string;
  created_by?: string;
  created_by_name?: string;
  reviewed_by?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at?: string;
}

/** Public, privacy-safe projection of an approved contribution. */
export interface PublicContribution {
  id: string;
  driver_name: string;
  amount_centavos: number;
  work_date: string;
  payment_date: string;
  approval_date: string;
  status: 'APPROVED' | 'Apwouve';
  driver_avatar_url?: string;
}

/**
 * Public approved contributor item with avatar and metadata for paginated list.
 */
export interface PublicApprovedContributor {
  id: string;
  driver_id: string;
  driver_name: string;
  driver_avatar_url?: string;
  amount_cents: number;
  amount_centavos: number;
  work_date: string;
  payment_date: string;
  approval_date: string;
  payment_method?: string;
  status: 'Apwouve' | 'approved';
}

export interface PaginatedContributorsResult {
  data: PublicApprovedContributor[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface AuditLogEntry {
  id: string;
  /** Historical rows may contain legacy action names; the UI renders unknown actions generically. */
  action: string;
  entity_type: string;
  entity_id: string;
  actor_id: string;
  actor_name: string;
  actor_role: UserRole;
  metadata?: Record<string, any>;
  details: string;
  created_at: string;
}

export interface FinancialSummary {
  opening_balance_centavos: number;
  total_contributions_centavos: number;
  current_balance_centavos: number;
  month_contributions_centavos: number;
  today_contributions_centavos: number;
  pending_count: number;
  pending_centavos: number;
  members_count: number;
  last_updated?: string;
}

/**
 * Public, privacy-safe aggregate representing the global approved contribution fund.
 * Strictly calculated from database records without exposing driver identity or personal info.
 */
export interface GlobalContributionSummary {
  total_approved_contributions_centavos: number;
  total_approved_count: number;
  last_updated?: string;
}

/**
 * Unified public ledger entry item for transaction feeds.
 */
export interface UnifiedTransactionItem {
  id: string;
  type: 'CONTRIBUTION' | 'DONATION';
  title: string;
  amount_centavos: number;
  date: string;
  timestamp: string;
  status: 'Apwouve';
  method?: string;
  ref?: string;
  subtitle?: string;
  driver_avatar_url?: string;
}

export type PixKeyType = 'CPF' | 'CNPJ' | 'Email' | 'Telefone' | 'Chave Aleatória';

export interface PixSettings {
  id: number;
  pix_key: string;
  pix_key_type: PixKeyType;
  beneficiary_name: string;
  city: string;
  instructions?: string;
  is_active: boolean;
  updated_at?: string;
}

export interface PublicDonationSubmission {
  id: string;
  donor_name: string;
  donor_contact?: string;
  amount_cents: number;
  amount_centavos: number;
  payment_date: string;
  receipt_storage_path: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected' | 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at?: string;
  receipt_signed_url?: string;
}
