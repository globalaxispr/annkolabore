import { describe, it, expect, vi, beforeEach } from 'vitest';

const insertSpy = vi.fn();
const rpcSpy = vi.fn();
let existingRow: { id: string; status: string } | null = null;

function makeQuery() {
  const q: any = {
    select: vi.fn(() => q),
    eq: vi.fn(() => q),
    neq: vi.fn(() => q),
    limit: vi.fn(() => q),
    maybeSingle: vi.fn(async () => ({ data: existingRow, error: null })),
    insert: vi.fn((payload: unknown) => {
      insertSpy(payload);
      return {
        select: () => ({
          single: async () => ({ data: { id: 'new-sub', ...(payload as object) }, error: null }),
        }),
      };
    }),
  };
  return q;
}

const fakeClient = {
  auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'driver-1' } } })) },
  from: vi.fn(() => makeQuery()),
  rpc: rpcSpy,
};

vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => true,
  createClient: () => fakeClient,
  ensureSupabaseClient: async () => fakeClient,
  getSupabaseDiagnostics: () => ({ statusMessage: '' }),
}));

import { repository } from '@/lib/repository';

describe('Contribution submission without receipt', () => {
  beforeEach(() => {
    insertSpy.mockClear();
    rpcSpy.mockReset();
    existingRow = null;
    repository._clearRecentSubmissions();
  });

  it('driver submits without receipt: no receipt_storage_path / receipt_path in INSERT', async () => {
    const res = await repository.submitContribution({
      work_date: '2026-10-13',
      amount_centavos: 1000,
      payment_method: 'PIX',
    });
    expect(res.error).toBeUndefined();
    const payload = insertSpy.mock.calls[0][0];
    expect(payload).not.toHaveProperty('receipt_storage_path');
    expect(payload).not.toHaveProperty('receipt_path');
    expect(payload).not.toHaveProperty('receipt_url');
    expect(payload.status).toBe('pending'); // never auto-approved
    expect(payload.amount_cents).toBe(1000);
  });

  it('maps optional reference/note to real columns only', async () => {
    await repository.submitContribution({
      work_date: '2026-10-14',
      amount_centavos: 2500,
      payment_method: 'PIX',
      transaction_ref: 'PIX-1',
      note: 'ok',
    });
    const payload = insertSpy.mock.calls[0][0];
    expect(payload.payment_reference).toBe('PIX-1');
    expect(payload.note).toBe('ok');
    expect(payload).not.toHaveProperty('transaction_ref');
    expect(payload).not.toHaveProperty('notes');
  });

  it('rejects zero and negative amounts before touching the database', async () => {
    const res = await repository.submitContribution({
      work_date: '2026-10-13',
      amount_centavos: 0,
      payment_method: 'PIX',
    });
    expect(res.error).toBeTruthy();
    expect(insertSpy).not.toHaveBeenCalled();

    const resNeg = await repository.submitContribution({
      work_date: '2026-10-13',
      amount_centavos: -100,
      payment_method: 'PIX',
    });
    expect(resNeg.error).toBeTruthy();
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it('allows multiple submissions for the same work date (unlimited contributions per day)', async () => {
    existingRow = { id: 'x', status: 'pending' };
    const res = await repository.submitContribution({
      work_date: '2026-10-13',
      amount_centavos: 1000,
      payment_method: 'PIX',
    });
    expect(res.error).toBeUndefined();
    expect(insertSpy).toHaveBeenCalledTimes(1);
    expect(res.submission?.id).toBe('new-sub');
  });

  it('admin registers contribution via atomic RPC with no receipt and no direct inserts', async () => {
    rpcSpy.mockResolvedValue({ data: 'tx-1', error: null });
    const res = await repository.recordDirectContribution({
      admin_id: 'admin-1',
      driver_id: 'driver-1',
      work_date: '2026-10-13',
      payment_date: '2026-10-13',
      amount_centavos: 1000,
      payment_method: 'PIX',
      note: 'cash',
    });
    expect(res.error).toBeUndefined();
    expect(rpcSpy).toHaveBeenCalledTimes(1);
    const [name, args] = rpcSpy.mock.calls[0];
    expect(name).toBe('admin_record_contribution');
    expect(args.p_amount_cents).toBe(1000);
    expect(res.submission?.status).toBe('pending'); // created as pending, never auto-approved
    expect(insertSpy).not.toHaveBeenCalled(); // no client-side ledger insert => no double credit
  });

  it('admin RPC missing gives an actionable message (not a silent failure)', async () => {
    rpcSpy.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'not found' } });
    const res = await repository.recordDirectContribution({
      admin_id: 'admin-1',
      driver_id: 'driver-1',
      work_date: '2026-10-13',
      payment_date: '2026-10-13',
      amount_centavos: 1000,
      payment_method: 'PIX',
    });
    expect(res.error).toContain('admin_record_contribution');
  });

  it('admin direct contribution rejects zero and negative amounts', async () => {
    const res = await repository.recordDirectContribution({
      admin_id: 'admin-1',
      driver_id: 'driver-1',
      work_date: '2026-10-13',
      payment_date: '2026-10-13',
      amount_centavos: 0,
      payment_method: 'PIX',
    });
    expect(res.error).toBeTruthy();
    expect(rpcSpy).not.toHaveBeenCalled();
  });
});
