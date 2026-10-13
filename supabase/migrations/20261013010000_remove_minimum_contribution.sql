-- ==============================================================================
-- MIGRATION: 20261013010000_remove_minimum_contribution.sql
-- DESCRIPTION: Remove R$ 10,00 minimum requirement for contributions.
--              Allow any positive amount in BRL (minimum 1 cent / amount_cents > 0).
--              Zero and negative amounts remain strictly prohibited.
-- ==============================================================================

-- 1. Update CHECK constraint on public.contribution_submissions
-- Replace CHECK (amount_cents >= 1000) with CHECK (amount_cents > 0)
DO $$
BEGIN
  -- Drop existing constraint if it exists (by standard postgres name)
  ALTER TABLE public.contribution_submissions
    DROP CONSTRAINT IF EXISTS contribution_submissions_amount_cents_check;

  -- Add updated constraint requiring positive amount (at least 1 cent)
  ALTER TABLE public.contribution_submissions
    ADD CONSTRAINT contribution_submissions_amount_cents_check
    CHECK (amount_cents > 0);
END $$;

-- 2. Update admin_record_contribution RPC function
-- Update validation to reject NULL or <= 0 instead of < 1000
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
SET search_path = public, auth
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

  -- Validate positive amount (any amount > 0, minimum 1 centavo)
  IF p_amount_cents IS NULL OR p_amount_cents <= 0 THEN
    RAISE EXCEPTION 'Montan kontribisyon an dwe siperyè a zewo.';
  END IF;

  -- Validate driver exists
  SELECT role INTO v_driver_role FROM public.profiles WHERE id = p_driver_id;
  IF v_driver_role IS NULL THEN
    RAISE EXCEPTION 'Chofè a pa jwenn nan sistèm nan.';
  END IF;

  -- Insert into contribution_submissions as pending
  INSERT INTO public.contribution_submissions (
    driver_id, work_date, payment_date, amount_cents, payment_method,
    note, status, created_by, reviewed_by, reviewed_at
  ) VALUES (
    p_driver_id, p_work_date, COALESCE(p_payment_date, p_work_date), p_amount_cents,
    p_payment_method, p_note, 'pending', v_admin_id, NULL, NULL
  )
  RETURNING id INTO v_id;

  -- Record audit log
  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata,
    details
  ) VALUES (
    v_admin_id,
    'ADMIN_RECORD_CONTRIBUTION_PENDING',
    'submission',
    v_id::text,
    json_build_object(
      'driver_id', p_driver_id,
      'work_date', p_work_date,
      'payment_date', COALESCE(p_payment_date, p_work_date),
      'amount_cents', p_amount_cents,
      'payment_method', p_payment_method,
      'status', 'pending'
    ),
    'Administratè anrejistre kontribisyon an atant R$ ' || (p_amount_cents / 100.0)::text || ' pou chofè a'
  );

  RETURN v_id;
END;
$$;

-- Ensure permissions
REVOKE EXECUTE ON FUNCTION public.admin_record_contribution(UUID, DATE, DATE, BIGINT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_record_contribution(UUID, DATE, DATE, BIGINT, TEXT, TEXT) TO authenticated;
