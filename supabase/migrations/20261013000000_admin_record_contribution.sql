-- ============================================================================
-- ADDITIVE, NON-DESTRUCTIVE MIGRATION: admin_record_contribution
-- Lets an administrator register an authorized contribution on behalf of a driver.
-- CRITICAL FINANCIAL WORKFLOW:
-- 1. Inserts the contribution with status 'pending' (NEVER auto-approved).
-- 2. Records which administrator submitted it (created_by).
-- 3. Does NOT insert into financial_transactions.
-- 4. Requires explicit review and approval via approve_contribution(UUID).
-- 5. Preserves strict admin authorization, RLS and financial ledger idempotency.
-- Does NOT alter existing data, drop anything, or disable RLS.
-- Review, then execute manually in Supabase SQL Editor.
-- ============================================================================

-- 1. Additive schema update: record administrator who submitted the contribution
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contribution_submissions' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.contribution_submissions
      ADD COLUMN created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Procedure: admin registers contribution in 'pending' status
CREATE OR REPLACE FUNCTION public.admin_record_contribution(
  p_driver_id      UUID,
  p_work_date      DATE,
  p_payment_date   DATE,
  p_amount_cents   BIGINT,
  p_payment_method TEXT,
  p_note           TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id   UUID := auth.uid();
  v_admin_role TEXT;
  v_driver_role TEXT;
  v_id         UUID;
BEGIN
  -- Verify caller is an authenticated administrator
  SELECT role INTO v_admin_role FROM public.profiles WHERE id = v_admin_id;
  IF v_admin_role IS NULL OR v_admin_role <> 'admin' THEN
    RAISE EXCEPTION 'Aksyon sa a mande otorizasyon administratè oswa trezorye.';
  END IF;

  -- Validate minimum amount (R$ 10,00)
  IF p_amount_cents IS NULL OR p_amount_cents < 1000 THEN
    RAISE EXCEPTION 'Kontribisyon an dwe omwen R$ 10,00.';
  END IF;

  -- Validate driver exists
  SELECT role INTO v_driver_role FROM public.profiles WHERE id = p_driver_id;
  IF v_driver_role IS NULL THEN
    RAISE EXCEPTION 'Chofè a pa jwenn nan sistèm nan.';
  END IF;

  -- The partial unique index idx_unique_active_work_date prevents duplicate
  -- active submissions for the same driver/work_date (SQLSTATE 23505).
  -- Status MUST be 'pending' so it appears in /admin/atant for explicit review.
  INSERT INTO public.contribution_submissions (
    driver_id, work_date, payment_date, amount_cents, payment_method,
    note, status, created_by, reviewed_by, reviewed_at
  ) VALUES (
    p_driver_id, p_work_date, COALESCE(p_payment_date, p_work_date), p_amount_cents,
    p_payment_method, p_note, 'pending', v_admin_id, NULL, NULL
  )
  RETURNING id INTO v_id;

  -- CRITICAL: DO NOT insert into financial_transactions!
  -- Only the subsequent explicit approval via approve_contribution(UUID)
  -- generates the official financial ledger entry and increases the public balance.

  -- Audit log records the submission by the administrator
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata, details)
  VALUES (
    v_admin_id,
    'ADMIN_SUBMIT_CONTRIBUTION',
    'submission',
    v_id::text,
    json_build_object(
      'amount_cents', p_amount_cents,
      'work_date', p_work_date,
      'driver_id', p_driver_id,
      'status', 'pending'
    ),
    'Administratè anrejistre kontribisyon an atant R$ ' || (p_amount_cents / 100.0)::text
      || ' pou chofè a pou travay dat ' || p_work_date::text
  );

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_record_contribution(UUID, DATE, DATE, BIGINT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_record_contribution(UUID, DATE, DATE, BIGINT, TEXT, TEXT) TO authenticated;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

