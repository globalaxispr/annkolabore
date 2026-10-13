-- ============================================================================
-- ADDITIVE, NON-DESTRUCTIVE MIGRATION: admin_record_contribution
-- Lets an administrator register an authorized (already-paid) contribution
-- atomically: approved submission + ONE ledger row + audit log, no receipt needed.
-- Does NOT alter tables, drop anything, disable RLS or touch existing rows.
-- Review, then run manually in Supabase SQL Editor.
-- ============================================================================

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
  SELECT role INTO v_admin_role FROM public.profiles WHERE id = v_admin_id;
  IF v_admin_role IS NULL OR v_admin_role <> 'admin' THEN
    RAISE EXCEPTION 'Aksyon sa a mande otorizasyon administratè oswa trezorye.';
  END IF;

  IF p_amount_cents IS NULL OR p_amount_cents < 1000 THEN
    RAISE EXCEPTION 'Kontribisyon an dwe omwen R$ 10,00.';
  END IF;

  SELECT role INTO v_driver_role FROM public.profiles WHERE id = p_driver_id;
  IF v_driver_role IS NULL THEN
    RAISE EXCEPTION 'Chofè a pa jwenn nan sistèm nan.';
  END IF;

  -- The partial unique index idx_unique_active_work_date rejects a second
  -- non-rejected submission for the same driver/work_date (SQLSTATE 23505),
  -- so a duplicate can never be credited twice.
  INSERT INTO public.contribution_submissions (
    driver_id, work_date, payment_date, amount_cents, payment_method,
    note, status, reviewed_by, reviewed_at
  ) VALUES (
    p_driver_id, p_work_date, COALESCE(p_payment_date, p_work_date), p_amount_cents,
    p_payment_method, p_note, 'approved', v_admin_id, NOW()
  )
  RETURNING id INTO v_id;

  INSERT INTO public.financial_transactions (
    contribution_submission_id, driver_id, amount_cents, transaction_type
  ) VALUES (v_id, p_driver_id, p_amount_cents, 'CONTRIBUTION')
  ON CONFLICT (contribution_submission_id) DO NOTHING;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata, details)
  VALUES (
    v_admin_id,
    'ADMIN_RECORD_CONTRIBUTION',
    'submission',
    v_id::text,
    json_build_object(
      'amount_cents', p_amount_cents,
      'work_date', p_work_date,
      'driver_id', p_driver_id
    ),
    'Administratè anrejistre kontribisyon dirèk R$ ' || (p_amount_cents / 100.0)::text
      || ' pou travay ' || p_work_date::text
  );

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_record_contribution(UUID, DATE, DATE, BIGINT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_record_contribution(UUID, DATE, DATE, BIGINT, TEXT, TEXT) TO authenticated;

-- Refresh PostgREST schema cache so the new RPC is visible immediately.
NOTIFY pgrst, 'reload schema';
