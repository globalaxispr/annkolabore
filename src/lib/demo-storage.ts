import {
  AuditLogEntry,
  ContributionSubmission,
  ExpenseRecord,
  FinancialSummary,
  ScheduledWithdrawal,
  UserProfile,
} from './types';
import {
  calculateFinancialSummary,
  DEFAULT_CONTRIBUTION_CENTAVOS,
  MINIMUM_CONTRIBUTION_CENTAVOS,
  validateContributionAmount,
} from './financial';

// Demo initial profiles
export const DEMO_PROFILES: UserProfile[] = [
  {
    id: 'usr-admin-01',
    email: 'trezorye@legliz.test',
    full_name: 'Frantz Augustin (Trezorye)',
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

// Initial demo contributions showing variable amounts (>= R$ 10,00)
export const DEMO_SUBMISSIONS: ContributionSubmission[] = [
  {
    id: 'sub-001',
    driver_id: 'usr-driver-01',
    driver_name: 'Jean Baptiste Pierre',
    work_date: '2026-10-10',
    payment_date: '2026-10-10',
    amount_centavos: 1000, // R$ 10,00
    payment_method: 'PIX',
    transaction_ref: 'PIX-98234-JB',
    status: 'APPROVED',
    reviewed_by: 'usr-admin-01',
    reviewed_by_name: 'Frantz Augustin (Trezorye)',
    reviewed_at: '2026-10-10T19:00:00Z',
    created_at: '2026-10-10T18:30:00Z',
  },
  {
    id: 'sub-002',
    driver_id: 'usr-driver-02',
    driver_name: 'Marc Antoine Désir',
    work_date: '2026-10-10',
    payment_date: '2026-10-10',
    amount_centavos: 2000, // R$ 20,00 (contribution exceeding minimum)
    payment_method: 'PIX',
    transaction_ref: 'PIX-11223-MD',
    note: 'Kontribisyon espesyal R$ 20 pou jounen an',
    status: 'APPROVED',
    reviewed_by: 'usr-admin-01',
    reviewed_by_name: 'Frantz Augustin (Trezorye)',
    reviewed_at: '2026-10-10T20:15:00Z',
    created_at: '2026-10-10T19:45:00Z',
  },
  {
    id: 'sub-003',
    driver_id: 'usr-driver-03',
    driver_name: 'Wilner Joseph',
    work_date: '2026-10-11',
    payment_date: '2026-10-11',
    amount_centavos: 1500, // R$ 15,00
    payment_method: 'Espès',
    note: 'Remèt nan men trezorye apre sèvis dimanch',
    status: 'APPROVED',
    reviewed_by: 'usr-admin-01',
    reviewed_by_name: 'Frantz Augustin (Trezorye)',
    reviewed_at: '2026-10-11T14:00:00Z',
    created_at: '2026-10-11T13:30:00Z',
  },
  {
    id: 'sub-004',
    driver_id: 'usr-driver-01',
    driver_name: 'Jean Baptiste Pierre',
    work_date: '2026-10-11',
    payment_date: '2026-10-11',
    amount_centavos: 1000, // R$ 10,00
    payment_method: 'PIX',
    transaction_ref: 'PIX-44321-JB',
    status: 'APPROVED',
    reviewed_by: 'usr-admin-01',
    reviewed_by_name: 'Frantz Augustin (Trezorye)',
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
    amount_centavos: 5000, // R$ 50,00
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
    reviewed_by_name: 'Frantz Augustin (Trezorye)',
    reviewed_at: '2026-10-09T18:00:00Z',
    created_at: '2026-10-09T17:00:00Z',
  },
];

// Initial demo withdrawals: historical outgoing transactions reconciled as withdrawals
export const DEMO_WITHDRAWALS: ScheduledWithdrawal[] = [
  {
    id: 'wth-001',
    description: 'Soutyen ofisyèl pou aktivite ak ministè legliz la',
    amount_centavos: 3000, // R$ 30,00
    scheduled_date: '2026-10-08',
    status: 'Egzekite',
    created_by: 'usr-admin-01',
    created_by_name: 'Frantz Augustin (Trezorye)',
    executed_by: 'usr-admin-01',
    executed_by_name: 'Frantz Augustin (Trezorye)',
    executed_at: '2026-10-08T16:00:00Z',
    note: 'Donasyon transfere bay kès santral legliz la',
    created_at: '2026-10-08T10:00:00Z',
  },
  {
    id: 'wth-002',
    description: 'Donasyon espesyal pou depans kominote legliz la',
    amount_centavos: 2000, // R$ 20,00
    scheduled_date: '2026-10-25',
    status: 'Pwograme',
    created_by: 'usr-admin-01',
    created_by_name: 'Frantz Augustin (Trezorye)',
    note: 'Prevwa pou remèt apre reyinyon jeneral la',
    created_at: '2026-10-12T10:00:00Z',
  },
];

// Initial audit logs
export const DEMO_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-001',
    action: 'APPROVE_CONTRIBUTION',
    entity_type: 'submission',
    entity_id: 'sub-001',
    actor_id: 'usr-admin-01',
    actor_name: 'Frantz Augustin (Trezorye)',
    actor_role: 'admin',
    details:
      'Apwouve kontribisyon R$ 10,00 pou Jean Baptiste Pierre (Travay: 10/10/2026)',
    created_at: '2026-10-10T19:00:00Z',
  },
  {
    id: 'aud-002',
    action: 'APPROVE_CONTRIBUTION',
    entity_type: 'submission',
    entity_id: 'sub-002',
    actor_id: 'usr-admin-01',
    actor_name: 'Frantz Augustin (Trezorye)',
    actor_role: 'admin',
    details:
      'Apwouve kontribisyon R$ 20,00 pou Marc Antoine Désir (Travay: 10/10/2026)',
    created_at: '2026-10-10T20:15:00Z',
  },
  {
    id: 'aud-003',
    action: 'EXECUTE_WITHDRAWAL',
    entity_type: 'withdrawal',
    entity_id: 'wth-001',
    actor_id: 'usr-admin-01',
    actor_name: 'Frantz Augustin (Trezorye)',
    actor_role: 'admin',
    details: 'Egzekite retrè R$ 30,00 pou soutyen ministè legliz la',
    created_at: '2026-10-08T16:00:00Z',
  },
  {
    id: 'aud-004',
    action: 'SCHEDULE_WITHDRAWAL',
    entity_type: 'withdrawal',
    entity_id: 'wth-002',
    actor_id: 'usr-admin-01',
    actor_name: 'Frantz Augustin (Trezorye)',
    actor_role: 'admin',
    details:
      'Pwograme retrè R$ 20,00 pou dat 25/10/2026 (Donasyon espesyal kominote)',
    created_at: '2026-10-12T10:00:00Z',
  },
];

const STORAGE_KEY_PROFILES = 'knt_profiles_v2';
const STORAGE_KEY_SUBMISSIONS = 'knt_submissions_v2';
const STORAGE_KEY_WITHDRAWALS = 'knt_withdrawals_v2';
const STORAGE_KEY_AUDIT = 'knt_audit_v2';
const STORAGE_KEY_CURRENT_USER = 'knt_current_user_v2';

class DemoStorage {
  private profiles: UserProfile[] = [...DEMO_PROFILES];
  private submissions: ContributionSubmission[] = [...DEMO_SUBMISSIONS];
  private withdrawals: ScheduledWithdrawal[] = [...DEMO_WITHDRAWALS];
  private auditLogs: AuditLogEntry[] = [...DEMO_AUDIT_LOGS];
  private currentUserId: string = 'usr-driver-01'; // Default demo user: Jean Baptiste Pierre

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

      const w = localStorage.getItem(STORAGE_KEY_WITHDRAWALS);
      if (w) this.withdrawals = JSON.parse(w);

      const a = localStorage.getItem(STORAGE_KEY_AUDIT);
      if (a) this.auditLogs = JSON.parse(a);

      const u = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (u) this.currentUserId = u;
    } catch {
      // Fallback to in-memory defaults
    }
  }

  private saveToStorage() {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(this.profiles));
      localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(this.submissions));
      localStorage.setItem(STORAGE_KEY_WITHDRAWALS, JSON.stringify(this.withdrawals));
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(this.auditLogs));
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, this.currentUserId);
    } catch {
      // Storage quota or error handling
    }
  }

  public resetDemoData() {
    this.profiles = [...DEMO_PROFILES];
    this.submissions = [...DEMO_SUBMISSIONS];
    this.withdrawals = [...DEMO_WITHDRAWALS];
    this.auditLogs = [...DEMO_AUDIT_LOGS];
    this.currentUserId = 'usr-driver-01';
    this.saveToStorage();
  }

  public getCurrentUser(): UserProfile | null {
    return this.profiles.find((p) => p.id === this.currentUserId) || this.profiles[1];
  }

  public setCurrentUser(userId: string): UserProfile | null {
    const user = this.profiles.find((p) => p.id === userId);
    if (user) {
      this.currentUserId = userId;
      this.saveToStorage();
      return user;
    }
    return null;
  }

  public getAllProfiles(): UserProfile[] {
    return [...this.profiles];
  }

  public registerUser(
    full_name: string,
    email: string
  ): { user: UserProfile; error?: string } {
    const exists = this.profiles.some(
      (p) => p.email.toLowerCase() === email.toLowerCase()
    );
    if (exists) {
      return {
        user: null as unknown as UserProfile,
        error: 'Adrès imèl sa a deja gen yon kont',
      };
    }
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      full_name,
      role: 'driver', // Always default to driver
      created_at: new Date().toISOString(),
    };
    this.profiles.push(newUser);
    this.currentUserId = newUser.id;
    this.saveToStorage();
    return { user: newUser };
  }

  public getFinancialSummary(): FinancialSummary {
    return calculateFinancialSummary(
      this.submissions,
      this.withdrawals,
      this.profiles.filter((p) => p.role === 'driver').length
    );
  }

  /**
   * Unified transaction history: only approved contributions and executed withdrawals
   */
  public getUnifiedTransactions(): {
    id: string;
    type: 'CONTRIBUTION' | 'WITHDRAWAL';
    title: string;
    description: string;
    amount_centavos: number;
    transaction_date: string;
    status: string;
    actor_name?: string;
  }[] {
    const approvedContributions = this.submissions
      .filter((s) => s.status === 'APPROVED')
      .map((s) => ({
        id: s.id,
        type: 'CONTRIBUTION' as const,
        title: s.driver_name,
        description: `Kontribisyon pou travay ${s.work_date}`,
        amount_centavos: s.amount_centavos,
        transaction_date: s.reviewed_at || s.created_at,
        status: 'Apwouve',
        actor_name: s.reviewed_by_name,
      }));

    const executedWithdrawals = this.withdrawals
      .filter((w) => w.status === 'Egzekite')
      .map((w) => ({
        id: w.id,
        type: 'WITHDRAWAL' as const,
        title: 'Retrè Fon',
        description: w.description,
        amount_centavos: w.amount_centavos,
        transaction_date: w.executed_at || w.created_at,
        status: 'Egzekite',
        actor_name: w.executed_by_name,
      }));

    return [...approvedContributions, ...executedWithdrawals].sort(
      (a, b) =>
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
    );
  }

  public getPublicTransactions() {
    return this.submissions
      .filter((s) => s.status === 'APPROVED')
      .sort(
        (a, b) =>
          new Date(b.reviewed_at || b.created_at).getTime() -
          new Date(a.reviewed_at || a.created_at).getTime()
      )
      .map((s) => ({
        id: s.id,
        driver_name: s.driver_name,
        amount_centavos: s.amount_centavos,
        work_date: s.work_date,
        payment_date: s.payment_date,
        approval_date: s.reviewed_at || s.created_at,
        status: s.status,
      }));
  }

  public getSubmissionsForDriver(driverId: string): ContributionSubmission[] {
    return this.submissions
      .filter((s) => s.driver_id === driverId)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }

  public getAllPendingSubmissions(): ContributionSubmission[] {
    return this.submissions
      .filter((s) => s.status === 'PENDING')
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }

  public getAllSubmissions(): ContributionSubmission[] {
    return [...this.submissions].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public getAllWithdrawals(): ScheduledWithdrawal[] {
    return [...this.withdrawals].sort(
      (a, b) =>
        new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()
    );
  }

  public getScheduledWithdrawals(): ScheduledWithdrawal[] {
    return this.withdrawals
      .filter((w) => w.status === 'Pwograme' || w.status === 'An Atant')
      .sort(
        (a, b) =>
          new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
      );
  }

  public getAllAuditLogs(): AuditLogEntry[] {
    return [...this.auditLogs].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

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
    if (!driver) {
      return { submission: null, error: 'Chofè sa a pa egziste nan sistèm nan' };
    }

    // Validation: minimum R$ 10,00 (1000 centavos)
    const val = validateContributionAmount(data.amount_centavos);
    if (!val.valid) {
      return { submission: null, error: val.error };
    }

    // Check duplicate work date
    const duplicate = this.submissions.find(
      (s) =>
        s.driver_id === data.driver_id &&
        s.work_date === data.work_date &&
        s.status !== 'REJECTED'
    );
    if (duplicate) {
      return {
        submission: null,
        error: `Ou te deja soumèt yon kontribisyon pou dat travay sa a (${data.work_date}). Si gen yon erè, kontakte trezorye a.`,
      };
    }

    const newSub: ContributionSubmission = {
      id: `sub-${Date.now()}`,
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

    this.auditLogs.push({
      id: `aud-${Date.now()}`,
      action: 'SUBMIT_CONTRIBUTION',
      entity_type: 'submission',
      entity_id: newSub.id,
      actor_id: driver.id,
      actor_name: driver.full_name,
      actor_role: driver.role,
      details: `Soumèt kontribisyon ${(data.amount_centavos / 100).toFixed(2)} BRL pou travay ${data.work_date}`,
      created_at: new Date().toISOString(),
    });

    this.saveToStorage();
    return { submission: newSub };
  }

  public approveSubmission(
    submissionId: string,
    adminId: string
  ): { success: boolean; error?: string } {
    const admin = this.profiles.find((p) => p.id === adminId);
    if (!admin || admin.role !== 'admin') {
      return {
        success: false,
        error: 'Aksyon sa a mande otorizasyon administratè oswa trezorye.',
      };
    }

    const sub = this.submissions.find((s) => s.id === submissionId);
    if (!sub) {
      return { success: false, error: 'Kontribisyon sa a pa jwenn nan sistèm nan.' };
    }

    // Must be PENDING to approve
    if (sub.status !== 'PENDING') {
      return {
        success: false,
        error: `Kontribisyon sa a pa nan eta 'An Atant' ankò (Eta aktyèl: ${sub.status}).`,
      };
    }

    // Perform atomic approval
    sub.status = 'APPROVED';
    sub.reviewed_by = admin.id;
    sub.reviewed_by_name = admin.full_name;
    sub.reviewed_at = new Date().toISOString();
    sub.updated_at = new Date().toISOString();

    // Log to audit
    this.auditLogs.push({
      id: `aud-${Date.now()}`,
      action: 'APPROVE_CONTRIBUTION',
      entity_type: 'submission',
      entity_id: sub.id,
      actor_id: admin.id,
      actor_name: admin.full_name,
      actor_role: 'admin',
      details: `Apwouve kontribisyon R$ ${(sub.amount_centavos / 100).toFixed(2)} pou chofè ${sub.driver_name} (Travay: ${sub.work_date})`,
      created_at: new Date().toISOString(),
    });

    this.saveToStorage();
    return { success: true };
  }

  public rejectSubmission(
    submissionId: string,
    adminId: string,
    rejectionReason: string
  ): { success: boolean; error?: string } {
    const admin = this.profiles.find((p) => p.id === adminId);
    if (!admin || admin.role !== 'admin') {
      return {
        success: false,
        error: 'Aksyon sa a mande otorizasyon administratè oswa trezorye.',
      };
    }

    if (!rejectionReason || rejectionReason.trim().length < 5) {
      return {
        success: false,
        error: 'Tanpri bay yon rezon klè pou refi a (omwen 5 karaktè).',
      };
    }

    const sub = this.submissions.find((s) => s.id === submissionId);
    if (!sub) {
      return { success: false, error: 'Kontribisyon sa a pa jwenn nan sistèm nan.' };
    }

    if (sub.status !== 'PENDING') {
      return {
        success: false,
        error: `Kontribisyon sa a pa nan eta 'An Atant' ankò (Eta aktyèl: ${sub.status}).`,
      };
    }

    sub.status = 'REJECTED';
    sub.rejection_reason = rejectionReason.trim();
    sub.reviewed_by = admin.id;
    sub.reviewed_by_name = admin.full_name;
    sub.reviewed_at = new Date().toISOString();
    sub.updated_at = new Date().toISOString();

    this.auditLogs.push({
      id: `aud-${Date.now()}`,
      action: 'REJECT_CONTRIBUTION',
      entity_type: 'submission',
      entity_id: sub.id,
      actor_id: admin.id,
      actor_name: admin.full_name,
      actor_role: 'admin',
      details: `Refize kontribisyon ${sub.driver_name}. Rezon: ${rejectionReason}`,
      created_at: new Date().toISOString(),
    });

    this.saveToStorage();
    return { success: true };
  }

  public recordDirectContribution(data: {
    admin_id: string;
    driver_id: string;
    work_date: string;
    payment_date: string;
    amount_centavos: number;
    payment_method: 'PIX' | 'Espès' | 'Transfè' | 'Lòt';
    note?: string;
  }): { submission: ContributionSubmission | null; error?: string } {
    const admin = this.profiles.find((p) => p.id === data.admin_id);
    if (!admin || admin.role !== 'admin') {
      return { submission: null, error: 'Aksyon sa a mande otorizasyon administratè.' };
    }

    const val = validateContributionAmount(data.amount_centavos);
    if (!val.valid) {
      return { submission: null, error: val.error };
    }

    const driver = this.profiles.find((p) => p.id === data.driver_id);
    if (!driver) {
      return { submission: null, error: 'Chofè a pa jwenn.' };
    }

    const newSub: ContributionSubmission = {
      id: `sub-${Date.now()}`,
      driver_id: driver.id,
      driver_name: driver.full_name,
      work_date: data.work_date,
      payment_date: data.payment_date,
      amount_centavos: data.amount_centavos,
      payment_method: data.payment_method,
      note: data.note || 'Anrejistre dirèk pa trezorye',
      status: 'APPROVED',
      reviewed_by: admin.id,
      reviewed_by_name: admin.full_name,
      reviewed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    this.submissions.push(newSub);

    this.auditLogs.push({
      id: `aud-${Date.now()}`,
      action: 'DIRECT_CONTRIBUTION',
      entity_type: 'submission',
      entity_id: newSub.id,
      actor_id: admin.id,
      actor_name: admin.full_name,
      actor_role: 'admin',
      details: `Anrejistre kontribisyon dirèk R$ ${(data.amount_centavos / 100).toFixed(2)} pou ${driver.full_name}`,
      created_at: new Date().toISOString(),
    });

    this.saveToStorage();
    return { submission: newSub };
  }

  // --- SCHEDULED WITHDRAWAL WORKFLOW ---

  /**
   * Step 1: Schedule an upcoming withdrawal (does NOT reduce official balance)
   */
  public scheduleWithdrawal(data: {
    admin_id: string;
    description: string;
    amount_centavos: number;
    scheduled_date: string;
    scheduled_time?: string;
    note?: string;
  }): { withdrawal: ScheduledWithdrawal | null; error?: string } {
    const admin = this.profiles.find((p) => p.id === data.admin_id);
    if (!admin || admin.role !== 'admin') {
      return {
        withdrawal: null,
        error: 'Aksyon sa a mande otorizasyon administratè oswa trezorye.',
      };
    }

    if (!data.amount_centavos || data.amount_centavos <= 0) {
      return { withdrawal: null, error: 'Montan retrè a dwe plis pase R$ 0,00.' };
    }

    if (!data.description || data.description.trim().length < 3) {
      return {
        withdrawal: null,
        error: 'Deskripsyon retrè a dwe gen omwen 3 karaktè.',
      };
    }

    const newWth: ScheduledWithdrawal = {
      id: `wth-${Date.now()}`,
      description: data.description.trim(),
      amount_centavos: data.amount_centavos,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      status: 'Pwograme',
      created_by: admin.id,
      created_by_name: admin.full_name,
      note: data.note,
      created_at: new Date().toISOString(),
    };

    this.withdrawals.push(newWth);

    this.auditLogs.push({
      id: `aud-${Date.now()}`,
      action: 'SCHEDULE_WITHDRAWAL',
      entity_type: 'withdrawal',
      entity_id: newWth.id,
      actor_id: admin.id,
      actor_name: admin.full_name,
      actor_role: 'admin',
      details: `Pwograme retrè R$ ${(data.amount_centavos / 100).toFixed(2)} pou dat ${data.scheduled_date}: ${data.description}`,
      created_at: new Date().toISOString(),
    });

    this.saveToStorage();
    return { withdrawal: newWth };
  }

  /**
   * Step 5: Execute a scheduled withdrawal (explicit confirmation reduces official balance exactly once)
   */
  public executeWithdrawal(
    withdrawalId: string,
    adminId: string
  ): { success: boolean; error?: string } {
    const admin = this.profiles.find((p) => p.id === adminId);
    if (!admin || admin.role !== 'admin') {
      return {
        success: false,
        error: 'Aksyon sa a mande otorizasyon administratè oswa trezorye.',
      };
    }

    const wth = this.withdrawals.find((w) => w.id === withdrawalId);
    if (!wth) {
      return { success: false, error: 'Retrè pwograme sa a pa jwenn nan sistèm nan.' };
    }

    if (wth.status === 'Egzekite') {
      return {
        success: false,
        error: 'Retrè sa a te deja egzekite. Li pa ka egzekite de fwa.',
      };
    }

    if (wth.status === 'Anile') {
      return {
        success: false,
        error: 'Retrè sa a te anile deja. Ou pa ka egzekite yon retrè ki anile.',
      };
    }

    // Execute withdrawal
    wth.status = 'Egzekite';
    wth.executed_by = admin.id;
    wth.executed_by_name = admin.full_name;
    wth.executed_at = new Date().toISOString();
    wth.updated_at = new Date().toISOString();

    this.auditLogs.push({
      id: `aud-${Date.now()}`,
      action: 'EXECUTE_WITHDRAWAL',
      entity_type: 'withdrawal',
      entity_id: wth.id,
      actor_id: admin.id,
      actor_name: admin.full_name,
      actor_role: 'admin',
      details: `Egzekite retrè R$ ${(wth.amount_centavos / 100).toFixed(2)}: ${wth.description}`,
      created_at: new Date().toISOString(),
    });

    this.saveToStorage();
    return { success: true };
  }

  /**
   * Step 6: Cancel a scheduled withdrawal before execution (does not change official balance)
   */
  public cancelWithdrawal(
    withdrawalId: string,
    adminId: string,
    reason: string
  ): { success: boolean; error?: string } {
    const admin = this.profiles.find((p) => p.id === adminId);
    if (!admin || admin.role !== 'admin') {
      return {
        success: false,
        error: 'Aksyon sa a mande otorizasyon administratè oswa trezorye.',
      };
    }

    const wth = this.withdrawals.find((w) => w.id === withdrawalId);
    if (!wth) {
      return { success: false, error: 'Retrè pwograme sa a pa jwenn nan sistèm nan.' };
    }

    if (wth.status === 'Egzekite') {
      return {
        success: false,
        error: 'Yon retrè ki deja egzekite pa ka anile konsa. Li mande yon koreksyon odite.',
      };
    }

    if (wth.status === 'Anile') {
      return { success: false, error: 'Retrè sa a te deja anile.' };
    }

    if (!reason || reason.trim().length < 5) {
      return {
        success: false,
        error: 'Tanpri bay yon rezon klè pou anilasyon an (omwen 5 karaktè).',
      };
    }

    wth.status = 'Anile';
    wth.cancelled_by = admin.id;
    wth.cancelled_by_name = admin.full_name;
    wth.cancelled_at = new Date().toISOString();
    wth.cancellation_reason = reason.trim();
    wth.updated_at = new Date().toISOString();

    this.auditLogs.push({
      id: `aud-${Date.now()}`,
      action: 'CANCEL_WITHDRAWAL',
      entity_type: 'withdrawal',
      entity_id: wth.id,
      actor_id: admin.id,
      actor_name: admin.full_name,
      actor_role: 'admin',
      details: `Anile retrè R$ ${(wth.amount_centavos / 100).toFixed(2)} (${wth.description}). Rezon: ${reason.trim()}`,
      created_at: new Date().toISOString(),
    });

    this.saveToStorage();
    return { success: true };
  }

  /**
   * Legacy method maintained for backward compatibility migration
   */
  public recordExpense(data: {
    admin_id: string;
    amount_centavos: number;
    expense_date: string;
    description: string;
    category: string;
    reference_note?: string;
  }): { expense: ExpenseRecord | null; error?: string } {
    // Automatically route through withdrawal system as executed withdrawal
    const res = this.scheduleWithdrawal({
      admin_id: data.admin_id,
      description: data.description,
      amount_centavos: data.amount_centavos,
      scheduled_date: data.expense_date,
      note: data.reference_note,
    });

    if (res.error || !res.withdrawal) {
      return { expense: null, error: res.error };
    }

    this.executeWithdrawal(res.withdrawal.id, data.admin_id);

    return {
      expense: {
        id: res.withdrawal.id,
        amount_centavos: data.amount_centavos,
        expense_date: data.expense_date,
        description: data.description,
        category: data.category,
        authorized_by: data.admin_id,
        authorized_by_name: 'Admin',
        created_at: new Date().toISOString(),
      },
    };
  }

  public getAllExpenses(): ExpenseRecord[] {
    return this.withdrawals
      .filter((w) => w.status === 'Egzekite')
      .map((w) => ({
        id: w.id,
        amount_centavos: w.amount_centavos,
        expense_date: w.scheduled_date,
        description: w.description,
        category: 'Retrè',
        authorized_by: w.executed_by || w.created_by,
        authorized_by_name: w.executed_by_name || w.created_by_name,
        created_at: w.created_at,
      }));
  }
}

export const demoStorage = new DemoStorage();
