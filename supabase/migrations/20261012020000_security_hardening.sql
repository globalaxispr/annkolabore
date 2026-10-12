-- ==============================================================================
-- MIGRASISYON: RANFÒSMAN SEKIRITE AK ENTEGRITE FINANSYE (IDEMPOTENT & NON-DESTRUCTIVE)
-- Security Hardening: Prerequisite Schema Guarantee, Immutable Financial Ledger,
-- Immutable Audit Logs, Search Path Sanitization on SECURITY DEFINER RPCs,
-- Strict Access Control & Admin-Only Financial Summary
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. ASIRANS TAB AK KOLÒN POU DONASYON PIBLIK (IDEMPOTENT PREREQUISITES)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- A. Tab Konfigirasyon PIX (pix_settings)
CREATE TABLE IF NOT EXISTS public.pix_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  pix_key TEXT NOT NULL,
  pix_key_type TEXT NOT NULL DEFAULT 'CPF' CHECK (pix_key_type IN ('CPF', 'CNPJ', 'Email', 'Telefone', 'Chave Aleatória')),
  beneficiary_name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Pato Branco',
  instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mete konfigirasyon ofisyèl la si li poko egziste
INSERT INTO public.pix_settings (id, pix_key, pix_key_type, beneficiary_name, city, instructions, is_active)
VALUES (
  1,
  '70310589290',
  'CPF',
  'Frantzciou Dorleans',
  'Pato Branco',
  'Fè transfè PIX la nan aplikasyon labank ou, answit soumèt resi peman an anba a pou administratè a ka konfime li.',
  true
)
ON CONFLICT (id) DO UPDATE SET
  pix_key = EXCLUDED.pix_key,
  pix_key_type = EXCLUDED.pix_key_type,
  beneficiary_name = EXCLUDED.beneficiary_name,
  city = EXCLUDED.city,
  instructions = EXCLUDED.instructions,
  is_active = EXCLUDED.is_active;

-- B. Tab Soumisyon Donasyon Piblik (public_donation_submissions)
CREATE TABLE IF NOT EXISTS public.public_donation_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_name TEXT NOT NULL,
  donor_contact TEXT,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  payment_date DATE NOT NULL,
  receipt_storage_path TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donations_status_date
ON public.public_donation_submissions (status, reviewed_at DESC, created_at DESC);

-- C. Entegre Kolòn Donasyon nan Leje Finansye a (financial_transactions)
ALTER TABLE public.financial_transactions
  ALTER COLUMN contribution_submission_id DROP NOT NULL;

ALTER TABLE public.financial_transactions
  ALTER COLUMN driver_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'financial_transactions' 
    AND column_name = 'donation_submission_id'
  ) THEN
    ALTER TABLE public.financial_transactions
      ADD COLUMN donation_submission_id UUID UNIQUE REFERENCES public.public_donation_submissions(id) ON DELETE RESTRICT;
  END IF;
END $$;

ALTER TABLE public.financial_transactions
  DROP CONSTRAINT IF EXISTS financial_transactions_transaction_type_check;

ALTER TABLE public.financial_transactions
  ADD CONSTRAINT financial_transactions_transaction_type_check
  CHECK (transaction_type IN ('CONTRIBUTION', 'DONATION'));

-- D. Depo Prive pou Resi Donasyon PIX (Storage Bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'donation-receipts',
  'donation-receipts',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

DROP POLICY IF EXISTS "Anon upload donation receipts" ON storage.objects;
CREATE POLICY "Anon upload donation receipts" ON storage.objects
FOR INSERT TO anon, authenticated WITH CHECK (
  bucket_id = 'donation-receipts'
);

DROP POLICY IF EXISTS "Admin view donation receipts" ON storage.objects;
CREATE POLICY "Admin view donation receipts" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'donation-receipts' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- E. Règ Sekirite RLS sou Tab Donasyon yo
ALTER TABLE public.pix_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_donation_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PIX settings readable by public" ON public.pix_settings;
CREATE POLICY "PIX settings readable by public" ON public.pix_settings
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin update pix settings" ON public.pix_settings;
CREATE POLICY "Admin update pix settings" ON public.pix_settings
FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Public insert pending donations" ON public.public_donation_submissions;
CREATE POLICY "Public insert pending donations" ON public.public_donation_submissions
FOR INSERT TO anon, authenticated WITH CHECK (
  status = 'pending'
);

DROP POLICY IF EXISTS "Admin view all donation submissions" ON public.public_donation_submissions;
CREATE POLICY "Admin view all donation submissions" ON public.public_donation_submissions
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admin update donation submissions" ON public.public_donation_submissions;
CREATE POLICY "Admin update donation submissions" ON public.public_donation_submissions
FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ==============================================================================
-- 2. FONKSYON SECURITY DEFINER SANITIZE (search_path = public, pg_temp)
-- ==============================================================================

-- A. Handle New User Trigger
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
    'driver', -- Toujou bay wòl chofè pa defo, pa janm fè l admin dirèkteman
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();
  RETURN new;
END;
$$;

-- B. Balans Global Piblik (Aksè piblik pou vizitè ak paj akèy)
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

-- C. Rezime Finansye Administratif (SEKIRIZE POU ADMIN SÈLMAN)
CREATE OR REPLACE FUNCTION public.get_financial_summary()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_role TEXT;
  v_total_contrib BIGINT;
  v_today_contrib BIGINT;
  v_month_contrib BIGINT;
  v_pending_count INT;
  v_pending_cents BIGINT;
  v_members_count INT;
  v_current_month_prefix TEXT;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Verifikasyon Otorizasyon Administratè: Sèlman admin ka jwenn tout chif sa yo
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Aksyon sa a mande otantifikasyon.' USING ERRCODE = '42501';
  END IF;

  SELECT role INTO v_admin_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_admin_role IS NULL OR v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Aksyon sa a mande otorizasyon administratè oswa trezorye.' USING ERRCODE = '42501';
  END IF;

  v_current_month_prefix := TO_CHAR(v_today, 'YYYY-MM');

  -- Total kontribisyon ak donasyon ki apwouve
  SELECT COALESCE(SUM(amount_cents), 0) INTO v_total_contrib
  FROM (
    SELECT amount_cents FROM public.contribution_submissions WHERE status = 'approved'
    UNION ALL
    SELECT amount_cents FROM public.public_donation_submissions WHERE status = 'approved'
  ) combined;

  -- Apwouve jodi a
  SELECT COALESCE(SUM(amount_cents), 0) INTO v_today_contrib
  FROM (
    SELECT amount_cents FROM public.contribution_submissions WHERE status = 'approved' AND (payment_date = v_today OR work_date = v_today)
    UNION ALL
    SELECT amount_cents FROM public.public_donation_submissions WHERE status = 'approved' AND payment_date = v_today
  ) combined_today;

  -- Apwouve pou mwa a
  SELECT COALESCE(SUM(amount_cents), 0) INTO v_month_contrib
  FROM (
    SELECT amount_cents FROM public.contribution_submissions WHERE status = 'approved' AND TO_CHAR(payment_date, 'YYYY-MM') = v_current_month_prefix
    UNION ALL
    SELECT amount_cents FROM public.public_donation_submissions WHERE status = 'approved' AND TO_CHAR(payment_date, 'YYYY-MM') = v_current_month_prefix
  ) combined_month;

  -- Soumisyon ki an atant (chofè + donasyon piblik)
  SELECT COUNT(*), COALESCE(SUM(amount_cents), 0)
  INTO v_pending_count, v_pending_cents
  FROM (
    SELECT amount_cents FROM public.contribution_submissions WHERE status = 'pending'
    UNION ALL
    SELECT amount_cents FROM public.public_donation_submissions WHERE status = 'pending'
  ) combined_pending;

  -- Kantite manm chofè
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

-- D. Apwobasyon Atomik Kontribisyon Chofè
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
    RAISE EXCEPTION 'Aksyon sa a mande otorizasyon administratè oswa trezorye.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_sub
  FROM public.contribution_submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kontribisyon sa a pa jwenn nan sistèm nan.';
  END IF;

  IF v_sub.status = 'approved' THEN
    RETURN TRUE; -- Idempotans
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

-- E. Refize Kontribisyon Chofè
CREATE OR REPLACE FUNCTION public.reject_contribution(
  p_submission_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_role TEXT;
  v_admin_id UUID := auth.uid();
  v_sub RECORD;
BEGIN
  IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 5 THEN
    RAISE EXCEPTION 'Tanpri bay yon rezon klè pou refi a (omwen 5 karaktè).';
  END IF;

  SELECT role INTO v_admin_role
  FROM public.profiles
  WHERE id = v_admin_id;

  IF v_admin_role IS NULL OR v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Aksyon sa a mande otorizasyon administratè oswa trezorye.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_sub
  FROM public.contribution_submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kontribisyon sa a pa jwenn nan sistèm nan.';
  END IF;

  IF v_sub.status != 'pending' THEN
    RAISE EXCEPTION 'Kontribisyon sa a pa nan eta An Atant ankò.';
  END IF;

  UPDATE public.contribution_submissions
  SET 
    status = 'rejected',
    rejection_reason = TRIM(p_reason),
    reviewed_by = v_admin_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_submission_id;

  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata,
    details
  ) VALUES (
    v_admin_id,
    'REJECT_CONTRIBUTION',
    'submission',
    p_submission_id::text,
    json_build_object('reason', TRIM(p_reason), 'work_date', v_sub.work_date),
    'Refize kontribisyon pou jou ' || v_sub.work_date::text || '. Rezon: ' || TRIM(p_reason)
  );

  RETURN TRUE;
END;
$$;

-- F. Apwobasyon Atomik Donasyon Piblik PIX
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
    RAISE EXCEPTION 'Aksyon sa a mande otorizasyon administratè oswa trezorye.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_don
  FROM public.public_donation_submissions
  WHERE id = p_donation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Donasyon sa a pa jwenn nan sistèm nan.';
  END IF;

  IF v_don.status = 'approved' THEN
    RETURN TRUE; -- Idempotans
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

-- G. Refize Donasyon Piblik PIX
CREATE OR REPLACE FUNCTION public.reject_public_donation(
  p_donation_id UUID,
  p_reason TEXT
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
  IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 5 THEN
    RAISE EXCEPTION 'Tanpri bay yon rezon klè pou refi a (omwen 5 karaktè).';
  END IF;

  SELECT role INTO v_admin_role
  FROM public.profiles
  WHERE id = v_admin_id;

  IF v_admin_role IS NULL OR v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Aksyon sa a mande otorizasyon administratè oswa trezorye.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_don
  FROM public.public_donation_submissions
  WHERE id = p_donation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Donasyon sa a pa jwenn nan sistèm nan.';
  END IF;

  IF v_don.status != 'pending' THEN
    RAISE EXCEPTION 'Donasyon sa a pa nan eta An Atant ankò.';
  END IF;

  UPDATE public.public_donation_submissions
  SET 
    status = 'rejected',
    rejection_reason = TRIM(p_reason),
    reviewed_by = v_admin_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_donation_id;

  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata,
    details
  ) VALUES (
    v_admin_id,
    'REJECT_DONATION',
    'donation_submission',
    p_donation_id::text,
    json_build_object('reason', TRIM(p_reason), 'donor_name', v_don.donor_name),
    'Refize donasyon piblik de ' || v_don.donor_name || '. Rezon: ' || TRIM(p_reason)
  );

  RETURN TRUE;
END;
$$;

-- ==============================================================================
-- 3. TRIGÈ ENMUTABILITE SOU LEJE FINANSYE AK OUDIT
-- ==============================================================================

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

-- ==============================================================================
-- 4. GRANT AK REVOKE DWA EGZEKISYON
-- ==============================================================================

REVOKE EXECUTE ON FUNCTION public.get_financial_summary() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_financial_summary() TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_public_global_balance() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_contribution(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_contribution(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_public_donation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_public_donation(UUID, TEXT) TO authenticated;

COMMIT;
