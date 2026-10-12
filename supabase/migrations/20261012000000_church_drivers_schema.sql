-- ==============================================================================
-- SISTÈM JESYON KONTRIBISYON CHOFÈ LEGLIZ (CHURCH DRIVERS CONTRIBUTION SYSTEM)
-- Full PostgreSQL Schema with RLS, Atomic Procedures, Audit Trail & Realtime
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'driver' CHECK (role IN ('driver', 'admin')),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CONTRIBUTION SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.contribution_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  work_date DATE NOT NULL,
  payment_date DATE NOT NULL,
  amount_centavos BIGINT NOT NULL DEFAULT 1000 CHECK (amount_centavos > 0),
  payment_method TEXT NOT NULL DEFAULT 'PIX' CHECK (payment_method IN ('PIX', 'Espès', 'Transfè', 'Lòt')),
  transaction_ref TEXT,
  receipt_url TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for driver and date uniqueness on non-rejected records
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_work_date
ON public.contribution_submissions (driver_id, work_date)
WHERE status != 'REJECTED';

-- 4. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount_centavos BIGINT NOT NULL CHECK (amount_centavos > 0),
  expense_date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  reference_note TEXT,
  receipt_url TEXT,
  authorized_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. OFFICIAL FINANCIAL TRANSACTIONS (LEDGER)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('CONTRIBUTION', 'EXPENSE', 'REVERSAL', 'CORRECTION')),
  amount_centavos BIGINT NOT NULL,
  submission_id UUID UNIQUE REFERENCES public.contribution_submissions(id) ON DELETE RESTRICT,
  expense_id UUID UNIQUE REFERENCES public.expenses(id) ON DELETE RESTRICT,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  recorded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. AUDIT LOGS TABLE (IMMUTABLE AUDIT TRAIL)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PUBLIC VIEW FOR TRANSPARENCY (ZERO LEAKAGE OF EMAILS/RECEIPTS)
CREATE OR REPLACE VIEW public.public_financial_records AS
SELECT 
  s.id,
  p.full_name AS driver_name,
  s.amount_centavos,
  s.work_date,
  s.payment_date,
  s.reviewed_at AS approval_date,
  s.status
FROM public.contribution_submissions s
JOIN public.profiles p ON s.driver_id = p.id
WHERE s.status = 'APPROVED';

-- 8. ATOMIC STORED PROCEDURE: APPROVE CONTRIBUTION (IDEMPOTENT & AUDITED)
CREATE OR REPLACE FUNCTION public.approve_contribution(
  p_submission_id UUID,
  p_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_role TEXT;
  v_admin_name TEXT;
  v_sub RECORD;
BEGIN
  -- Verify admin authorization
  SELECT role, full_name INTO v_admin_role, v_admin_name
  FROM public.profiles
  WHERE id = p_admin_id;

  IF v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Aksyon sa a mande otorizasyon administratè oswa trezorye.';
  END IF;

  -- Lock row to prevent concurrent duplicate approval
  SELECT * INTO v_sub
  FROM public.contribution_submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kontribisyon sa a pa jwenn nan sistèm nan.';
  END IF;

  IF v_sub.status != 'PENDING' THEN
    RAISE EXCEPTION 'Kontribisyon sa a pa nan eta An Atant ankò.';
  END IF;

  -- 1. Update submission status
  UPDATE public.contribution_submissions
  SET 
    status = 'APPROVED',
    reviewed_by = p_admin_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_submission_id;

  -- 2. Add to official financial ledger
  INSERT INTO public.financial_transactions (
    type,
    amount_centavos,
    submission_id,
    driver_id,
    description,
    recorded_by,
    transaction_date
  ) VALUES (
    'CONTRIBUTION',
    v_sub.amount_centavos,
    v_sub.id,
    v_sub.driver_id,
    'Kontribisyon apwouve pou dat ' || v_sub.work_date::text,
    p_admin_id,
    v_sub.payment_date
  );

  -- 3. Record in immutable audit log
  INSERT INTO public.audit_logs (
    action,
    entity_type,
    entity_id,
    actor_id,
    actor_name,
    actor_role,
    details
  ) VALUES (
    'APPROVE_CONTRIBUTION',
    'submission',
    p_submission_id::text,
    p_admin_id,
    v_admin_name,
    'admin',
    'Apwouve kontribisyon R$ ' || (v_sub.amount_centavos / 100.0)::text || ' pou travay ' || v_sub.work_date::text
  );

  RETURN TRUE;
END;
$$;

-- 9. ATOMIC STORED PROCEDURE: REJECT CONTRIBUTION
CREATE OR REPLACE FUNCTION public.reject_contribution(
  p_submission_id UUID,
  p_admin_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_role TEXT;
  v_admin_name TEXT;
  v_sub RECORD;
BEGIN
  IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 5 THEN
    RAISE EXCEPTION 'Tanpri bay yon rezon klè pou refi a (omwen 5 karaktè).';
  END IF;

  SELECT role, full_name INTO v_admin_role, v_admin_name
  FROM public.profiles
  WHERE id = p_admin_id;

  IF v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Aksyon sa a mande otorizasyon administratè.';
  END IF;

  SELECT * INTO v_sub
  FROM public.contribution_submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kontribisyon sa a pa jwenn nan sistèm nan.';
  END IF;

  IF v_sub.status != 'PENDING' THEN
    RAISE EXCEPTION 'Kontribisyon sa a pa nan eta An Atant ankò.';
  END IF;

  UPDATE public.contribution_submissions
  SET 
    status = 'REJECTED',
    rejection_reason = TRIM(p_reason),
    reviewed_by = p_admin_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_submission_id;

  INSERT INTO public.audit_logs (
    action,
    entity_type,
    entity_id,
    actor_id,
    actor_name,
    actor_role,
    details
  ) VALUES (
    'REJECT_CONTRIBUTION',
    'submission',
    p_submission_id::text,
    p_admin_id,
    v_admin_name,
    'admin',
    'Refize kontribisyon pou dat ' || v_sub.work_date::text || '. Rezon: ' || TRIM(p_reason)
  );

  RETURN TRUE;
END;
$$;

-- 10. RPC: GET ACCURATE FINANCIAL SUMMARY
CREATE OR REPLACE FUNCTION public.get_financial_summary()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_contrib BIGINT;
  v_total_exp BIGINT;
  v_today_contrib BIGINT;
  v_month_contrib BIGINT;
  v_members_count INT;
  v_current_month_prefix TEXT;
  v_today DATE := CURRENT_DATE;
BEGIN
  v_current_month_prefix := TO_CHAR(v_today, 'YYYY-MM');

  -- Sum approved contributions
  SELECT COALESCE(SUM(amount_centavos), 0) INTO v_total_contrib
  FROM public.contribution_submissions
  WHERE status = 'APPROVED';

  -- Sum expenses
  SELECT COALESCE(SUM(amount_centavos), 0) INTO v_total_exp
  FROM public.expenses;

  -- Today approved
  SELECT COALESCE(SUM(amount_centavos), 0) INTO v_today_contrib
  FROM public.contribution_submissions
  WHERE status = 'APPROVED' AND (payment_date = v_today OR work_date = v_today);

  -- Month approved
  SELECT COALESCE(SUM(amount_centavos), 0) INTO v_month_contrib
  FROM public.contribution_submissions
  WHERE status = 'APPROVED' AND TO_CHAR(payment_date, 'YYYY-MM') = v_current_month_prefix;

  -- Members count
  SELECT COUNT(*) INTO v_members_count
  FROM public.profiles
  WHERE role = 'driver';

  RETURN json_build_object(
    'total_contributions_centavos', v_total_contrib,
    'total_expenses_centavos', v_total_exp,
    'current_balance_centavos', (v_total_contrib - v_total_exp),
    'members_count', v_members_count,
    'today_contributions_centavos', v_today_contrib,
    'month_contributions_centavos', v_month_contrib
  );
END;
$$;

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribution_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles:
CREATE POLICY "Public can view minimal driver names" ON public.profiles
FOR SELECT USING (true);

CREATE POLICY "Users can update only their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Contribution Submissions:
-- Drivers can read their own
CREATE POLICY "Drivers can view their own submissions" ON public.contribution_submissions
FOR SELECT USING (
  auth.uid() = driver_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Drivers can create their own submissions
CREATE POLICY "Drivers can create their own submissions" ON public.contribution_submissions
FOR INSERT WITH CHECK (
  auth.uid() = driver_id
);

-- Expenses:
CREATE POLICY "Anyone can view expenses summary" ON public.expenses
FOR SELECT USING (true);

CREATE POLICY "Only admins can insert expenses" ON public.expenses
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Financial Transactions (Ledger):
CREATE POLICY "Public can view ledger" ON public.financial_transactions
FOR SELECT USING (true);

-- Audit logs:
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 12. ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.contribution_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.financial_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
