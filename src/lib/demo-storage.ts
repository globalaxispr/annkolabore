import {
  AuditLogEntry,
  ContributionSubmission,
  FinancialSummary,
  GlobalContributionSummary,
  PaginatedContributorsResult,
  PixSettings,
  PublicApprovedContributor,
  PublicContribution,
  PublicDonationSubmission,
  UnifiedTransactionItem,
  UserProfile,
} from './types';
import {
  calculateFinancialSummary,
  calculateGlobalContributionSummary,
  validateContributionAmount,
  OPENING_BALANCE_CENTAVOS,
} from './financial';

/**
 * DEVELOPMENT-ONLY demo data. Never represents real or verified transactions.
 * Used only when Supabase credentials are not configured.
 */

const ADMIN_NAME = 'Frantz Augustin (Trezorye)';

export const DEMO_PROFILES: UserProfile[] = [
  {
    id: 'usr-admin-01',
    email: 'trezorye@legliz.test',
    full_name: ADMIN_NAME,
    role: 'admin',
    phone: '+55 11 98765-4321',
    created_at: '2026-01-01T10:00:00Z',
  },
  {
    id: 'usr-driver-01',
    email: 'jean.pierre@chofe.test',
    full_name: 'Jean Baptiste Pierre',
    role: 'driver',
    phone: '+55 11 91234-5678',
    created_at: '2026-01-05T12:00:00Z',
  },
  {
    id: 'usr-driver-02',
    email: 'marc.desir@chofe.test',
    full_name: 'Marc Antoine Désir',
    role: 'driver',
    phone: '+55 11 92345-6789',
    created_at: '2026-01-10T14:30:00Z',
  },
  {
    id: 'usr-driver-03',
    email: 'wilner.joseph@chofe.test',
    full_name: 'Wilner Joseph',
    role: 'driver',
    phone: '+55 11 93456-7890',
    created_at: '2026-01-15T09:15:00Z',
  },
  {
    id: 'usr-driver-04',
    email: 'emmanuel.charles@chofe.test',
    full_name: 'Emmanuel Charles',
    role: 'driver',
    phone: '+55 11 94567-8901',
    created_at: '2026-02-01T11:45:00Z',
  },
];

export const DEMO_SUBMISSIONS: ContributionSubmission[] = [
  {
    id: 'sub-001',
    driver_id: 'usr-driver-01',
    driver_name: 'Jean Baptiste Pierre',
    work_date: '2026-10-10',
    payment_date: '2026-10-10',
    amount_centavos: 1000,
    payment_method: 'PIX',
    transaction_ref: 'PIX-98234-JB',
    status: 'APPROVED',
    reviewed_by: 'usr-admin-01',
    reviewed_by_name: ADMIN_NAME,
    reviewed_at: '2026-10-10T19:00:00Z',
    created_at: '2026-10-10T18:30:00Z',
  },
  {
    id: 'sub-002',
    driver_id: 'usr-driver-02',
    driver_name: 'Marc Antoine Désir',
    work_date: '2026-10-10',
    payment_date: '2026-10-10',
    amount_centavos: 2000,
    payment_method: 'PIX',
    transaction_ref: 'PIX-11223-MD',
    note: 'Kontribisyon espesyal R$ 20 pou jounen an',
    status: 'APPROVED',
    reviewed_by: 'usr-admin-01',
    reviewed_by_name: ADMIN_NAME,
    reviewed_at: '2026-10-10T20:15:00Z',
    created_at: '2026-10-10T19:45:00Z',
  },
  {
    id: 'sub-003',
    driver_id: 'usr-driver-03',
    driver_name: 'Wilner Joseph',
    work_date: '2026-10-11',
    payment_date: '2026-10-11',
    amount_centavos: 1500,
    payment_method: 'Espès',
    note: 'Remèt nan men trezorye apre sèvis dimanch',
    status: 'APPROVED',
    reviewed_by: 'usr-admin-01',
    reviewed_by_name: ADMIN_NAME,
    reviewed_at: '2026-10-11T14:00:00Z',
    created_at: '2026-10-11T13:30:00Z',
  },
  {
    id: 'sub-004',
    driver_id: 'usr-driver-01',
    driver_name: 'Jean Baptiste Pierre',
    work_date: '2026-10-11',
    payment_date: '2026-10-11',
    amount_centavos: 1000,
    payment_method: 'PIX',
    transaction_ref: 'PIX-44321-JB',
    status: 'APPROVED',
    reviewed_by: 'usr-admin-01',
    reviewed_by_name: ADMIN_NAME,
    reviewed_at: '2026-10-11T21:00:00Z',
    created_at: '2026-10-11T20:40:00Z',
  },
  {
    id: 'sub-005',
    driver_id: 'usr-driver-02',
    driver_name: 'Marc Antoine Désir',
    work_date: '2026-10-12',
    payment_date: '2026-10-12',
    amount_centavos: 1000,
    payment_method: 'PIX',
    transaction_ref: 'PIX-99887-MD',
    note: 'Jounen lendi travay nan zòn santral',
    status: 'PENDING',
    created_at: '2026-10-12T08:15:00Z',
  },
  {
    id: 'sub-006',
    driver_id: 'usr-driver-04',
    driver_name: 'Emmanuel Charles',
    work_date: '2026-10-12',
    payment_date: '2026-10-12',
    amount_centavos: 5000,
    payment_method: 'PIX',
    transaction_ref: 'PIX-77665-EC',
    note: 'Benediksyon espesyal pou legliz la',
    status: 'PENDING',
    created_at: '2026-10-12T09:30:00Z',
  },
  {
    id: 'sub-007',
    driver_id: 'usr-driver-03',
    driver_name: 'Wilner Joseph',
    work_date: '2026-10-09',
    payment_date: '2026-10-09',
    amount_centavos: 1000,
    payment_method: 'PIX',
    transaction_ref: 'ERRO-000',
    status: 'REJECTED',
    rejection_reason:
      'Prèv peman an pa t klè, nimewo tranzaksyon an pa t pase sou kont legliz la.',
    reviewed_by: 'usr-admin-01',
    reviewed_by_name: ADMIN_NAME,
    reviewed_at: '2026-10-09T18:00:00Z',
    created_at: '2026-10-09T17:00:00Z',
  },
];

export const DEMO_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-001',
    action: 'APPROVE_CONTRIBUTION',
    entity_type: 'submission',
    entity_id: 'sub-001',
    actor_id: 'usr-admin-01',
    actor_name: ADMIN_NAME,
    actor_role: 'admin',
    details: 'Apwouve kontribisyon R$ 10,00 pou Jean Baptiste Pierre (Travay: 10/10/2026)',
    created_at: '2026-10-10T19:00:00Z',
  },
  {
    id: 'aud-002',
    action: 'APPROVE_CONTRIBUTION',
    entity_type: 'submission',
    entity_id: 'sub-002',
    actor_id: 'usr-admin-01',
    actor_name: ADMIN_NAME,
    actor_role: 'admin',
    details: 'Apwouve kontribisyon R$ 20,00 pou Marc Antoine Désir (Travay: 10/10/2026)',
    created_at: '2026-10-10T20:15:00Z',
  },
  {
    id: 'aud-003',
    action: 'REJECT_CONTRIBUTION',
    entity_type: 'submission',
    entity_id: 'sub-007',
    actor_id: 'usr-admin-01',
    actor_name: ADMIN_NAME,
    actor_role: 'admin',
    details: 'Refize kontribisyon Wilner Joseph. Rezon: Prèv peman an pa t klè.',
    created_at: '2026-10-09T18:00:00Z',
  },
];

// v3 keys: older demo data in the browser is ignored rather than migrated.
const STORAGE_KEY_PROFILES = 'knt_profiles_v3';
const STORAGE_KEY_SUBMISSIONS = 'knt_submissions_v3';
const STORAGE_KEY_AUDIT = 'knt_audit_v3';
const STORAGE_KEY_CURRENT_USER = 'knt_current_user_v3';
const STORAGE_KEY_PIX_SETTINGS = 'knt_pix_settings_v3';
const STORAGE_KEY_DONATIONS = 'knt_donations_v3';

export const DEFAULT_PIX_SETTINGS: PixSettings = {
  id: 1,
  pix_key: '70310589290',
  pix_key_type: 'CPF',
  beneficiary_name: 'Frantzciou Dorleans',
  city: 'Pato Branco',
  instructions:
    'Fè transfè PIX la nan aplikasyon labank ou, answit soumèt resi peman an anba a pou administratè a ka konfime li.',
  is_active: true,
  updated_at: '2026-10-12T00:00:00Z',
};

const clone = <T,>(items: T[]): T[] => items.map((i) => ({ ...i }));

const brl = (centavos: number) =>
  `R$ ${(centavos / 100).toFixed(2).replace('.', ',')}`;

class DemoStorage {
  private profiles: UserProfile[] = clone(DEMO_PROFILES);
  private submissions: ContributionSubmission[] = clone(DEMO_SUBMISSIONS);
  private donationSubmissions: PublicDonationSubmission[] = [];
  private pixSettings: PixSettings = { ...DEFAULT_PIX_SETTINGS };
  private auditLogs: AuditLogEntry[] = clone(DEMO_AUDIT_LOGS);
  private currentUserId = 'usr-driver-01';
  private balanceListeners: Array<(balance: GlobalContributionSummary) => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private loadFromStorage() {
    if (!this.isBrowser()) return;
    try {
      const p = localStorage.getItem(STORAGE_KEY_PROFILES);
      if (p) this.profiles = JSON.parse(p);
      const s = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
      if (s) this.submissions = JSON.parse(s);
      const d = localStorage.getItem(STORAGE_KEY_DONATIONS);
      if (d) this.donationSubmissions = JSON.parse(d);
      const pix = localStorage.getItem(STORAGE_KEY_PIX_SETTINGS);
      if (pix) this.pixSettings = JSON.parse(pix);
      const a = localStorage.getItem(STORAGE_KEY_AUDIT);
      if (a) this.auditLogs = JSON.parse(a);
      const u = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (u !== null) this.currentUserId = u;
    } catch {
      // fall back to in-memory defaults
    }
  }

  private saveToStorage() {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(this.profiles));
      localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(this.submissions));
      localStorage.setItem(STORAGE_KEY_DONATIONS, JSON.stringify(this.donationSubmissions));
      localStorage.setItem(STORAGE_KEY_PIX_SETTINGS, JSON.stringify(this.pixSettings));
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(this.auditLogs));
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, this.currentUserId);
    } catch {
      // ignore quota errors
    }
  }

  private log(entry: Omit<AuditLogEntry, 'id' | 'created_at'>) {
    this.auditLogs.push({
      ...entry,
      id: `aud-${Date.now()}-${this.auditLogs.length}`,
      created_at: new Date().toISOString(),
    });
  }

  private getAdmin(adminId: string): UserProfile | null {
    const admin = this.profiles.find((p) => p.id === adminId);
    return admin && admin.role === 'admin' ? admin : null;
  }

  public resetDemoData() {
    this.profiles = clone(DEMO_PROFILES);
    this.submissions = clone(DEMO_SUBMISSIONS);
    this.donationSubmissions = [];
    this.pixSettings = { ...DEFAULT_PIX_SETTINGS };
    this.auditLogs = clone(DEMO_AUDIT_LOGS);
    this.currentUserId = 'usr-driver-01';
    this.saveToStorage();
    this.notifyBalanceListeners();
  }

  // --- Session (demo) ---

  public getCurrentUser(): UserProfile | null {
    if (!this.currentUserId) return null;
    return this.profiles.find((p) => p.id === this.currentUserId) || null;
  }

  public setCurrentUser(userId: string): UserProfile | null {
    const user = this.profiles.find((p) => p.id === userId);
    if (!user) return null;
    this.currentUserId = userId;
    this.saveToStorage();
    return user;
  }

  public signOut() {
    this.currentUserId = '';
    this.saveToStorage();
  }

  public getAllProfiles(): UserProfile[] {
    return clone(this.profiles);
  }

  public registerUser(
    full_name: string,
    email: string
  ): { user: UserProfile; error?: string } {
    if (this.profiles.some((p) => p.email.toLowerCase() === email.toLowerCase())) {
      return { user: null as unknown as UserProfile, error: 'Adrès imèl sa a deja gen yon kont' };
    }
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      full_name,
      role: 'driver', // new accounts are always drivers
      created_at: new Date().toISOString(),
    };
    this.profiles.push(newUser);
    this.currentUserId = newUser.id;
    this.saveToStorage();
    return { user: newUser };
  }

  public updateProfile(
    userId: string,
    data: { full_name?: string; avatar_url?: string }
  ): { success: boolean; user?: UserProfile; error?: string } {
    const user = this.profiles.find((p) => p.id === userId);
    if (!user) return { success: false, error: 'Itilizatè pa jwenn' };

    if (data.full_name && data.full_name.trim().length >= 3) {
      user.full_name = data.full_name.trim();
    }
    if (data.avatar_url !== undefined) {
      user.avatar_url = data.avatar_url;
    }
    user.updated_at = new Date().toISOString();
    this.saveToStorage();
    return { success: true, user: { ...user } };
  }

  // --- Read models ---

  public getFinancialSummary(): FinancialSummary {
    return calculateFinancialSummary(
      this.submissions,
      this.profiles.filter((p) => p.role === 'driver').length,
      undefined,
      OPENING_BALANCE_CENTAVOS,
      this.donationSubmissions
    );
  }

  /**
   * Public aggregate of all approved contributions and approved public donations.
   * Excludes pending and rejected contributions.
   */
  public getPublicGlobalBalance(): GlobalContributionSummary {
    return calculateGlobalContributionSummary(
      this.submissions,
      OPENING_BALANCE_CENTAVOS,
      this.donationSubmissions
    );
  }

  /**
   * Realtime reactive subscription to global balance updates.
   */
  public subscribeToGlobalBalance(
    listener: (balance: GlobalContributionSummary) => void
  ): () => void {
    this.balanceListeners.push(listener);
    return () => {
      this.balanceListeners = this.balanceListeners.filter((l) => l !== listener);
    };
  }

  private notifyBalanceListeners() {
    const balance = this.getPublicGlobalBalance();
    for (const listener of this.balanceListeners) {
      try {
        listener(balance);
      } catch (err) {
        console.error('Erè nan listener balans:', err);
      }
    }
  }

  /** Unified transaction stream of official approved contributions and donations. */
  public getUnifiedTransactions(): UnifiedTransactionItem[] {
    const contribItems: UnifiedTransactionItem[] = this.submissions
      .filter((s) => s.status === 'APPROVED')
      .map((s) => ({
        id: s.id,
        type: 'CONTRIBUTION' as const,
        title: s.driver_name,
        amount_centavos: s.amount_centavos,
        date: s.payment_date,
        timestamp: s.reviewed_at || s.created_at,
        status: 'Apwouve' as const,
        method: s.payment_method,
        ref: s.transaction_ref,
        subtitle: `Dat travay: ${s.work_date}`,
      }));

    const donationItems: UnifiedTransactionItem[] = this.donationSubmissions
      .filter((d) => d.status === 'APPROVED' || d.status === 'approved')
      .map((d) => ({
        id: d.id,
        type: 'DONATION' as const,
        title: d.donor_name,
        amount_centavos: d.amount_centavos || d.amount_cents,
        date: d.payment_date,
        timestamp: d.reviewed_at || d.created_at,
        status: 'Apwouve' as const,
        method: 'PIX',
        ref: `DON-${d.id.slice(0, 8)}`,
        subtitle: 'Donasyon Piblik',
      }));

    return [...contribItems, ...donationItems].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /** Approved contributions only, with no private fields (email, receipt, note). */
  public getPublicTransactions(): PublicContribution[] {
    return this.submissions
      .filter((s) => s.status === 'APPROVED' || s.status === 'approved')
      .map((s) => {
        const driver = this.profiles.find((p) => p.id === s.driver_id);
        return {
          id: s.id,
          driver_name: s.driver_name,
          driver_avatar_url: driver?.avatar_url,
          amount_centavos: s.amount_centavos,
          work_date: s.work_date,
          payment_date: s.payment_date,
          approval_date: s.reviewed_at || s.created_at,
          status: 'APPROVED' as const,
        };
      })
      .sort(
        (a, b) => new Date(b.approval_date).getTime() - new Date(a.approval_date).getTime()
      );
  }

  /**
   * Paginated public approved contributors list with stable secondary sort key.
   */
  public getPaginatedPublicContributors(
    page: number = 1,
    pageSize: number = 6
  ): PaginatedContributorsResult {
    const approvedList: PublicApprovedContributor[] = this.submissions
      .filter((s) => s.status === 'APPROVED' || s.status === 'approved')
      .map((s) => {
        const driver = this.profiles.find((p) => p.id === s.driver_id);
        return {
          id: s.id,
          driver_id: s.driver_id,
          driver_name: s.driver_name,
          driver_avatar_url: driver?.avatar_url,
          amount_cents: s.amount_centavos,
          amount_centavos: s.amount_centavos,
          work_date: s.work_date,
          payment_date: s.payment_date,
          approval_date: s.reviewed_at || s.created_at,
          payment_method: s.payment_method,
          status: 'Apwouve' as const,
        };
      })
      .sort((a, b) => {
        const timeDiff =
          new Date(b.approval_date).getTime() - new Date(a.approval_date).getTime();
        if (timeDiff !== 0) return timeDiff;
        return b.id.localeCompare(a.id); // Stable secondary sort
      });

    const totalCount = approvedList.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const normalizedPage = Math.max(1, page);
    const start = (normalizedPage - 1) * pageSize;
    const data = start < totalCount ? approvedList.slice(start, start + pageSize) : [];

    return {
      data,
      page: normalizedPage,
      pageSize,
      totalCount,
      totalPages,
    };
  }

  public getSubmissionsForDriver(driverId: string): ContributionSubmission[] {
    return this.submissions
      .filter((s) => s.driver_id === driverId)
      .map((s) => ({ ...s }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getAllPendingSubmissions(): ContributionSubmission[] {
    return this.getAllSubmissions().filter((s) => s.status.toLowerCase() === 'pending');
  }

  public getAllSubmissions(): ContributionSubmission[] {
    return clone(this.submissions).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public getAllAuditLogs(): AuditLogEntry[] {
    return clone(this.auditLogs).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // --- Commands ---

  public submitContribution(data: {
    driver_id: string;
    work_date: string;
    payment_date: string;
    amount_centavos: number;
    payment_method: 'PIX' | 'Espès' | 'Transfè' | 'Lòt';
    transaction_ref?: string;
    receipt_url?: string;
    note?: string;
  }): { submission: ContributionSubmission | null; error?: string } {
    const driver = this.profiles.find((p) => p.id === data.driver_id);
    if (!driver) return { submission: null, error: 'Chofè sa a pa egziste nan sistèm nan' };

    const val = validateContributionAmount(data.amount_centavos);
    if (!val.valid) return { submission: null, error: val.error };

    // Accidental double-click protection: if the exact same submission was submitted within 1.5 seconds
    const recentDuplicate = this.submissions.find(
      (s) =>
        s.driver_id === data.driver_id &&
        s.work_date === data.work_date &&
        s.amount_centavos === data.amount_centavos &&
        s.payment_method === data.payment_method &&
        Date.now() - new Date(s.created_at).getTime() < 1500
    );
    if (recentDuplicate) {
      return {
        submission: null,
        error: 'Yon soumisyon idantik fèk fèt. Si ou vle fè yon lòt kontribisyon, tanpri tann 2 segond (pwoteksyon kont doub klik).',
      };
    }

    const newSub: ContributionSubmission = {
      id: `sub-${Date.now()}-${this.submissions.length}`,
      driver_id: data.driver_id,
      driver_name: driver.full_name,
      work_date: data.work_date,
      payment_date: data.payment_date,
      amount_centavos: data.amount_centavos,
      payment_method: data.payment_method,
      transaction_ref: data.transaction_ref,
      receipt_url: data.receipt_url,
      note: data.note,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };
    this.submissions.push(newSub);
    this.log({
      action: 'SUBMIT_CONTRIBUTION',
      entity_type: 'submission',
      entity_id: newSub.id,
      actor_id: driver.id,
      actor_name: driver.full_name,
      actor_role: driver.role,
      details: `Soumèt kontribisyon ${brl(data.amount_centavos)} pou travay ${data.work_date}`,
    });
    this.saveToStorage();
    return { submission: { ...newSub } };
  }

  public approveSubmission(
    submissionId: string,
    adminId: string
  ): { success: boolean; error?: string } {
    const admin = this.getAdmin(adminId);
    if (!admin) {
      return { success: false, error: 'Aksyon sa a mande otorizasyon administratè oswa trezorye.' };
    }
    const sub = this.submissions.find((s) => s.id === submissionId);
    if (!sub) return { success: false, error: 'Kontribisyon sa a pa jwenn nan sistèm nan.' };
    if (sub.status !== 'PENDING') {
      return { success: false, error: "Kontribisyon sa a pa nan eta 'An Atant' ankò." };
    }

    const now = new Date().toISOString();
    sub.status = 'APPROVED';
    sub.reviewed_by = admin.id;
    sub.reviewed_by_name = admin.full_name;
    sub.reviewed_at = now;
    sub.updated_at = now;

    this.log({
      action: 'APPROVE_CONTRIBUTION',
      entity_type: 'submission',
      entity_id: sub.id,
      actor_id: admin.id,
      actor_name: admin.full_name,
      actor_role: 'admin',
      details: `Apwouve kontribisyon ${brl(sub.amount_centavos)} pou ${sub.driver_name} (Travay: ${sub.work_date})`,
    });
    this.saveToStorage();
    this.notifyBalanceListeners();
    return { success: true };
  }

  public rejectSubmission(
    submissionId: string,
    adminId: string,
    rejectionReason: string
  ): { success: boolean; error?: string } {
    const admin = this.getAdmin(adminId);
    if (!admin) {
      return { success: false, error: 'Aksyon sa a mande otorizasyon administratè oswa trezorye.' };
    }
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      return { success: false, error: 'Tanpri bay yon rezon klè pou refi a (omwen 5 karaktè).' };
    }
    const sub = this.submissions.find((s) => s.id === submissionId);
    if (!sub) return { success: false, error: 'Kontribisyon sa a pa jwenn nan sistèm nan.' };
    if (sub.status !== 'PENDING') {
      return { success: false, error: "Kontribisyon sa a pa nan eta 'An Atant' ankò." };
    }

    const now = new Date().toISOString();
    sub.status = 'REJECTED';
    sub.rejection_reason = rejectionReason.trim();
    sub.reviewed_by = admin.id;
    sub.reviewed_by_name = admin.full_name;
    sub.reviewed_at = now;
    sub.updated_at = now;

    this.log({
      action: 'REJECT_CONTRIBUTION',
      entity_type: 'submission',
      entity_id: sub.id,
      actor_id: admin.id,
      actor_name: admin.full_name,
      actor_role: 'admin',
      details: `Refize kontribisyon ${sub.driver_name}. Rezon: ${rejectionReason.trim()}`,
    });
    this.saveToStorage();
    return { success: true };
  }

  /** Treasurer records a verified cash contribution handed over directly. */
  public recordDirectContribution(data: {
    admin_id: string;
    driver_id: string;
    work_date: string;
    payment_date: string;
    amount_centavos: number;
    payment_method: 'PIX' | 'Espès' | 'Transfè' | 'Lòt';
    note?: string;
  }): { submission: ContributionSubmission | null; error?: string } {
    const admin = this.getAdmin(data.admin_id);
    if (!admin) return { submission: null, error: 'Aksyon sa a mande otorizasyon administratè.' };

    const val = validateContributionAmount(data.amount_centavos);
    if (!val.valid) return { submission: null, error: val.error };

    const driver = this.profiles.find((p) => p.id === data.driver_id);
    if (!driver) return { submission: null, error: 'Chofè a pa jwenn.' };



    const now = new Date().toISOString();
    const newSub: ContributionSubmission = {
      id: `sub-${Date.now()}-${this.submissions.length}`,
      driver_id: driver.id,
      driver_name: driver.full_name,
      work_date: data.work_date,
      payment_date: data.payment_date,
      amount_centavos: data.amount_centavos,
      payment_method: data.payment_method,
      note: data.note || 'Anrejistre dirèk pa trezorye',
      status: 'PENDING',
      created_by: admin.id,
      created_by_name: admin.full_name,
      created_at: now,
    };
    this.submissions.push(newSub);
    this.log({
      action: 'ADMIN_SUBMIT_CONTRIBUTION',
      entity_type: 'submission',
      entity_id: newSub.id,
      actor_id: admin.id,
      actor_name: admin.full_name,
      actor_role: 'admin',
      details: `Administratè ${admin.full_name} anrejistre kontribisyon an atant ${brl(data.amount_centavos)} pou ${driver.full_name} (Travay: ${data.work_date})`,
    });
    this.saveToStorage();
    // Do not notifyBalanceListeners() — balance changes only when approved!
    return { submission: { ...newSub } };
  }

  // --- PIX Settings ---
  public getPixSettings(): PixSettings {
    return { ...this.pixSettings };
  }

  public updatePixSettings(
    data: Partial<PixSettings>,
    adminId: string
  ): { success: boolean; settings?: PixSettings; error?: string } {
    const admin = this.getAdmin(adminId);
    if (!admin) {
      return { success: false, error: 'Aksyon sa a mande otorizasyon administratè.' };
    }
    this.pixSettings = {
      ...this.pixSettings,
      ...data,
      updated_at: new Date().toISOString(),
    };
    this.log({
      action: 'UPDATE_PIX_SETTINGS',
      entity_type: 'pix_settings',
      entity_id: '1',
      actor_id: admin.id,
      actor_name: admin.full_name,
      actor_role: 'admin',
      details: `Mete ajou konfigirasyon PIX (Kle: ${this.pixSettings.pix_key})`,
    });
    this.saveToStorage();
    return { success: true, settings: { ...this.pixSettings } };
  }

  // --- Public Donation Submissions ---
  public submitPublicDonation(data: {
    donor_name: string;
    donor_contact?: string;
    amount_cents: number;
    payment_date: string;
    receipt_storage_path: string;
    message?: string;
  }): { submission: PublicDonationSubmission | null; error?: string } {
    if (!data.donor_name || data.donor_name.trim().length < 2) {
      return { submission: null, error: 'Tanpri bay non konplè ou.' };
    }
    if (!data.amount_cents || data.amount_cents <= 0) {
      return { submission: null, error: 'Montan donasyon an dwe valab epi plis pase R$ 0,00.' };
    }
    if (!data.payment_date) {
      return { submission: null, error: 'Tanpri chwazi dat peman an.' };
    }
    if (!data.receipt_storage_path) {
      return { submission: null, error: 'Resi peman an obligatwa.' };
    }

    const now = new Date().toISOString();
    const newDonation: PublicDonationSubmission = {
      id: `don-${Date.now()}-${this.donationSubmissions.length}`,
      donor_name: data.donor_name.trim(),
      donor_contact: data.donor_contact?.trim(),
      amount_cents: data.amount_cents,
      amount_centavos: data.amount_cents,
      payment_date: data.payment_date,
      receipt_storage_path: data.receipt_storage_path,
      message: data.message?.trim(),
      status: 'pending',
      created_at: now,
      updated_at: now,
    };

    this.donationSubmissions.push(newDonation);
    this.saveToStorage();
    // CRITICAL: Uploading a receipt MUST NEVER automatically increase the global balance!
    return { submission: { ...newDonation } };
  }

  public getAllDonationSubmissions(): PublicDonationSubmission[] {
    return clone(this.donationSubmissions).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public getPendingDonationSubmissions(): PublicDonationSubmission[] {
    return this.donationSubmissions
      .filter((d) => d.status === 'pending' || d.status === 'PENDING')
      .map((d) => ({ ...d }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public approveDonationSubmission(
    donationId: string,
    adminId: string
  ): { success: boolean; error?: string } {
    const admin = this.getAdmin(adminId);
    if (!admin) {
      return { success: false, error: 'Aksyon sa a mande otorizasyon administratè oswa trezorye.' };
    }

    const donation = this.donationSubmissions.find((d) => d.id === donationId);
    if (!donation) {
      return { success: false, error: 'Donasyon sa a pa jwenn nan sistèm nan.' };
    }

    if (donation.status === 'approved' || donation.status === 'APPROVED') {
      return { success: true }; // Idempotent
    }

    if (donation.status !== 'pending' && donation.status !== 'PENDING') {
      return { success: false, error: 'Donasyon sa a pa nan eta An Atant ankò.' };
    }

    const now = new Date().toISOString();
    donation.status = 'approved';
    donation.reviewed_by = admin.id;
    donation.reviewed_at = now;
    donation.updated_at = now;

    this.log({
      action: 'APPROVE_DONATION',
      entity_type: 'donation_submission',
      entity_id: donation.id,
      actor_id: admin.id,
      actor_name: admin.full_name,
      actor_role: 'admin',
      details: `Apwouve donasyon piblik ${brl(donation.amount_cents)} de ${donation.donor_name}`,
    });

    this.saveToStorage();
    this.notifyBalanceListeners();
    return { success: true };
  }

  public rejectDonationSubmission(
    donationId: string,
    adminId: string,
    reason: string
  ): { success: boolean; error?: string } {
    const admin = this.getAdmin(adminId);
    if (!admin) {
      return { success: false, error: 'Aksyon sa a mande otorizasyon administratè oswa trezorye.' };
    }

    if (!reason || reason.trim().length < 5) {
      return { success: false, error: 'Tanpri bay yon rezon klè pou refi a (omwen 5 karaktè).' };
    }

    const donation = this.donationSubmissions.find((d) => d.id === donationId);
    if (!donation) {
      return { success: false, error: 'Donasyon sa a pa jwenn nan sistèm nan.' };
    }

    if (donation.status !== 'pending' && donation.status !== 'PENDING') {
      return { success: false, error: 'Donasyon sa a pa nan eta An Atant ankò.' };
    }

    const now = new Date().toISOString();
    donation.status = 'rejected';
    donation.rejection_reason = reason.trim();
    donation.reviewed_by = admin.id;
    donation.reviewed_at = now;
    donation.updated_at = now;

    this.log({
      action: 'REJECT_DONATION',
      entity_type: 'donation_submission',
      entity_id: donation.id,
      actor_id: admin.id,
      actor_name: admin.full_name,
      actor_role: 'admin',
      details: `Refize donasyon de ${donation.donor_name}. Rezon: ${reason.trim()}`,
    });

    this.saveToStorage();
    return { success: true };
  }
}

export const demoStorage = new DemoStorage();
