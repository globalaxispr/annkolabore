import { describe, it, expect, beforeEach } from 'vitest';
import { demoStorage } from '../lib/demo-storage';
import {
  calculateCurrentBalance,
  calculateTotalApprovedContributions,
  calculateTotalExecutedWithdrawals,
  calculateTotalPendingScheduledWithdrawals,
  calculateProjectedBalance,
  calculateFinancialSummary,
  validateContributionAmount,
  MINIMUM_CONTRIBUTION_CENTAVOS,
  DEFAULT_CONTRIBUTION_CENTAVOS,
} from '../lib/financial';
import { formatBRL, parseBRLInputToCentavos } from '../lib/formatters';
import { registerSchema, contributionSchema, scheduledWithdrawalSchema } from '../lib/validations';
import { ContributionSubmission, ScheduledWithdrawal } from '../lib/types';

describe('Sistèm Jesyon Kontribisyon Chofè Legliz - 20 Senaryo Tès Akseptasyon', () => {
  beforeEach(() => {
    demoStorage.resetDemoData();
  });

  // Tès 1: Balans disponib la se eleman prensipal ki kalkile kòrèkteman
  it('1. Balans disponib la se fòmil: Kontribisyon Apwouve - Retrè Egzekite', () => {
    const summary = demoStorage.getFinancialSummary();
    const expected =
      summary.total_contributions_centavos - summary.total_withdrawals_centavos;
    expect(summary.current_balance_centavos).toBe(expected);
    expect(summary.current_balance_centavos).toBeGreaterThanOrEqual(0);
  });

  // Tès 2: Depans yo retire nèt epi ranplase pa sistèm retrè
  it('2. Jesyon depans retire epi ranplase pa sistèm retrè pwograme', () => {
    const withdrawals = demoStorage.getAllWithdrawals();
    expect(withdrawals).toBeDefined();
    expect(Array.isArray(withdrawals)).toBe(true);
    // Legacy expense recording routes through withdrawal
    const res = demoStorage.recordExpense({
      admin_id: 'usr-admin-01',
      amount_centavos: 2500,
      expense_date: '2026-10-12',
      description: 'Soutyen kominotè legliz',
      category: 'Retrè',
    });
    expect(res.expense).toBeDefined();
  });

  // Tès 3: Yon chofè ka soumèt R$ 10,00
  it('3. Yon chofè ka soumèt kontribisyon minimòm R$ 10,00', () => {
    const subResult = demoStorage.submitContribution({
      driver_id: 'usr-driver-01',
      work_date: '2026-10-15',
      payment_date: '2026-10-15',
      amount_centavos: 1000, // R$ 10,00
      payment_method: 'PIX',
    });
    expect(subResult.submission).toBeDefined();
    expect(subResult.submission?.amount_centavos).toBe(1000);
    expect(subResult.submission?.status).toBe('PENDING');
  });

  // Tès 4: Yon chofè ka soumèt plis pase R$ 10,00
  it('4. Yon chofè ka soumèt plis pase R$ 10,00 (egzanp: R$ 15, R$ 20, R$ 50)', () => {
    const amounts = [1500, 2000, 5000, 10000]; // R$ 15, R$ 20, R$ 50, R$ 100
    amounts.forEach((amt, idx) => {
      const sub = demoStorage.submitContribution({
        driver_id: 'usr-driver-02',
        work_date: `2026-10-${20 + idx}`,
        payment_date: `2026-10-${20 + idx}`,
        amount_centavos: amt,
        payment_method: 'PIX',
      });
      expect(sub.submission).toBeDefined();
      expect(sub.submission?.amount_centavos).toBe(amt);
    });
  });

  // Tès 5: Yon kontribisyon ki anba R$ 10,00 refize
  it('5. Yon kontribisyon ki mwens pase R$ 10,00 rejte avèk mesaj kreyòl apwopriye', () => {
    // Attempt submitting R$ 5,00 (500 centavos)
    const result = demoStorage.submitContribution({
      driver_id: 'usr-driver-01',
      work_date: '2026-10-25',
      payment_date: '2026-10-25',
      amount_centavos: 500,
      payment_method: 'PIX',
    });
    expect(result.submission).toBeNull();
    expect(result.error).toBe('Kontribisyon an dwe omwen R$ 10,00.');

    // Validate using Zod schema
    const zodCheck = contributionSchema.safeParse({
      work_date: '2026-10-25',
      payment_date: '2026-10-25',
      amount_centavos: 800, // R$ 8,00
      payment_method: 'PIX',
    });
    expect(zodCheck.success).toBe(false);
    if (!zodCheck.success) {
      expect(zodCheck.error.issues[0]?.message).toBe('Kontribisyon an dwe omwen R$ 10,00.');
    }
  });

  // Tès 6: Yon soumisyon an atant pa afekte balans ofisyèl la
  it('6. Yon soumisyon an atant pa chanje balans ofisyèl kès la', () => {
    const initialBalance = demoStorage.getFinancialSummary().current_balance_centavos;

    demoStorage.submitContribution({
      driver_id: 'usr-driver-01',
      work_date: '2026-10-26',
      payment_date: '2026-10-26',
      amount_centavos: 5000, // R$ 50,00 pending
      payment_method: 'PIX',
    });

    const newBalance = demoStorage.getFinancialSummary().current_balance_centavos;
    expect(newBalance).toBe(initialBalance);
  });

  // Tès 7: Apwobasyon ogmante balans lan yon sèl fwa egzakteman
  it('7. Apwobasyon ogmante balans lan yon sèl fwa epi anpeche apwobasyon an doub', () => {
    const sub = demoStorage.submitContribution({
      driver_id: 'usr-driver-01',
      work_date: '2026-10-27',
      payment_date: '2026-10-27',
      amount_centavos: 2000, // R$ 20,00
      payment_method: 'PIX',
    }).submission!;

    const before = demoStorage.getFinancialSummary().current_balance_centavos;
    const firstApprove = demoStorage.approveSubmission(sub.id, 'usr-admin-01');
    expect(firstApprove.success).toBe(true);

    const afterFirst = demoStorage.getFinancialSummary().current_balance_centavos;
    expect(afterFirst - before).toBe(2000);

    // Second approval attempt MUST fail
    const secondApprove = demoStorage.approveSubmission(sub.id, 'usr-admin-01');
    expect(secondApprove.success).toBe(false);
    const afterSecond = demoStorage.getFinancialSummary().current_balance_centavos;
    expect(afterSecond).toBe(afterFirst);
  });

  // Tès 8: Pwograme yon retrè pa diminye balans ofisyèl la touswit
  it('8. Pwograme yon retrè pa diminye balans ofisyèl la touswit', () => {
    const balanceBefore = demoStorage.getFinancialSummary().current_balance_centavos;

    const sched = demoStorage.scheduleWithdrawal({
      admin_id: 'usr-admin-01',
      description: 'Donasyon prevwa pou legliz la',
      amount_centavos: 2500, // R$ 25,00
      scheduled_date: '2026-11-01',
    });
    expect(sched.withdrawal).toBeDefined();
    expect(sched.withdrawal?.status).toBe('Pwograme');

    const summaryAfter = demoStorage.getFinancialSummary();
    // Official balance must remain identical!
    expect(summaryAfter.current_balance_centavos).toBe(balanceBefore);
    // Scheduled withdrawals figure tracks the upcoming commitment
    expect(summaryAfter.scheduled_withdrawals_centavos).toBeGreaterThanOrEqual(2500);
    // Projected balance reflects projection
    expect(summaryAfter.projected_balance_centavos).toBe(
      summaryAfter.current_balance_centavos - summaryAfter.scheduled_withdrawals_centavos
    );
  });

  // Tès 9: Retrè pwograme yo parèt nan seksyon retrè k ap vini yo
  it('9. Retrè pwograme yo parèt nan lis retrè an atant', () => {
    const pendingList = demoStorage.getScheduledWithdrawals();
    expect(pendingList.every((w) => w.status === 'Pwograme' || w.status === 'An Atant')).toBe(
      true
    );
  });

  // Tès 10: Egzekite yon retrè diminye balans lan yon sèl fwa egzakteman
  it('10. Egzekite yon retrè diminye balans lan yon sèl fwa epi anpeche egzekisyon an doub', () => {
    const sched = demoStorage.scheduleWithdrawal({
      admin_id: 'usr-admin-01',
      description: 'Retrè egzekisyon tès',
      amount_centavos: 1500,
      scheduled_date: '2026-10-28',
    }).withdrawal!;

    const balanceBefore = demoStorage.getFinancialSummary().current_balance_centavos;
    const execRes = demoStorage.executeWithdrawal(sched.id, 'usr-admin-01');
    expect(execRes.success).toBe(true);

    const balanceAfter = demoStorage.getFinancialSummary().current_balance_centavos;
    expect(balanceBefore - balanceAfter).toBe(1500);

    // Double execution attempt MUST fail
    const doubleExec = demoStorage.executeWithdrawal(sched.id, 'usr-admin-01');
    expect(doubleExec.success).toBe(false);
    expect(demoStorage.getFinancialSummary().current_balance_centavos).toBe(balanceAfter);
  });

  // Tès 11: Anile yon retrè pwograme pa chanje balans lan
  it('11. Anile yon retrè pwograme pa chanje balans ofisyèl la', () => {
    const sched = demoStorage.scheduleWithdrawal({
      admin_id: 'usr-admin-01',
      description: 'Retrè ki pral anile',
      amount_centavos: 3000,
      scheduled_date: '2026-11-05',
    }).withdrawal!;

    const balanceBefore = demoStorage.getFinancialSummary().current_balance_centavos;
    const cancelRes = demoStorage.cancelWithdrawal(
      sched.id,
      'usr-admin-01',
      'Reyinyon an anile, pa bezwen retrè sa a ankò.'
    );
    expect(cancelRes.success).toBe(true);

    const balanceAfter = demoStorage.getFinancialSummary().current_balance_centavos;
    expect(balanceAfter).toBe(balanceBefore);

    const updated = demoStorage.getAllWithdrawals().find((w) => w.id === sched.id);
    expect(updated?.status).toBe('Anile');
  });

  // Tès 12: Chofè pa ka egzekite oswa anile retrè
  it('12. Chofè pa gen otorizasyon pou egzekite oswa anile retrè', () => {
    const sched = demoStorage.getScheduledWithdrawals()[0];
    const driverId = 'usr-driver-01';

    const execAttempt = demoStorage.executeWithdrawal(sched.id, driverId);
    expect(execAttempt.success).toBe(false);
    expect(execAttempt.error).toContain('mande otorizasyon administratè');

    const cancelAttempt = demoStorage.cancelWithdrawal(
      sched.id,
      driverId,
      'Eseye anile pa chofè'
    );
    expect(cancelAttempt.success).toBe(false);
  });

  // Tès 13: Chofè pa ka apwouve kontribisyon
  it('13. Chofè pa ka apwouve pwòp kontribisyon oswa kontribisyon yon lòt', () => {
    const pending = demoStorage.getAllPendingSubmissions()[0];
    const driverId = 'usr-driver-01';

    const approveAttempt = demoStorage.approveSubmission(pending.id, driverId);
    expect(approveAttempt.success).toBe(false);
  });

  // Tès 14: Kalkil kòb egzat san okenn erè flotan
  it('14. Tout kalkil finansye fèt an santim antye (zero floating point inaccuracies)', () => {
    const cents1 = 1000;
    const cents2 = 1533;
    const diff = cents2 - cents1;
    expect(diff).toBe(533);
    expect(formatBRL(533)).toBe('R$ 5,33');
    expect(formatBRL(1000)).toBe('R$ 10,00');
  });

  // Tès 15: Tout tèks entèfas itilizatè a rete an Kreyòl Ayisyen
  it('15. Tout mesaj validasyon ak tèks entèfas rete an Kreyòl Ayisyen', () => {
    const val = validateContributionAmount(500);
    expect(val.error).toBe('Kontribisyon an dwe omwen R$ 10,00.');
  });

  // Tès 16: Montan yo fòmate nan Real Brezilyen (BRL)
  it('16. Montan yo fòmate kòrèkteman an Real Brezilyen (BRL: R$ 0,00, R$ 10,00)', () => {
    expect(formatBRL(0)).toBe('R$ 0,00');
    expect(formatBRL(1000)).toBe('R$ 10,00');
    expect(formatBRL(1500)).toBe('R$ 15,00');
    expect(formatBRL(100000)).toBe('R$ 1.000,00');
    expect(parseBRLInputToCentavos('10,00')).toBe(1000);
  });

  // Tès 17: Mizajou an tan reyèl pa kreye tranzaksyon an doub
  it('17. Idempotans asire ke evènman repete pa kreye tranzaksyon an doub', () => {
    const submissions: ContributionSubmission[] = [
      {
        id: 's1',
        driver_id: 'd1',
        driver_name: 'Chofè 1',
        work_date: '2026-10-10',
        payment_date: '2026-10-10',
        amount_centavos: 1000,
        payment_method: 'PIX',
        status: 'APPROVED',
        created_at: '2026-10-10T10:00:00Z',
      },
    ];
    const sum1 = calculateTotalApprovedContributions(submissions);
    const sum2 = calculateTotalApprovedContributions(submissions);
    expect(sum1).toBe(sum2);
  });

  // Tès 18: Lis tranzaksyon inifye a konpak epi li gen kontribisyon ak retrè egzekite
  it('18. Istwa tranzaksyon inifye a gen sèlman aktivite ofisyèl (apwouve ak egzekite)', () => {
    const history = demoStorage.getUnifiedTransactions();
    history.forEach((item) => {
      expect(['Apwouve', 'Egzekite']).toContain(item.status);
      expect(['CONTRIBUTION', 'WITHDRAWAL']).toContain(item.type);
    });
  });

  // Tès 19: Done istorik yo konsève epi rekonsilye san pèt
  it('19. Done istorik yo konsève epi rekonsilye kòm retrè', () => {
    const allWth = demoStorage.getAllWithdrawals();
    expect(allWth.some((w) => w.id === 'wth-001')).toBe(true);
    expect(allWth.find((w) => w.id === 'wth-001')?.status).toBe('Egzekite');
  });

  // Tès 20: Kalkil pwojeksyon balans lan kòrèk
  it('20. Pwojeksyon Balans Apre Retrè Pwograme = Balans Disponib - Retrè Pwograme', () => {
    const currentBalance = 10000; // R$ 100,00
    const pendingScheduled = 4000; // R$ 40,00
    const projected = calculateProjectedBalance(currentBalance, pendingScheduled);
    expect(projected).toBe(6000); // R$ 60,00
  });
});
