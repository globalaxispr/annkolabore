-- ==============================================================================
-- SISTÈM JESYON KONTRIBISYON CHOFÈ LEGLIZ (CHURCH DRIVERS CONTRIBUTION SYSTEM)
-- Complete PostgreSQL Schema, Auth Triggers, Storage Policies, Atomic Procedures,
-- Row Level Security (RLS) & Realtime Synchronization
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE (Linked directly to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'driver' CHECK (role IN ('driver', 'admin')),
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. AUTOMATIC PROFILE CREATION TRIGGER ON REGISTRATION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. CONTRIBUTION SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.contribution_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  payment_date DATE NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents >= 1000), -- Minimum R$ 10,00 (1000 centavos)
  payment_method TEXT NOT NULL DEFAULT 'PIX' CHECK (payment_method IN ('PIX', 'Espès', 'Transfè', 'Lòt')),
  payment_reference TEXT,
  receipt_path TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for unique active work date per driver
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_work_date
ON public.contribution_submissions (driver_id, work_date)
WHERE status != 'rejected';

CREATE INDEX IF NOT EXISTS idx_submissions_status_date
ON public.contribution_submissions (status, reviewed_at DESC, created_at DESC);

-- 5. OFFICIAL FINANCIAL TRANSACTIONS (LEDGER - Approved Contributions Only)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contribution_submission_id UUID UNIQUE REFERENCES public.contribution_submissions(id) ON DELETE RESTRICT,
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  transaction_type TEXT NOT NULL DEFAULT 'CONTRIBUTION' CHECK (transaction_type IN ('CONTRIBUTION')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. AUDIT LOGS TABLE (IMMUTABLE AUDIT TRAIL)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PUBLIC VIEW FOR APPROVED CONTRIBUTORS (Privacy-Safe with Driver Name & Avatar)
CREATE OR REPLACE VIEW public.public_approved_contributors AS
SELECT 
  s.id,
  s.driver_id,
  p.full_name AS driver_name,
  p.avatar_url AS driver_avatar_url,
  s.amount_cents,
  s.amount_cents AS amount_centavos,
  s.work_date,
  s.payment_date,
  s.reviewed_at AS approval_date,
  s.payment_method,
  'Apwouve' AS status
FROM public.contribution_submissions s
JOIN public.profiles p ON s.driver_id = p.id
WHERE s.status = 'approved';

-- 8. PUBLIC VIEW & RPC FOR GLOBAL CONTRIBUTION BALANCE (Zero Leakage)
CREATE OR REPLACE VIEW public.global_contribution_balance AS
SELECT 
  COALESCE(SUM(amount_cents), 0)::BIGINT AS total_approved_contributions_centavos,
  COUNT(*)::INT AS total_approved_count,
  MAX(reviewed_at) AS last_approved_at,
  NOW() AS calculated_at
FROM public.contribution_submissions
WHERE status = 'approved';

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
  FROM public.contribution_submissions
  WHERE status = 'approved';
$$;

-- 9. RPC: GET FINANCIAL SUMMARY (FOR AUTHENTICATED DASHBOARDS)
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

  -- Sum approved contributions
  SELECT COALESCE(SUM(amount_cents), 0) INTO v_total_contrib
  FROM public.contribution_submissions
  WHERE status = 'approved';

  -- Today approved
  SELECT COALESCE(SUM(amount_cents), 0) INTO v_today_contrib
  FROM public.contribution_submissions
  WHERE status = 'approved' AND (payment_date = v_today OR work_date = v_today);

  -- Month approved
  SELECT COALESCE(SUM(amount_cents), 0) INTO v_month_contrib
  FROM public.contribution_submissions
  WHERE status = 'approved' AND TO_CHAR(payment_date, 'YYYY-MM') = v_current_month_prefix;

  -- Pending submissions
  SELECT COUNT(*), COALESCE(SUM(amount_cents), 0)
  INTO v_pending_count, v_pending_cents
  FROM public.contribution_submissions
  WHERE status = 'pending';

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

-- 10. ATOMIC STORED PROCEDURE: APPROVE CONTRIBUTION (IDEMPOTENT & AUDITED)
CREATE OR REPLACE FUNCTION public.approve_contribution(
  p_submission_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_role TEXT;
  v_admin_name TEXT;
  v_admin_id UUID := auth.uid();
  v_sub RECORD;
BEGIN
  -- 1. Verify caller is authenticated admin
  SELECT role, full_name INTO v_admin_role, v_admin_name
  FROM public.profiles
  WHERE id = v_admin_id;

  IF v_admin_role IS NULL OR v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Aksyon sa a mande otorizasyon administratè oswa trezorye.';
  END IF;

  -- 2. Lock submission record FOR UPDATE to prevent race conditions
  SELECT * INTO v_sub
  FROM public.contribution_submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kontribisyon sa a pa jwenn nan sistèm nan.';
  END IF;

  IF v_sub.status = 'approved' THEN
    -- Already approved: idempotent return
    RETURN TRUE;
  END IF;

  IF v_sub.status != 'pending' THEN
    RAISE EXCEPTION 'Kontribisyon sa a pa nan eta An Atant ankò.';
  END IF;

  -- 3. Update status to approved
  UPDATE public.contribution_submissions
  SET 
    status = 'approved',
    reviewed_by = v_admin_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_submission_id;

  -- 4. Record official financial ledger transaction
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

  -- 5. Audit Log
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

-- 11. ATOMIC STORED PROCEDURE: REJECT CONTRIBUTION
CREATE OR REPLACE FUNCTION public.reject_contribution(
  p_submission_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_role TEXT;
  v_admin_name TEXT;
  v_admin_id UUID := auth.uid();
  v_sub RECORD;
BEGIN
  IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 5 THEN
    RAISE EXCEPTION 'Tanpri bay yon rezon klè pou refi a (omwen 5 karaktè).';
  END IF;

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
    json_build_object('reason', TRIM(p_reason)),
    'Refize kontribisyon. Rezon: ' || TRIM(p_reason)
  );

  RETURN TRUE;
END;
$$;

-- 12. STORAGE BUCKET CONFIGURATION FOR PROFILE AVATARS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-avatars',
  'profile-avatars',
  true,
  3145728, -- 3MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 3145728,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage RLS Policies
CREATE POLICY "Public avatars read access" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'profile-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE TO authenticated USING (
  bucket_id = 'profile-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'profile-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 13. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribution_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles:
-- Any authenticated user or public can view non-sensitive profile info (full_name, avatar_url, role)
CREATE POLICY "Profiles readable by public" ON public.profiles
FOR SELECT USING (true);

-- Users can only update their own profile name and avatar (role cannot be self-updated)
CREATE POLICY "Users update own profile" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- Submissions:
-- Drivers view their own submissions; admins view all submissions
CREATE POLICY "Drivers view own submissions" ON public.contribution_submissions
FOR SELECT TO authenticated USING (
  driver_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Drivers insert own submissions with status 'pending'
CREATE POLICY "Drivers insert own submissions" ON public.contribution_submissions
FOR INSERT TO authenticated WITH CHECK (
  driver_id = auth.uid() AND
  status = 'pending'
);

-- Financial Transactions:
-- Read-only public ledger for approved contributions
CREATE POLICY "Financial ledger publicly viewable" ON public.financial_transactions
FOR SELECT USING (true);

-- Audit logs:
-- Admins only
CREATE POLICY "Audit logs admin view only" ON public.audit_logs
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 14. REALTIME PUBLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.contribution_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.financial_transactions;

-- 15. PERMISSIONS FOR ANONYMOUS & AUTHENTICATED
GRANT SELECT ON public.global_contribution_balance TO anon, authenticated;
GRANT SELECT ON public.public_approved_contributors TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_global_balance() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_financial_summary() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_contribution(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_contribution(UUID, TEXT) TO authenticated;
