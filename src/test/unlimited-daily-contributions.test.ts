import { describe, it, expect, beforeEach } from 'vitest';
import { demoStorage } from '../lib/demo-storage';
import { repository } from '../lib/repository';

describe('CHOFÈ LEGLIZ — UNLIMITED CONTRIBUTIONS PER DAY SUITE', () => {
  beforeEach(() => {
    demoStorage.resetDemoData();
  });

  it('allows a driver to submit multiple contributions (R$1.00, R$2.00, R$5.00) on the same day, verifies pending queue, approval balance (+R$8.00), and history', async () => {
    const driverId = 'usr-driver-01';
    const sameWorkDate = '2026-10-15';
    const initialBalance = (await repository.getPublicGlobalBalance()).total_approved_contributions_centavos;

    // 1. Driver submits R$ 1.00 (100 centavos)
    const sub1 = demoStorage.submitContribution({
      driver_id: driverId,
      work_date: sameWorkDate,
      payment_date: sameWorkDate,
      amount_centavos: 100,
      payment_method: 'PIX',
      note: 'Premye kontribisyon maten (09:00)',
    });
    expect(sub1.error).toBeUndefined();
    expect(sub1.submission).toBeTruthy();
    expect(sub1.submission?.id).toBeTruthy();
    expect(sub1.submission?.status).toBe('PENDING');

    // 2. The same driver submits R$ 2.00 (200 centavos) on the same day
    const sub2 = demoStorage.submitContribution({
      driver_id: driverId,
      work_date: sameWorkDate,
      payment_date: sameWorkDate,
      amount_centavos: 200,
      payment_method: 'Espès',
      note: 'Dezyèm kontribisyon apremidi (13:00)',
    });
    expect(sub2.error).toBeUndefined();
    expect(sub2.submission).toBeTruthy();
    expect(sub2.submission?.id).toBeTruthy();
    expect(sub2.submission?.id).not.toBe(sub1.submission?.id);
    expect(sub2.submission?.status).toBe('PENDING');

    // 3. The same driver submits R$ 5.00 (500 centavos) on the same day
    const sub3 = demoStorage.submitContribution({
      driver_id: driverId,
      work_date: sameWorkDate,
      payment_date: sameWorkDate,
      amount_centavos: 500,
      payment_method: 'Transfè',
      note: 'Twazyèm kontribisyon aswè (18:00)',
    });
    expect(sub3.error).toBeUndefined();
    expect(sub3.submission).toBeTruthy();
    expect(sub3.submission?.id).toBeTruthy();
    expect(sub3.submission?.id).not.toBe(sub2.submission?.id);
    expect(sub3.submission?.status).toBe('PENDING');

    // Verify all three records appear SEPARATELY in the pending approval queue
    const pendingList = await repository.getPendingSubmissions();
    const sub1Pending = pendingList.find((s) => s.id === sub1.submission?.id);
    const sub2Pending = pendingList.find((s) => s.id === sub2.submission?.id);
    const sub3Pending = pendingList.find((s) => s.id === sub3.submission?.id);

    expect(sub1Pending).toBeDefined();
    expect(sub2Pending).toBeDefined();
    expect(sub3Pending).toBeDefined();
    expect(sub1Pending?.amount_centavos).toBe(100);
    expect(sub2Pending?.amount_centavos).toBe(200);
    expect(sub3Pending?.amount_centavos).toBe(500);

    // Verify pending contributions DO NOT affect the official balance
    const midBalance = (await repository.getPublicGlobalBalance()).total_approved_contributions_centavos;
    expect(midBalance).toBe(initialBalance);

    // 4. Administrator approves all three individually
    const adminId = 'usr-admin-01';
    const app1 = await repository.approveSubmission(sub1.submission!.id, adminId);
    expect(app1.success).toBe(true);

    const app2 = await repository.approveSubmission(sub2.submission!.id, adminId);
    expect(app2.success).toBe(true);

    const app3 = await repository.approveSubmission(sub3.submission!.id, adminId);
    expect(app3.success).toBe(true);

    // 5. Verify the official balance increases by EXACTLY R$ 8.00 (800 centavos)
    const finalBalance = (await repository.getPublicGlobalBalance()).total_approved_contributions_centavos;
    expect(finalBalance - initialBalance).toBe(800);

    // 6. Verify public contribution history displays all three approved entries
    const publicContributors = await repository.getPaginatedPublicContributors(1, 50);
    const approvedEntries = publicContributors.data.filter(
      (c) => c.driver_id === driverId && c.work_date === sameWorkDate
    );
    expect(approvedEntries.length).toBeGreaterThanOrEqual(3);

    const amounts = approvedEntries.map((e) => e.amount_centavos);
    expect(amounts).toContain(100);
    expect(amounts).toContain(200);
    expect(amounts).toContain(500);

    // 7. Verify a fourth contribution can still be submitted on the same day
    const sub4 = demoStorage.submitContribution({
      driver_id: driverId,
      work_date: sameWorkDate,
      payment_date: sameWorkDate,
      amount_centavos: 1000, // R$ 10.00
      payment_method: 'PIX',
      note: 'Katriyèm kontribisyon menm jou a',
    });
    expect(sub4.error).toBeUndefined();
    expect(sub4.submission?.id).toBeTruthy();
    expect(sub4.submission?.status).toBe('PENDING');
  });

  it('rejects zero and negative amounts', () => {
    const driverId = 'usr-driver-01';
    const today = '2026-10-15';

    // Zero centavos
    const resZero = demoStorage.submitContribution({
      driver_id: driverId,
      work_date: today,
      payment_date: today,
      amount_centavos: 0,
      payment_method: 'PIX',
    });
    expect(resZero.error).toBeTruthy();
    expect(resZero.submission).toBeNull();

    // Negative centavos
    const resNeg = demoStorage.submitContribution({
      driver_id: driverId,
      work_date: today,
      payment_date: today,
      amount_centavos: -500,
      payment_method: 'PIX',
    });
    expect(resNeg.error).toBeTruthy();
    expect(resNeg.submission).toBeNull();
  });

  it('protects against accidental rapid double-clicking without limiting daily count', () => {
    const driverId = 'usr-driver-01';
    const today = '2026-10-15';

    // First click
    const click1 = demoStorage.submitContribution({
      driver_id: driverId,
      work_date: today,
      payment_date: today,
      amount_centavos: 100,
      payment_method: 'PIX',
    });
    expect(click1.submission).toBeTruthy();

    // Immediate second click (within milliseconds, identical payload)
    const click2 = demoStorage.submitContribution({
      driver_id: driverId,
      work_date: today,
      payment_date: today,
      amount_centavos: 100,
      payment_method: 'PIX',
    });
    expect(click2.error).toContain('pwoteksyon kont doub klik');
    expect(click2.submission).toBeNull();
  });

  it('allows administrators to record multiple contributions for the same driver on the same day into pending queue', async () => {
    const driverId = 'usr-driver-02';
    const adminId = 'usr-admin-01';
    const workDate = '2026-10-16';

    const res1 = demoStorage.recordDirectContribution({
      admin_id: adminId,
      driver_id: driverId,
      work_date: workDate,
      payment_date: workDate,
      amount_centavos: 1500, // R$ 15.00
      payment_method: 'Espès',
      note: 'Premye peman lajan kach',
    });
    expect(res1.error).toBeUndefined();
    expect(res1.submission).toBeTruthy();
    expect(res1.submission?.status).toBe('PENDING');

    const res2 = demoStorage.recordDirectContribution({
      admin_id: adminId,
      driver_id: driverId,
      work_date: workDate,
      payment_date: workDate,
      amount_centavos: 2500, // R$ 25.00
      payment_method: 'Transfè',
      note: 'Dezyèm peman menm jou a',
    });
    expect(res2.error).toBeUndefined();
    expect(res2.submission).toBeTruthy();
    expect(res2.submission?.id).not.toBe(res1.submission?.id);
    expect(res2.submission?.status).toBe('PENDING');

    // Neither affects balance until approved
    const pendingList = await repository.getPendingSubmissions();
    expect(pendingList.find((p) => p.id === res1.submission?.id)).toBeDefined();
    expect(pendingList.find((p) => p.id === res2.submission?.id)).toBeDefined();

    // Admin approves first only
    const approveRes1 = await repository.approveSubmission(res1.submission!.id, adminId);
    expect(approveRes1.success).toBe(true);

    // Res2 remains pending
    const remainingPending = await repository.getPendingSubmissions();
    expect(remainingPending.find((p) => p.id === res2.submission?.id)).toBeDefined();
    expect(remainingPending.find((p) => p.id === res1.submission?.id)).toBeUndefined();
  });
});
