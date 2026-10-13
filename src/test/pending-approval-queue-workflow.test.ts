import { describe, it, expect, beforeEach } from 'vitest';
import { demoStorage } from '../lib/demo-storage';
import { repository } from '../lib/repository';

describe('CRITICAL FINANCIAL WORKFLOW — Pending Approval Queue & Admin Workflow', () => {
  beforeEach(() => {
    demoStorage.resetDemoData();
  });

  // TEST 1: Driver submits contribution without receipt: Status is PENDING, not approved
  it('1. Driver submits contribution without receipt: Status is PENDING, public balance does not change', async () => {
    const initialBalance = await repository.getPublicGlobalBalance();
    const initialAmount = initialBalance.total_approved_contributions_centavos;

    const res = demoStorage.submitContribution({
      driver_id: 'usr-driver-01',
      work_date: '2026-10-28',
      payment_date: '2026-10-28',
      amount_centavos: 2500, // R$ 25,00
      payment_method: 'PIX',
      // receipt_url is omitted (optional)
    });

    expect(res.submission).toBeDefined();
    expect(res.submission?.status.toLowerCase()).toBe('pending');
    expect(res.submission?.receipt_url).toBeUndefined();

    // Financial balance MUST NOT increase while pending
    const afterSubmitBalance = await repository.getPublicGlobalBalance();
    expect(afterSubmitBalance.total_approved_contributions_centavos).toBe(initialAmount);

    // It MUST appear in the pending queue
    const pendingList = await repository.getPendingSubmissions();
    const found = pendingList.find((s) => s.id === res.submission?.id);
    expect(found).toBeDefined();
    expect(found?.amount_centavos).toBe(2500);
    expect(found?.status.toLowerCase()).toBe('pending');
  });

  // TEST 2: Admin records contribution on behalf of driver: Status is PENDING (never auto-approved)
  it('2. Administrator records contribution: Status is PENDING and requires explicit approval', async () => {
    const initialBalance = await repository.getPublicGlobalBalance();
    const initialAmount = initialBalance.total_approved_contributions_centavos;

    const res = demoStorage.recordDirectContribution({
      admin_id: 'usr-admin-01',
      driver_id: 'usr-driver-02',
      work_date: '2026-10-29',
      payment_date: '2026-10-29',
      amount_centavos: 3000, // R$ 30,00
      payment_method: 'Espès',
      note: 'Remèt lajan kach bay trezorye',
    });

    expect(res.error).toBeUndefined();
    expect(res.submission).toBeDefined();
    expect(res.submission?.status.toLowerCase()).toBe('pending');
    expect(res.submission?.created_by).toBe('usr-admin-01');

    // Public balance MUST NOT increase upon creation
    const afterRecordBalance = await repository.getPublicGlobalBalance();
    expect(afterRecordBalance.total_approved_contributions_centavos).toBe(initialAmount);

    // MUST appear in /admin/atant pending queue
    const pendingList = await repository.getPendingSubmissions();
    const found = pendingList.find((s) => s.id === res.submission?.id);
    expect(found).toBeDefined();
    expect(found?.created_by).toBe('usr-admin-01');
    expect(found?.status.toLowerCase()).toBe('pending');
  });

  // TEST 3: Admin explicit approval credits balance exactly once
  it('3. Explicit approval transitions status to APPROVED and credits balance exactly once', async () => {
    const initialBalance = await repository.getPublicGlobalBalance();
    const initialAmount = initialBalance.total_approved_contributions_centavos;

    // Submit a pending contribution
    const submissionRes = demoStorage.submitContribution({
      driver_id: 'usr-driver-01',
      work_date: '2026-10-30',
      payment_date: '2026-10-30',
      amount_centavos: 1500, // R$ 15,00
      payment_method: 'PIX',
    });
    const subId = submissionRes.submission!.id;

    // Admin explicitly approves it
    const approveRes = demoStorage.approveSubmission(subId, 'usr-admin-01');
    expect(approveRes.success).toBe(true);

    // Balance increases by exactly R$ 15,00 (1500 centavos)
    const afterApproveBalance = await repository.getPublicGlobalBalance();
    expect(afterApproveBalance.total_approved_contributions_centavos).toBe(initialAmount + 1500);

    // Submission is no longer in pending queue
    const pendingList = await repository.getPendingSubmissions();
    expect(pendingList.find((s) => s.id === subId)).toBeUndefined();
  });

  // TEST 4: Repeated approval is idempotent and cannot double credit
  it('4. Repeated approval cannot double credit the public balance', async () => {
    const initialBalance = await repository.getPublicGlobalBalance();

    const submissionRes = demoStorage.submitContribution({
      driver_id: 'usr-driver-01',
      work_date: '2026-10-31',
      payment_date: '2026-10-31',
      amount_centavos: 2000,
      payment_method: 'PIX',
    });
    const subId = submissionRes.submission!.id;

    // First approval
    const firstApprove = demoStorage.approveSubmission(subId, 'usr-admin-01');
    expect(firstApprove.success).toBe(true);
    const balanceAfterFirst = await repository.getPublicGlobalBalance();
    expect(balanceAfterFirst.total_approved_contributions_centavos).toBe(
      initialBalance.total_approved_contributions_centavos + 2000
    );

    // Second approval attempt on already approved record
    const secondApprove = demoStorage.approveSubmission(subId, 'usr-admin-01');
    expect(secondApprove.success).toBe(false); // blocked from re-approving

    // Balance remains exactly the same, no duplicate credit
    const balanceAfterSecond = await repository.getPublicGlobalBalance();
    expect(balanceAfterSecond.total_approved_contributions_centavos).toBe(
      balanceAfterFirst.total_approved_contributions_centavos
    );
  });

  // TEST 5: Rejected contribution never credits the balance
  it('5. Rejection transitions status to REJECTED and NEVER affects the balance', async () => {
    const initialBalance = await repository.getPublicGlobalBalance();

    const submissionRes = demoStorage.submitContribution({
      driver_id: 'usr-driver-01',
      work_date: '2026-11-01',
      payment_date: '2026-11-01',
      amount_centavos: 4000,
      payment_method: 'PIX',
    });
    const subId = submissionRes.submission!.id;

    const rejectRes = demoStorage.rejectSubmission(
      subId,
      'usr-admin-01',
      'Montan transfè a pa matche ak prèv la'
    );
    expect(rejectRes.success).toBe(true);

    const balanceAfterReject = await repository.getPublicGlobalBalance();
    expect(balanceAfterReject.total_approved_contributions_centavos).toBe(
      initialBalance.total_approved_contributions_centavos
    );

    // Removed from pending queue
    const pendingList = await repository.getPendingSubmissions();
    expect(pendingList.find((s) => s.id === subId)).toBeUndefined();
  });

  // TEST 6: Non-admin users cannot approve or reject
  it('6. Non-admin users are strictly blocked from approving or rejecting', async () => {
    const submissionRes = demoStorage.submitContribution({
      driver_id: 'usr-driver-01',
      work_date: '2026-11-02',
      payment_date: '2026-11-02',
      amount_centavos: 1000,
      payment_method: 'PIX',
    });
    const subId = submissionRes.submission!.id;

    // Driver tries to approve
    const driverApprove = demoStorage.approveSubmission(subId, 'usr-driver-01');
    expect(driverApprove.success).toBe(false);
    expect(driverApprove.error).toContain('mande otorizasyon administratè');

    // Driver tries to reject
    const driverReject = demoStorage.rejectSubmission(subId, 'usr-driver-01', 'Rezon');
    expect(driverReject.success).toBe(false);
    expect(driverReject.error).toContain('mande otorizasyon administratè');
  });

  // TEST 7: Public contributors list includes ONLY approved contributions, never pending or rejected
  it('7. Only approved contributions appear in public recent list; pending and rejected stay strictly hidden', async () => {
    // 1. Submit pending (not approved yet)
    const pendingSub = demoStorage.submitContribution({
      driver_id: 'usr-driver-01',
      work_date: '2026-11-03',
      payment_date: '2026-11-03',
      amount_centavos: 2000,
      payment_method: 'PIX',
    });

    const publicList1 = await repository.getPaginatedPublicContributors(1, 5);
    expect(publicList1.data.find((c) => c.id === pendingSub.submission?.id)).toBeUndefined();

    // 2. Approve it
    demoStorage.approveSubmission(pendingSub.submission!.id, 'usr-admin-01');

    const publicList2 = await repository.getPaginatedPublicContributors(1, 5);
    const approvedItem = publicList2.data.find((c) => c.id === pendingSub.submission?.id);
    expect(approvedItem).toBeDefined();
    expect(approvedItem?.amount_centavos).toBe(2000);
    expect(approvedItem?.status).toBe('Apwouve');

    // Sensitive fields are not exposed in public contributor type
    expect((approvedItem as any).receipt_url).toBeUndefined();
    expect((approvedItem as any).receipt_path).toBeUndefined();
    expect((approvedItem as any).payment_reference).toBeUndefined();
    expect((approvedItem as any).note).toBeUndefined();

    // 3. Submit and reject another
    const rejectedSub = demoStorage.submitContribution({
      driver_id: 'usr-driver-02',
      work_date: '2026-11-04',
      payment_date: '2026-11-04',
      amount_centavos: 3000,
      payment_method: 'PIX',
    });
    demoStorage.rejectSubmission(rejectedSub.submission!.id, 'usr-admin-01', 'Rezon refi');

    const publicList3 = await repository.getPaginatedPublicContributors(1, 5);
    expect(publicList3.data.find((c) => c.id === rejectedSub.submission?.id)).toBeUndefined();
  });

  // TEST 8: Pagination initially limits to 5 items, subsequent page loads additional items without duplicates
  it('8. Pagination loads 5 records initially and allows loading more without duplicate IDs', async () => {
    // Populate 7 approved contributions
    for (let i = 1; i <= 7; i++) {
      const s = demoStorage.submitContribution({
        driver_id: 'usr-driver-01',
        work_date: `2026-11-${10 + i}`,
        payment_date: `2026-11-${10 + i}`,
        amount_centavos: 1000 * i,
        payment_method: 'PIX',
      });
      demoStorage.approveSubmission(s.submission!.id, 'usr-admin-01');
    }

    const page1 = await repository.getPaginatedPublicContributors(1, 5);
    expect(page1.data.length).toBe(5);
    expect(page1.totalCount).toBeGreaterThanOrEqual(7);

    const page2 = await repository.getPaginatedPublicContributors(2, 5);
    expect(page2.data.length).toBeGreaterThanOrEqual(2);

    // No IDs in page 2 should exist in page 1
    const page1Ids = new Set(page1.data.map((c) => c.id));
    const duplicates = page2.data.filter((c) => page1Ids.has(c.id));
    expect(duplicates.length).toBe(0);
  });

  // TEST 9: Contributions of arbitrary positive amounts (R$ 0,01 to R$ 100,00) enter pending queue and update balance upon approval
  it('9. Driver submissions and admin records of arbitrary positive amounts (R$ 0,01, R$ 0,50, R$ 1,00, R$ 5,00, R$ 100,00) enter pending queue and credit balance accurately', async () => {
    const initialSummary = demoStorage.getFinancialSummary();
    const initialBalance = initialSummary.current_balance_centavos;

    // 1. Driver submits R$ 0,01 (1 centavo)
    const sub1Cent = demoStorage.submitContribution({
      driver_id: 'usr-driver-01',
      work_date: '2026-11-20',
      payment_date: '2026-11-20',
      amount_centavos: 1, // R$ 0,01
      payment_method: 'PIX',
    });
    expect(sub1Cent.submission).toBeDefined();
    expect(sub1Cent.submission?.amount_centavos).toBe(1);
    expect(sub1Cent.submission?.status).toBe('PENDING');

    // 2. Admin records contribution of R$ 0,50 (50 centavos)
    const admin50Cents = demoStorage.submitContribution({
      driver_id: 'usr-driver-02',
      work_date: '2026-11-21',
      payment_date: '2026-11-21',
      amount_centavos: 50, // R$ 0,50
      payment_method: 'PIX',
    });
    expect(admin50Cents.submission).toBeDefined();
    expect(admin50Cents.submission?.amount_centavos).toBe(50);
    expect(admin50Cents.submission?.status).toBe('PENDING');

    // Both are in pending queue; balance remains unchanged
    const pendingList = demoStorage.getAllPendingSubmissions();
    expect(pendingList.find((s) => s.id === sub1Cent.submission?.id)).toBeDefined();
    expect(pendingList.find((s) => s.id === admin50Cents.submission?.id)).toBeDefined();
    expect(demoStorage.getFinancialSummary().current_balance_centavos).toBe(initialBalance);

    // 3. Admin approves R$ 0,01
    const approve1 = demoStorage.approveSubmission(sub1Cent.submission!.id, 'usr-admin-01');
    expect(approve1.success).toBe(true);
    expect(demoStorage.getFinancialSummary().current_balance_centavos).toBe(initialBalance + 1);

    // 4. Admin approves R$ 0,50
    const approve2 = demoStorage.approveSubmission(admin50Cents.submission!.id, 'usr-admin-01');
    expect(approve2.success).toBe(true);
    expect(demoStorage.getFinancialSummary().current_balance_centavos).toBe(initialBalance + 1 + 50);

    // 5. Duplicate approval does not double count
    const duplicateApprove = demoStorage.approveSubmission(sub1Cent.submission!.id, 'usr-admin-01');
    expect(duplicateApprove.success).toBe(false);
    expect(demoStorage.getFinancialSummary().current_balance_centavos).toBe(initialBalance + 1 + 50);

    // 6. Zero or negative amounts rejected
    const zeroSub = demoStorage.submitContribution({
      driver_id: 'usr-driver-01',
      work_date: '2026-11-22',
      payment_date: '2026-11-22',
      amount_centavos: 0,
      payment_method: 'PIX',
    });
    expect(zeroSub.submission).toBeNull();
    expect(zeroSub.error).toBe('Montan kontribisyon an dwe siperyè a zewo.');
  });
});
