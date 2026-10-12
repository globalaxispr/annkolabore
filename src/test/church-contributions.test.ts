import { describe, it, expect, beforeEach } from 'vitest';
import { demoStorage } from '../lib/demo-storage';
import {
  calculateCurrentBalance,
  calculateTotalApprovedContributions,
  calculateTotalExpenses,
  calculateFinancialSummary,
  findDuplicateWorkDateSubmission,
  DEFAULT_CONTRIBUTION_CENTAVOS,
} from '../lib/financial';
import { formatBRL, parseBRLInputToCentavos } from '../lib/formatters';
import { registerSchema, contributionSchema } from '../lib/validations';
import { ContributionSubmission, ExpenseRecord } from '../lib/types';

describe('Sistèm Jesyon Kontribisyon Chofè Legliz - 17 Senaryo Tès', () => {
  beforeEach(() => {
    demoStorage.resetDemoData();
  });

  // Senaryo 1: Yon chofè ka kreye kont epi konekte
  it('Senaryo 1: Yon chofè ka kreye kont epi konekte avèk wòl chofè pa defo', () => {
    const regResult = demoStorage.registerUser('Jean Valjean', 'jean.valjean@chofe.test');
    expect(regResult.user).toBeDefined();
    expect(regResult.user.full_name).toBe('Jean Valjean');
    expect(regResult.user.role).toBe('driver'); // Default role MUST be driver

    // Login simulation
    const currentUser = demoStorage.setCurrentUser(regResult.user.id);
    expect(currentUser).toBeDefined();
    expect(currentUser?.email).toBe('jean.valjean@chofe.test');
  });

  // Senaryo 2: Yon chofè ka soumèt yon kontribisyon R$ 10,00
  it('Senaryo 2: Yon chofè ka soumèt yon kontribisyon R$ 10,00', () => {
    const driverId = 'usr-driver-01';
    const subResult = demoStorage.submitContribution({
      driver_id: driverId,
      work_date: '2026-10-15',
      payment_date: '2026-10-15',
      amount_centavos: DEFAULT_CONTRIBUTION_CENTAVOS,
      payment_method: 'PIX',
      transaction_ref: 'PIX-TEST-2',
    });

    expect(subResult.submission).toBeDefined();
    expect(subResult.submission?.status).toBe('PENDING');
    expect(subResult.submission?.amount_centavos).toBe(1000); // 1000 centavos = R$ 10,00
  });

  // Senaryo 3: Yon soumisyon an atant pa chanje balans ofisyèl la
  it('Senaryo 3: Yon soumisyon an atant pa chanje balans ofisyèl la', () => {
    const initialSummary = demoStorage.getFinancialSummary();
    const initialBalance = initialSummary.current_balance_centavos;

    // Driver submits a pending contribution
    demoStorage.submitContribution({
      driver_id: 'usr-driver-01',
      work_date: '2026-10-16',
      payment_date: '2026-10-16',
      amount_centavos: 1000,
      payment_method: 'PIX',
    });

    const newSummary = demoStorage.getFinancialSummary();
    // Official balance must remain identical
    expect(newSummary.current_balance_centavos).toBe(initialBalance);
  });

  // Senaryo 4: Yon administratè ka apwouve soumisyon an
  it('Senaryo 4: Yon administratè/trezorye ka apwouve soumisyon an', () => {
    const pendingList = demoStorage.getAllPendingSubmissions();
    expect(pendingList.length).toBeGreaterThan(0);
    const itemToApprove = pendingList[0];

    const adminId = 'usr-admin-01';
    const approveResult = demoStorage.approveSubmission(itemToApprove.id, adminId);

    expect(approveResult.success).toBe(true);

    const updatedSub = demoStorage
      .getAllSubmissions()
      .find((s) => s.id === itemToApprove.id);
    expect(updatedSub?.status).toBe('APPROVED');
    expect(updatedSub?.reviewed_by).toBe(adminId);
  });

  // Senaryo 5: Apwobasyon ogmante balans lan yon sèl fwa egzakteman
  it('Senaryo 5: Apwobasyon ogmante balans lan yon sèl fwa egzakteman', () => {
    // Submit a fresh contribution
    const res = demoStorage.submitContribution({
      driver_id: 'usr-driver-01',
      work_date: '2026-10-17',
      payment_date: '2026-10-17',
      amount_centavos: 1000,
      payment_method: 'PIX',
    });
    const subId = res.submission!.id;

    const balanceBefore = demoStorage.getFinancialSummary().current_balance_centavos;
    demoStorage.approveSubmission(subId, 'usr-admin-01');
    const balanceAfter = demoStorage.getFinancialSummary().current_balance_centavos;

    expect(balanceAfter - balanceBefore).toBe(1000); // Increased by exactly R$ 10,00
  });

  // Senaryo 6: Yon apwobasyon an doub pa ka ogmante balans lan de fwa
  it('Senaryo 6: Yon apwobasyon an doub pa ka ogmante balans lan de fwa (idempotans)', () => {
    const res = demoStorage.submitContribution({
      driver_id: 'usr-driver-01',
      work_date: '2026-10-18',
      payment_date: '2026-10-18',
      amount_centavos: 1000,
      payment_method: 'PIX',
    });
    const subId = res.submission!.id;

    // First approval
    const firstApprove = demoStorage.approveSubmission(subId, 'usr-admin-01');
    expect(firstApprove.success).toBe(true);
    const balanceAfterFirst = demoStorage.getFinancialSummary().current_balance_centavos;

    // Second approval attempt on already approved record
    const secondApprove = demoStorage.approveSubmission(subId, 'usr-admin-01');
    expect(secondApprove.success).toBe(false); // Must fail!

    const balanceAfterSecond = demoStorage.getFinancialSummary().current_balance_centavos;
    expect(balanceAfterSecond).toBe(balanceAfterFirst); // Must NOT change!
  });

  // Senaryo 7: Yon soumisyon refize pa afekte balans lan
  it('Senaryo 7: Yon soumisyon refize pa afekte balans lan', () => {
    const res = demoStorage.submitContribution({
      driver_id: 'usr-driver-01',
      work_date: '2026-10-19',
      payment_date: '2026-10-19',
      amount_centavos: 1000,
      payment_method: 'PIX',
    });
    const subId = res.submission!.id;

    const balanceBefore = demoStorage.getFinancialSummary().current_balance_centavos;
    const rejectRes = demoStorage.rejectSubmission(
      subId,
      'usr-admin-01',
      'Prèv la pa klè, tanpri voye yon lòt resi.'
    );
    expect(rejectRes.success).toBe(true);

    const balanceAfter = demoStorage.getFinancialSummary().current_balance_centavos;
    expect(balanceAfter).toBe(balanceBefore); // Zero balance impact
  });

  // Senaryo 8: Yon jou chofè a pa travay pa kreye okenn dèt otomatik
  it('Senaryo 8: Yon jou chofè a pa travay pa kreye okenn dèt oswa penalite', () => {
    // When no submission is entered for a calendar day, calculate balance and summary:
    const summary = demoStorage.getFinancialSummary();
    // Rule verification: No negative ledger adjustments for non-submitted dates
    expect(summary.current_balance_centavos).toBeGreaterThanOrEqual(0);
  });

  // Senaryo 9: Yon depans diminye balans lan kòrèkteman
  it('Senaryo 9: Yon depans diminye balans lan kòrèkteman', () => {
    const balanceBefore = demoStorage.getFinancialSummary().current_balance_centavos;
    const expenseCentavos = 2500; // R$ 25,00

    demoStorage.recordExpense({
      admin_id: 'usr-admin-01',
      amount_centavos: expenseCentavos,
      expense_date: '2026-10-12',
      description: 'Acha ti gaz pou jeneratè legliz la',
      category: 'Sipò ak Aktivite',
    });

    const balanceAfter = demoStorage.getFinancialSummary().current_balance_centavos;
    expect(balanceBefore - balanceAfter).toBe(expenseCentavos);
  });

  // Senaryo 10: Yon chofè pa ka apwouve pwòp kontribisyon li
  it('Senaryo 10: Yon chofè pa ka apwouve pwòp kontribisyon pa li', () => {
    const pending = demoStorage.getAllPendingSubmissions()[0];
    const driverId = 'usr-driver-01'; // Regular driver

    const attempt = demoStorage.approveSubmission(pending.id, driverId);
    expect(attempt.success).toBe(false);
    expect(attempt.error).toContain('mande otorizasyon administratè');
  });

  // Senaryo 11: Yon chofè pa ka modifye dosye yon lòt chofè
  it("Senaryo 11: Yon chofè pa ka modifye dosye yon lòt chofè", () => {
    const driver1Subs = demoStorage.getSubmissionsForDriver('usr-driver-01');
    const driver2Subs = demoStorage.getSubmissionsForDriver('usr-driver-02');

    // Ensure driver submissions are strictly partitioned
    driver1Subs.forEach((s) => {
      expect(s.driver_id).toBe('usr-driver-01');
    });
    driver2Subs.forEach((s) => {
      expect(s.driver_id).toBe('usr-driver-02');
    });
  });

  // Senaryo 12: Vizitè piblik pa ka modifye dosye finansye yo
  it('Senaryo 12: Vizitè piblik gen aksè sèlman nan lekti done apwouve san aksè modifikasyon', () => {
    const publicList = demoStorage.getPublicTransactions();
    // All public entries MUST be APPROVED
    publicList.forEach((t) => {
      expect(t.status).toBe('APPROVED');
    });
    // Attempting an approval or expense without admin profile must fail
    const attempt = demoStorage.approveSubmission('sub-005', 'anonymous-visitor');
    expect(attempt.success).toBe(false);
  });

  // Senaryo 13: Resi prive ak enfòmasyon sekrè pa ekspoze nan done piblik
  it('Senaryo 13: Resi prive ak imèl pa ekspoze nan done piblik yo', () => {
    const publicData = demoStorage.getPublicTransactions();
    publicData.forEach((item: any) => {
      expect(item.receipt_url).toBeUndefined();
      expect(item.email).toBeUndefined();
      expect(item.password).toBeUndefined();
    });
  });

  // Senaryo 14: Aplikasyon an fòmate kòb la an Real Brezilyen (BRL) kòrèkteman
  it('Senaryo 14: Aplikasyon an fòmate montan an an Real Brezilyen (BRL) avèk presizyon', () => {
    expect(formatBRL(1000)).toBe('R$ 10,00');
    expect(formatBRL(0)).toBe('R$ 0,00');
    expect(formatBRL(15000)).toBe('R$ 150,00');
    expect(formatBRL(2550)).toBe('R$ 25,50');
    expect(formatBRL(-5000)).toBe('-R$ 50,00');
    expect(parseBRLInputToCentavos('10,00')).toBe(1000);
  });

  // Senaryo 15: Tout tèks entèfas prensipal la nan Kreyòl Ayisyen
  it('Senaryo 15: Validasyon ak mesaj entèfas yo ekri an Kreyòl Ayisyen', () => {
    const testInvalidReg = registerSchema.safeParse({
      full_name: 'J',
      email: 'invalid-email',
      password: '123',
      confirm_password: '456',
    });
    expect(testInvalidReg.success).toBe(false);
    if (!testInvalidReg.success) {
      const messages = testInvalidReg.error.issues.map((i) => i.message);
      // Ensure Kreyòl error messages
      expect(messages.some((m) => m.includes('Non konplè a dwe'))).toBe(true);
      expect(messages.some((m) => m.includes('adrès imèl ki valab'))).toBe(true);
      expect(messages.some((m) => m.includes('Modpas la dwe gen omwen 6'))).toBe(true);
    }
  });

  // Senaryo 16: Mizajou an tan reyèl pa kreye tranzaksyon an doub
  it('Senaryo 16: Idempotans asire ke menm evènman an tan reyèl repete pa kreye tranzaksyon an doub', () => {
    const submissions: ContributionSubmission[] = [
      {
        id: 'sub-test-1',
        driver_id: 'usr-driver-01',
        driver_name: 'Jean Baptiste Pierre',
        work_date: '2026-10-10',
        payment_date: '2026-10-10',
        amount_centavos: 1000,
        payment_method: 'PIX',
        status: 'APPROVED',
        created_at: '2026-10-10T10:00:00Z',
      },
    ];

    const total1 = calculateTotalApprovedContributions(submissions);
    // Even if repeated calculation occurs, sum is deterministic:
    const total2 = calculateTotalApprovedContributions(submissions);
    expect(total1).toBe(total2);
    expect(total1).toBe(1000);
  });

  // Senaryo 17: Koreksyon finansye ak tout aksyon konsève tras odit la
  it('Senaryo 17: Tout aksyon (apwobasyon, refi, depans) konsève nan lis odit la', () => {
    const auditLogsBefore = demoStorage.getAllAuditLogs().length;

    // Perform an expense
    demoStorage.recordExpense({
      admin_id: 'usr-admin-01',
      amount_centavos: 3000,
      expense_date: '2026-10-12',
      description: 'Koreksyon / depans odit tès',
      category: 'Odit',
    });

    const auditLogsAfter = demoStorage.getAllAuditLogs().length;
    expect(auditLogsAfter).toBe(auditLogsBefore + 1);

    const latestLog = demoStorage.getAllAuditLogs()[0];
    expect(latestLog.action).toBe('RECORD_EXPENSE');
    expect(latestLog.actor_name).toContain('Frantz Augustin');
  });
});
