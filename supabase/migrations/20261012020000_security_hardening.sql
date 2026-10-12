-- ==============================================================================
-- MIGRASISYON: RANFÒSMAN SEKIRITE AK ENTEGRITE FINANSYE (NON-DESTRUCTIVE)
-- Security Hardening: Immutable Financial Ledger, Immutable Audit Logs,
-- Search Path Sanitization on SECURITY DEFINER RPCs, Strict Access Control
-- ==============================================================================

-- 1. HARDEN SECURITY DEFINER FUNCTIONS (Explicit search_path = public, pg_temp)

-- A. Handle New User Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Chofè'),
    'driver', -- Always assign default driver role, never admin
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();
  RETURN new;
END;
$$;

-- B. Public Global Balance RPC (Privacy-safe aggregate for public homepage)
CREATE OR REPLACE FUNCTION public.get_public_global_balance()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT json_build_object(
    'total_approved_contributions_centavos', COALESCE(SUM(amount_cents), 0),
    'total_approved_count', COUNT(*),
    'last_updated', NOW()
  )
  FROM (
    SELECT amount_cents FROM public.contribution_submissions WHERE status = 'approved'
    UNION ALL
    SELECT amount_cents FROM public.public_donation_submissions WHERE status = 'approved'
  ) AS combined_approved;
$$;

-- C. Financial Summary RPC (Restricted strictly to authenticated users)
CREATE OR REPLACE FUNCTION public.get_financial_summary()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total_contrib BIGINT;
  v_today_contrib BIGINT;
  v_month_contrib BIGINT;
  v_pending_count INT;
  v_pending_cents BIGINT;
  v_members_count INT;
  v_current_month_prefix TEXT;
  v_today DATE := CURRENT_DATE;
BEGIN
  v_current_month_prefix := TO_CHAR(v_today, 'YYYY-MM');

  -- Sum all approved (driver contributions + public donations)
  SELECT COALESCE(SUM(amount_cents), 0) INTO v_total_contrib
  FROM (
    SELECT amount_cents FROM public.contribution_submissions WHERE status = 'approved'
    UNION ALL
    SELECT amount_cents FROM public.public_donation_submissions WHERE status = 'approved'
  ) combined;

  -- Today approved
  SELECT COALESCE(SUM(amount_cents), 0) INTO v_today_contrib
  FROM (
    SELECT amount_cents FROM public.contribution_submissions WHERE status = 'approved' AND (payment_date = v_today OR work_date = v_today)
    UNION ALL
    SELECT amount_cents FROM public.public_donation_submissions WHERE status = 'approved' AND payment_date = v_today
  ) combined_today;

  -- Month approved
  SELECT COALESCE(SUM(amount_cents), 0) INTO v_month_contrib
  FROM (
    SELECT amount_cents FROM public.contribution_submissions WHERE status = 'approved' AND TO_CHAR(payment_date, 'YYYY-MM') = v_current_month_prefix
    UNION ALL
    SELECT amount_cents FROM public.public_donation_submissions WHERE status = 'approved' AND TO_CHAR(payment_date, 'YYYY-MM') = v_current_month_prefix
  ) combined_month;

  -- Pending submissions (both driver contributions and public donations)
  SELECT COUNT(*), COALESCE(SUM(amount_cents), 0)
  INTO v_pending_count, v_pending_cents
  FROM (
    SELECT amount_cents FROM public.contribution_submissions WHERE status = 'pending'
    UNION ALL
    SELECT amount_cents FROM public.public_donation_submissions WHERE status = 'pending'
  ) combined_pending;

  -- Members count
  SELECT COUNT(*) INTO v_members_count
  FROM public.profiles
  WHERE role = 'driver';

  RETURN json_build_object(
    'opening_balance_centavos', 0,
    'total_contributions_centavos', v_total_contrib,
    'current_balance_centavos', v_total_contrib,
    'month_contributions_centavos', v_month_contrib,
    'today_contributions_centavos', v_today_contrib,
    'pending_count', v_pending_count,
    'pending_centavos', v_pending_cents,
    'members_count', v_members_count,
    'last_updated', NOW()
  );
END;
$$;

-- D. Atomic Driver Contribution Approval
CREATE OR REPLACE FUNCTION public.approve_contribution(
  p_submission_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_role TEXT;
  v_admin_name TEXT;
  v_admin_id UUID := auth.uid();
  v_sub RECORD;
BEGIN
  SELECT role, full_name INTO v_admin_role, v_admin_name
  FROM public.profiles
  WHERE id = v_admin_id;

  IF v_admin_role IS NULL OR v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Aksyon sa a mande otorizasyon administratè oswa trezorye.';
  END IF;

  SELECT * INTO v_sub
  FROM public.contribution_submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kontribisyon sa a pa jwenn nan sistèm nan.';
  END IF;

  IF v_sub.status = 'approved' THEN
    RETURN TRUE; -- Idempotent return
  END IF;

  IF v_sub.status != 'pending' THEN
    RAISE EXCEPTION 'Kontribisyon sa a pa nan eta An Atant ankò.';
  END IF;

  UPDATE public.contribution_submissions
  SET 
    status = 'approved',
    reviewed_by = v_admin_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_submission_id;

  INSERT INTO public.financial_transactions (
    contribution_submission_id,
    driver_id,
    amount_cents,
    transaction_type
  ) VALUES (
    v_sub.id,
    v_sub.driver_id,
    v_sub.amount_cents,
    'CONTRIBUTION'
  )
  ON CONFLICT (contribution_submission_id) DO NOTHING;

  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata,
    details
  ) VALUES (
    v_admin_id,
    'APPROVE_CONTRIBUTION',
    'submission',
    p_submission_id::text,
    json_build_object(
      'amount_cents', v_sub.amount_cents,
      'work_date', v_sub.work_date,
      'driver_id', v_sub.driver_id
    ),
    'Apwouve kontribisyon R$ ' || (v_sub.amount_cents / 100.0)::text || ' pou travay ' || v_sub.work_date::text
  );

  RETURN TRUE;
END;
$$;

-- E. Atomic Public Donation Approval
CREATE OR REPLACE FUNCTION public.approve_public_donation(
  p_donation_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_role TEXT;
  v_admin_id UUID := auth.uid();
  v_don RECORD;
BEGIN
  SELECT role INTO v_admin_role
  FROM public.profiles
  WHERE id = v_admin_id;

  IF v_admin_role IS NULL OR v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Aksyon sa a mande otorizasyon administratè oswa trezorye.';
  END IF;

  SELECT * INTO v_don
  FROM public.public_donation_submissions
  WHERE id = p_donation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Donasyon sa a pa jwenn nan sistèm nan.';
  END IF;

  IF v_don.status = 'approved' THEN
    RETURN TRUE; -- Idempotent return
  END IF;

  IF v_don.status != 'pending' THEN
    RAISE EXCEPTION 'Donasyon sa a pa nan eta An Atant ankò.';
  END IF;

  UPDATE public.public_donation_submissions
  SET 
    status = 'approved',
    reviewed_by = v_admin_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_donation_id;

  INSERT INTO public.financial_transactions (
    donation_submission_id,
    amount_cents,
    transaction_type
  ) VALUES (
    v_don.id,
    v_don.amount_cents,
    'DONATION'
  )
  ON CONFLICT (donation_submission_id) DO NOTHING;

  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata,
    details
  ) VALUES (
    v_admin_id,
    'APPROVE_DONATION',
    'donation_submission',
    p_donation_id::text,
    json_build_object(
      'amount_cents', v_don.amount_cents,
      'donor_name', v_don.donor_name,
      'payment_date', v_don.payment_date
    ),
    'Apwouve donasyon piblik R$ ' || (v_don.amount_cents / 100.0)::text || ' soti nan ' || v_don.donor_name
  );

  RETURN TRUE;
END;
$$;

-- 2. IMMUTABLE FINANCIAL LEDGER PROTECTION TRIGGER
CREATE OR REPLACE FUNCTION public.prevent_financial_transaction_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'Dosye leje finansye ofisyèl la pa ka modifye oswa efase (Immutable Ledger).';
END;
$$;

DROP TRIGGER IF EXISTS trg_immutable_financial_transactions ON public.financial_transactions;
CREATE TRIGGER trg_immutable_financial_transactions
  BEFORE UPDATE OR DELETE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_transaction_modification();

-- 3. IMMUTABLE AUDIT LOG PROTECTION TRIGGER
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'Dosye odit yo pa ka modifye oswa efase (Immutable Audit Log).';
END;
$$;

DROP TRIGGER IF EXISTS trg_immutable_audit_logs ON public.audit_logs;
CREATE TRIGGER trg_immutable_audit_logs
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

-- 4. RESTRICT SENSITIVE FUNCTION PERMISSIONS
REVOKE EXECUTE ON FUNCTION public.get_financial_summary() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_financial_summary() TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_public_global_balance() TO anon, authenticated;
