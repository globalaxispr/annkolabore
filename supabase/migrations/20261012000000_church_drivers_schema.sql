-- ==============================================================================
-- SISTÈM JESYON KONTRIBISYON CHOFÈ LEGLIZ (CHURCH DRIVERS CONTRIBUTION SYSTEM)
-- PostgreSQL Schema with Scheduled Withdrawals, Atomic Procedures & Audit Trail
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
  amount_centavos BIGINT NOT NULL DEFAULT 1000 CHECK (amount_centavos >= 1000), -- Minimum R$ 10,00
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

-- 4. SCHEDULED WITHDRAWALS TABLE (Dedicated Scheduled Withdrawal Workflow)
CREATE TABLE IF NOT EXISTS public.scheduled_withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  amount_centavos BIGINT NOT NULL CHECK (amount_centavos > 0),
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT,
  status TEXT NOT NULL DEFAULT 'Pwograme' CHECK (status IN ('Pwograme', 'An Atant', 'Egzekite', 'Anile')),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  executed_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  executed_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. HISTORICAL EXPENSES PRESERVATION (Safe Backward-Compatibility Migration)
-- Preserves existing records while routing outgoing transactions into withdrawals
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

-- 6. OFFICIAL FINANCIAL TRANSACTIONS (LEDGER)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('CONTRIBUTION', 'WITHDRAWAL', 'REVERSAL', 'CORRECTION')),
  amount_centavos BIGINT NOT NULL,
  submission_id UUID UNIQUE REFERENCES public.contribution_submissions(id) ON DELETE RESTRICT,
  withdrawal_id UUID UNIQUE REFERENCES public.scheduled_withdrawals(id) ON DELETE RESTRICT,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  recorded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. AUDIT LOGS TABLE (IMMUTABLE AUDIT TRAIL)
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

-- 8. PUBLIC VIEW FOR TRANSPARENCY (ZERO LEAKAGE OF EMAILS/RECEIPTS)
CREATE OR REPLACE VIEW public.public_financial_records AS
SELECT 
  s.id,
  'CONTRIBUTION' AS type,
  p.full_name AS driver_name,
  s.amount_centavos,
  s.work_date,
  s.payment_date,
  s.reviewed_at AS transaction_date,
  s.status
FROM public.contribution_submissions s
JOIN public.profiles p ON s.driver_id = p.id
WHERE s.status = 'APPROVED'
UNION ALL
SELECT 
  w.id,
  'WITHDRAWAL' AS type,
  'Retrè Fon' AS driver_name,
  w.amount_centavos,
  w.scheduled_date AS work_date,
  w.scheduled_date AS payment_date,
  w.executed_at AS transaction_date,
  w.status
FROM public.scheduled_withdrawals w
WHERE w.status = 'Egzekite';

-- 9. ATOMIC STORED PROCEDURE: APPROVE CONTRIBUTION (IDEMPOTENT & AUDITED)
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
  SELECT role, full_name INTO v_admin_role, v_admin_name
  FROM public.profiles
  WHERE id = p_admin_id;

  IF v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Aksyon sa a mande otorizasyon administratè oswa trezorye.';
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
    status = 'APPROVED',
    reviewed_by = p_admin_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_submission_id;

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

-- 10. ATOMIC STORED PROCEDURE: EXECUTE SCHEDULED WITHDRAWAL
CREATE OR REPLACE FUNCTION public.execute_scheduled_withdrawal(
  p_withdrawal_id UUID,
  p_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_role TEXT;
  v_admin_name TEXT;
  v_wth RECORD;
BEGIN
  SELECT role, full_name INTO v_admin_role, v_admin_name
  FROM public.profiles
  WHERE id = p_admin_id;

  IF v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Aksyon sa a mande otorizasyon administratè oswa trezorye.';
  END IF;

  SELECT * INTO v_wth
  FROM public.scheduled_withdrawals
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Retrè pwograme sa a pa jwenn nan sistèm nan.';
  END IF;

  IF v_wth.status = 'Egzekite' THEN
    RAISE EXCEPTION 'Retrè sa a te deja egzekite.';
  END IF;

  IF v_wth.status = 'Anile' THEN
    RAISE EXCEPTION 'Retrè sa a te anile.';
  END IF;

  UPDATE public.scheduled_withdrawals
  SET 
    status = 'Egzekite',
    executed_by = p_admin_id,
    executed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_withdrawal_id;

  INSERT INTO public.financial_transactions (
    type,
    amount_centavos,
    withdrawal_id,
    description,
    recorded_by,
    transaction_date
  ) VALUES (
    'WITHDRAWAL',
    v_wth.amount_centavos,
    v_wth.id,
    'Retrè egzekite: ' || v_wth.description,
    p_admin_id,
    CURRENT_DATE
  );

  INSERT INTO public.audit_logs (
    action,
    entity_type,
    entity_id,
    actor_id,
    actor_name,
    actor_role,
    details
  ) VALUES (
    'EXECUTE_WITHDRAWAL',
    'withdrawal',
    p_withdrawal_id::text,
    p_admin_id,
    v_admin_name,
    'admin',
    'Egzekite retrè R$ ' || (v_wth.amount_centavos / 100.0)::text || ': ' || v_wth.description
  );

  RETURN TRUE;
END;
$$;

-- 11. RPC: GET ACCURATE FINANCIAL SUMMARY (BALANCE FIRST)
CREATE OR REPLACE FUNCTION public.get_financial_summary()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_contrib BIGINT;
  v_total_withd BIGINT;
  v_sched_withd BIGINT;
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

  -- Sum executed withdrawals
  SELECT COALESCE(SUM(amount_centavos), 0) INTO v_total_withd
  FROM public.scheduled_withdrawals
  WHERE status = 'Egzekite';

  -- Sum pending scheduled withdrawals (projection)
  SELECT COALESCE(SUM(amount_centavos), 0) INTO v_sched_withd
  FROM public.scheduled_withdrawals
  WHERE status IN ('Pwograme', 'An Atant');

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
    'total_withdrawals_centavos', v_total_withd,
    'current_balance_centavos', (v_total_contrib - v_total_withd),
    'scheduled_withdrawals_centavos', v_sched_withd,
    'projected_balance_centavos', ((v_total_contrib - v_total_withd) - v_sched_withd),
    'members_count', v_members_count,
    'today_contributions_centavos', v_today_contrib,
    'month_contributions_centavos', v_month_contrib
  );
END;
$$;

-- 12. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribution_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view driver profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Drivers view own submissions" ON public.contribution_submissions FOR SELECT USING (auth.uid() = driver_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Drivers create submissions" ON public.contribution_submissions FOR INSERT WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Public can view scheduled withdrawals" ON public.scheduled_withdrawals FOR SELECT USING (true);
CREATE POLICY "Only admins can insert or update withdrawals" ON public.scheduled_withdrawals FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Public can view ledger" ON public.financial_transactions FOR SELECT USING (true);
CREATE POLICY "Only admins view audit" ON public.audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 13. REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.contribution_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_withdrawals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.financial_transactions;
