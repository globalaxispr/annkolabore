-- ==============================================================================
-- MIGRATION: 20261014000000_allow_unlimited_contributions_per_day.sql
-- DESCRIPTION: Allow drivers to make UNLIMITED contributions on the same day.
--              Removes the single-contribution-per-day restriction.
--              Preserves all financial ledger idempotency, audit trail, and RLS.
-- ==============================================================================

-- 1. Drop the partial unique index that enforced one active contribution per work_date per driver
DROP INDEX IF EXISTS public.idx_unique_active_work_date;

-- 2. Create a standard (non-unique) index on (driver_id, work_date) to maintain
--    fast query performance for dashboard lookups and driver histories.
CREATE INDEX IF NOT EXISTS idx_contribution_submissions_driver_work_date
ON public.contribution_submissions (driver_id, work_date);

-- 3. Create an index on (driver_id, created_at DESC) for quick recent contribution ordering
CREATE INDEX IF NOT EXISTS idx_contribution_submissions_driver_created
ON public.contribution_submissions (driver_id, created_at DESC);

-- NOTE: All financial integrity protections remain strictly intact:
-- - public.financial_transactions.contribution_submission_id remains UNIQUE (ensures each approved submission can generate at most 1 ledger entry)
-- - public.contribution_submissions.amount_cents CHECK (amount_cents > 0) remains active (no R$ 10 minimum, minimum R$ 0.01 / 1 centavo, zero and negative prohibited)
-- - Atomic approval via approve_contribution(UUID) remains idempotent with FOR UPDATE row locks.
