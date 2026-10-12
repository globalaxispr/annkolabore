-- ==============================================================================
-- MIGRASISYON: AJOUTE DONASYON PIBLIK PIX AK KONFIGIRASYON (NON-DESTRUCTIVE)
-- Public PIX Donations, Admin Settings, Private Storage, Atomic Procedures & Ledger Integration
-- ==============================================================================

-- 1. PIX SETTINGS TABLE (Single row configuration, admin managed)
CREATE TABLE IF NOT EXISTS public.pix_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  pix_key TEXT NOT NULL,
  pix_key_type TEXT NOT NULL DEFAULT 'CPF' CHECK (pix_key_type IN ('CPF', 'CNPJ', 'Email', 'Telefone', 'Chave Aleatória')),
  beneficiary_name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Sao Paulo',
  instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default official PIX key (70310589290 - valid CPF string, recipient Frantzciou Dorleans)
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

-- 2. PUBLIC DONATION SUBMISSIONS TABLE
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

-- 3. INTEGRATE FINANCIAL TRANSACTIONS LEDGER NON-DESTRUCTIVELY
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

-- 4. PRIVATE STORAGE BUCKET FOR DONATION RECEIPTS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'donation-receipts',
  'donation-receipts',
  false, -- STRICTLY PRIVATE BUCKET
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- Storage RLS Policies for donation-receipts
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

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.pix_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_donation_submissions ENABLE ROW LEVEL SECURITY;

-- PIX Settings: readable by everyone
DROP POLICY IF EXISTS "PIX settings readable by public" ON public.pix_settings;
CREATE POLICY "PIX settings readable by public" ON public.pix_settings
FOR SELECT USING (true);

-- PIX Settings: admin only update
DROP POLICY IF EXISTS "Admin update pix settings" ON public.pix_settings;
CREATE POLICY "Admin update pix settings" ON public.pix_settings
FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Public donation submissions:
-- Anon & Authenticated can insert pending submissions
DROP POLICY IF EXISTS "Public insert pending donations" ON public.public_donation_submissions;
CREATE POLICY "Public insert pending donations" ON public.public_donation_submissions
FOR INSERT TO anon, authenticated WITH CHECK (
  status = 'pending'
);

-- Only admins can view donation submissions
DROP POLICY IF EXISTS "Admin view all donation submissions" ON public.public_donation_submissions;
CREATE POLICY "Admin view all donation submissions" ON public.public_donation_submissions
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can update donation submissions
DROP POLICY IF EXISTS "Admin update donation submissions" ON public.public_donation_submissions;
CREATE POLICY "Admin update donation submissions" ON public.public_donation_submissions
FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 6. ATOMIC STORED PROCEDURE: APPROVE PUBLIC DONATION
CREATE OR REPLACE FUNCTION public.approve_public_donation(
  p_donation_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_role TEXT;
  v_admin_id UUID := auth.uid();
  v_don RECORD;
BEGIN
  -- 1. Verify caller is authenticated admin
  SELECT role INTO v_admin_role
  FROM public.profiles
  WHERE id = v_admin_id;

  IF v_admin_role IS NULL OR v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Aksyon sa a mande otorizasyon administratè oswa trezorye.';
  END IF;

  -- 2. Lock donation record FOR UPDATE to prevent double approval / race conditions
  SELECT * INTO v_don
  FROM public.public_donation_submissions
  WHERE id = p_donation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Donasyon sa a pa jwenn nan sistèm nan.';
  END IF;

  IF v_don.status = 'approved' THEN
    -- Idempotent return
    RETURN TRUE;
  END IF;

  IF v_don.status != 'pending' THEN
    RAISE EXCEPTION 'Donasyon sa a pa nan eta An Atant ankò.';
  END IF;

  -- 3. Update status to approved
  UPDATE public.public_donation_submissions
  SET 
    status = 'approved',
    reviewed_by = v_admin_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_donation_id;

  -- 4. Record official financial ledger transaction
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

  -- 5. Immutable Audit Log
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

-- 7. ATOMIC STORED PROCEDURE: REJECT PUBLIC DONATION
CREATE OR REPLACE FUNCTION public.reject_public_donation(
  p_donation_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    RAISE EXCEPTION 'Aksyon sa a mande otorizasyon administratè oswa trezorye.';
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

-- 8. EXTEND GLOBAL BALANCE VIEW & RPC TO COMBINE APPROVED CONTRIBUTIONS & DONATIONS
CREATE OR REPLACE VIEW public.global_contribution_balance AS
SELECT 
  COALESCE(SUM(amount_cents), 0)::BIGINT AS total_approved_contributions_centavos,
  COUNT(*)::INT AS total_approved_count,
  MAX(reviewed_at) AS last_approved_at,
  NOW() AS calculated_at
FROM (
  SELECT amount_cents, reviewed_at FROM public.contribution_submissions WHERE status = 'approved'
  UNION ALL
  SELECT amount_cents, reviewed_at FROM public.public_donation_submissions WHERE status = 'approved'
) AS combined_approved;

CREATE OR REPLACE FUNCTION public.get_public_global_balance()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
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

-- 9. EXTEND FINANCIAL SUMMARY RPC FOR ADMIN DASHBOARD
CREATE OR REPLACE FUNCTION public.get_financial_summary()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 10. REALTIME PUBLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.pix_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.public_donation_submissions;

-- 11. GRANT PERMISSIONS
GRANT SELECT ON public.pix_settings TO anon, authenticated;
GRANT INSERT ON public.public_donation_submissions TO anon, authenticated;
GRANT SELECT, UPDATE ON public.public_donation_submissions TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_public_donation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_public_donation(UUID, TEXT) TO authenticated;
