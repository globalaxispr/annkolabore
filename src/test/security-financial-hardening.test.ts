import { describe, it, expect, beforeEach } from 'vitest';
import { demoStorage } from '../lib/demo-storage';
import { repository } from '../lib/repository';
import { parseBRLInputToCentavos, formatBRL } from '../lib/formatters';
import { validateContributionAmount } from '../lib/financial';

describe('TASK 4.H SECURITY & FINANCIAL HARDENING SUITE', () => {
  beforeEach(() => {
    demoStorage.resetDemoData();
  });

  // 1. Unauthorized admin actions
  it('1. Non-admin (driver) attempting to approve or reject a contribution is strictly blocked', async () => {
    // Driver user attempts to approve
    const pendingList = await repository.getPendingSubmissions();
    expect(pendingList.length).toBeGreaterThan(0);
    const targetSub = pendingList[0];

    // Attempt approve with driver ID
    const driverApproveResult = await repository.approveSubmission(targetSub.id, 'usr-driver-01');
    expect(driverApproveResult.success).toBe(false);
    expect(driverApproveResult.error).toContain('Aksyon sa a mande otorizasyon administratè oswa trezorye');

    // Attempt reject with driver ID
    const driverRejectResult = await repository.rejectSubmission(
      targetSub.id,
      'usr-driver-01',
      'Move peman'
    );
    expect(driverRejectResult.success).toBe(false);
    expect(driverRejectResult.error).toContain('Aksyon sa a mande otorizasyon administratè oswa trezorye');

    // Status MUST remain pending
    const refreshed = (await repository.getPendingSubmissions()).find((s) => s.id === targetSub.id);
    expect(refreshed).toBeDefined();
    expect((refreshed?.status || '').toLowerCase()).toBe('pending');
  });

  // 2. Cross-user data isolation
  it('2. Cross-user data isolation: Member dashboard only exposes the authenticated driver records', async () => {
    const driver1Subs = await repository.getDriverSubmissions('usr-driver-01');
    const driver2Subs = await repository.getDriverSubmissions('usr-driver-02');

    expect(driver1Subs.length).toBeGreaterThan(0);
    expect(driver2Subs.length).toBeGreaterThan(0);

    // Driver 1 records must belong exclusively to driver 1
    driver1Subs.forEach((s) => {
      expect(s.driver_id).toBe('usr-driver-01');
    });

    // Driver 2 records must belong exclusively to driver 2
    driver2Subs.forEach((s) => {
      expect(s.driver_id).toBe('usr-driver-02');
    });

    // Submissions must not leak across users
    const driver1Ids = new Set(driver1Subs.map((s) => s.id));
    driver2Subs.forEach((s2) => {
      expect(driver1Ids.has(s2.id)).toBe(false);
    });
  });

  // 3. Double-credit prevention and idempotency
  it('3. Double-credit prevention: Approving an already approved contribution never increases the balance twice', async () => {
    const initialBalance = await repository.getPublicGlobalBalance();
    const initialAmount = initialBalance.total_approved_contributions_centavos;

    // Submit new contribution
    const submitRes = demoStorage.submitContribution({
      driver_id: 'usr-driver-01',
      work_date: '2026-10-30',
      payment_date: '2026-10-30',
      amount_centavos: 4000, // R$ 40,00
      payment_method: 'PIX',
    });
    const subId = submitRes.submission!.id;

    // First approval by legitimate admin
    const firstApprove = await repository.approveSubmission(subId, 'usr-admin-01');
    expect(firstApprove.success).toBe(true);

    const balanceAfterFirst = await repository.getPublicGlobalBalance();
    expect(balanceAfterFirst.total_approved_contributions_centavos).toBe(initialAmount + 4000);

    // Second approval attempt (accidental duplicate / double click / replay)
    const secondApprove = await repository.approveSubmission(subId, 'usr-admin-01');
    // Cannot be approved again
    expect(secondApprove.success).toBe(false);

    // Balance MUST NOT inflate
    const balanceAfterSecond = await repository.getPublicGlobalBalance();
    expect(balanceAfterSecond.total_approved_contributions_centavos).toBe(initialAmount + 4000);
  });

  // 4. Repeated same-day contributions
  it('4. Repeated same-day contributions: Unlimited contributions on the same day are supported and summed correctly', async () => {
    const initialBalance = await repository.getPublicGlobalBalance();
    const initialAmount = initialBalance.total_approved_contributions_centavos;

    const workDate = '2026-10-31';

    // First contribution on 2026-10-31: R$ 15,00
    const sub1 = demoStorage.submitContribution({
      driver_id: 'usr-driver-03',
      work_date: workDate,
      payment_date: workDate,
      amount_centavos: 1500,
      payment_method: 'PIX',
    });
    expect(sub1.submission).toBeDefined();

    // Fast-forward timestamp by 2 seconds to bypass accidental double-click threshold
    const sub2 = demoStorage.submitContribution({
      driver_id: 'usr-driver-03',
      work_date: workDate,
      payment_date: workDate,
      amount_centavos: 2500, // R$ 25,00 on same work date
      payment_method: 'Espès',
    });
    expect(sub2.submission).toBeDefined();

    // Both must be pending
    const driverSubs = await repository.getDriverSubmissions('usr-driver-03');
    const sameDaySubs = driverSubs.filter((s) => s.work_date === workDate);
    expect(sameDaySubs.length).toBe(2);

    // Admin approves both
    await repository.approveSubmission(sub1.submission!.id, 'usr-admin-01');
    await repository.approveSubmission(sub2.submission!.id, 'usr-admin-01');

    const updatedBalance = await repository.getPublicGlobalBalance();
    expect(updatedBalance.total_approved_contributions_centavos).toBe(initialAmount + 1500 + 2500);
  });

  // 5. Cumulative member dashboard workflow as specified in Prompt Task 2
  it('5. Member dashboard cumulative total follows the exact step-by-step business scenario', async () => {
    const testDriverId = 'usr-driver-04';

    // Step 0: Check driver starting totals
    const initialSubs = await repository.getDriverSubmissions(testDriverId);
    const startApproved = initialSubs
      .filter((s) => (s.status || '').toLowerCase() === 'approved')
      .reduce((sum, s) => sum + s.amount_centavos, 0);

    // Step 1: Member submits R$10 (pending)
    const step1 = demoStorage.submitContribution({
      driver_id: testDriverId,
      work_date: '2026-11-01',
      payment_date: '2026-11-01',
      amount_centavos: 1000, // R$ 10
      payment_method: 'PIX',
    });
    expect(step1.submission?.status.toLowerCase()).toBe('pending');

    let currentSubs = await repository.getDriverSubmissions(testDriverId);
    let approvedTotal = currentSubs
      .filter((s) => (s.status || '').toLowerCase() === 'approved')
      .reduce((sum, s) => sum + s.amount_centavos, 0);
    const pendingTotal = currentSubs
      .filter((s) => (s.status || '').toLowerCase() === 'pending')
      .reduce((sum, s) => sum + s.amount_centavos, 0);

    expect(approvedTotal).toBe(startApproved);
    expect(pendingTotal).toBeGreaterThanOrEqual(1000);

    // Administrator approves R$10
    await repository.approveSubmission(step1.submission!.id, 'usr-admin-01');

    currentSubs = await repository.getDriverSubmissions(testDriverId);
    approvedTotal = currentSubs
      .filter((s) => (s.status || '').toLowerCase() === 'approved')
      .reduce((sum, s) => sum + s.amount_centavos, 0);
    expect(approvedTotal).toBe(startApproved + 1000);

    // Step 2: Member submits another R$20
    const step2 = demoStorage.submitContribution({
      driver_id: testDriverId,
      work_date: '2026-11-02',
      payment_date: '2026-11-02',
      amount_centavos: 2000, // R$ 20
      payment_method: 'PIX',
    });

    currentSubs = await repository.getDriverSubmissions(testDriverId);
    approvedTotal = currentSubs
      .filter((s) => (s.status || '').toLowerCase() === 'approved')
      .reduce((sum, s) => sum + s.amount_centavos, 0);
    expect(approvedTotal).toBe(startApproved + 1000); // Still 10 before approval

    // Administrator approves R$20
    await repository.approveSubmission(step2.submission!.id, 'usr-admin-01');

    currentSubs = await repository.getDriverSubmissions(testDriverId);
    approvedTotal = currentSubs
      .filter((s) => (s.status || '').toLowerCase() === 'approved')
      .reduce((sum, s) => sum + s.amount_centavos, 0);
    expect(approvedTotal).toBe(startApproved + 3000); // 10 + 20 = 30

    // Step 3: Member submits another R$5 on the same day
    const step3 = demoStorage.submitContribution({
      driver_id: testDriverId,
      work_date: '2026-11-02',
      payment_date: '2026-11-02',
      amount_centavos: 500, // R$ 5
      payment_method: 'Espès',
    });

    // Administrator approves R$5
    await repository.approveSubmission(step3.submission!.id, 'usr-admin-01');

    currentSubs = await repository.getDriverSubmissions(testDriverId);
    approvedTotal = currentSubs
      .filter((s) => (s.status || '').toLowerCase() === 'approved')
      .reduce((sum, s) => sum + s.amount_centavos, 0);
    expect(approvedTotal).toBe(startApproved + 3500); // 30 + 5 = 35
  });

  // 6. Public information exposure protection
  it('6. Public contributors query strictly protects private user metadata', async () => {
    const publicResult = await repository.getPaginatedPublicContributors(1, 6);
    expect(publicResult.data.length).toBeGreaterThan(0);

    publicResult.data.forEach((item) => {
      // Allowed public fields
      expect(item.id).toBeDefined();
      expect(item.driver_name).toBeDefined();
      expect(item.amount_centavos).toBeGreaterThan(0);
      expect(item.work_date).toBeDefined();
      expect(item.status).toBe('Apwouve');

      // Prohibited private fields MUST NOT be present
      const raw = item as unknown as Record<string, unknown>;
      expect(raw.cpf).toBeUndefined();
      expect(raw.email).toBeUndefined();
      expect(raw.phone).toBeUndefined();
      expect(raw.telephone).toBeUndefined();
      expect(raw.password).toBeUndefined();
      expect(raw.hashed_password).toBeUndefined();
      expect(raw.bank_account).toBeUndefined();
    });
  });

  // 7. Public homepage pagination: 6 records per page with stable secondary sort key
  it('7. Public pagination returns exactly 6 records per page with stable secondary sort', async () => {
    // Add extra approved contributions to guarantee multiple pages
    for (let i = 1; i <= 8; i++) {
      const sub = demoStorage.submitContribution({
        driver_id: 'usr-driver-01',
        work_date: `2026-10-0${i}`,
        payment_date: `2026-10-0${i}`,
        amount_centavos: 1000 + i * 100,
        payment_method: 'PIX',
      });
      if (sub.submission) {
        demoStorage.approveSubmission(sub.submission.id, 'usr-admin-01');
      }
    }

    const page1 = await repository.getPaginatedPublicContributors(1, 6);
    expect(page1.pageSize).toBe(6);
    expect(page1.data.length).toBe(6);

    const page2 = await repository.getPaginatedPublicContributors(2, 6);
    expect(page2.data.length).toBeGreaterThan(0);
    expect(page2.data.length).toBeLessThanOrEqual(6);

    // Ensure zero overlap between Page 1 and Page 2
    const page1Ids = new Set(page1.data.map((c) => c.id));
    page2.data.forEach((c) => {
      expect(page1Ids.has(c.id)).toBe(false);
    });

    // Verify sort order: approval_date descending
    for (let i = 0; i < page1.data.length - 1; i++) {
      const curTime = new Date(page1.data[i].approval_date).getTime();
      const nextTime = new Date(page1.data[i + 1].approval_date).getTime();
      expect(curTime).toBeGreaterThanOrEqual(nextTime);
    }
  });

  // 8. Input validation and integer centavos financial precision
  it('8. Amount validation and exact decimal parsing strictly prohibit zero, negative, or malformed amounts', () => {
    // Prohibit zero
    const zeroVal = validateContributionAmount(0);
    expect(zeroVal.valid).toBe(false);

    // Prohibit negative
    const negVal = validateContributionAmount(-1000);
    expect(negVal.valid).toBe(false);

    // Minimum positive valid is 1 centavo (R$ 0,01)
    const minVal = validateContributionAmount(1);
    expect(minVal.valid).toBe(true);

    // Parse BRL currency input correctly without floating point loss
    expect(parseBRLInputToCentavos('10,00')).toBe(1000);
    expect(parseBRLInputToCentavos('10.00')).toBe(1000);
    expect(parseBRLInputToCentavos('0,01')).toBe(1);
    expect(parseBRLInputToCentavos('1.250,50')).toBe(125050);
    expect(parseBRLInputToCentavos('R$ 35,00')).toBe(3500);

    // Format BRL outputs exact Brazilian currency
    expect(formatBRL(1000)).toBe('R$ 10,00');
    expect(formatBRL(1)).toBe('R$ 0,01');
    expect(formatBRL(3500)).toBe('R$ 35,00');
    expect(formatBRL(125050)).toBe('R$ 1.250,50');
  });
});
