-- READ-ONLY verification queries (safe to run in Supabase SQL Editor).

-- 1. Actual columns of contribution_submissions
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'contribution_submissions'
order by ordinal_position;

-- 2. Is receipt_storage_path really absent? (expected: 0 rows)
select column_name from information_schema.columns
where table_schema='public' and table_name='contribution_submissions'
  and column_name in ('receipt_storage_path','notes');

-- 3. RLS policies on the financial tables
select tablename, policyname, cmd, roles, with_check
from pg_policies
where schemaname='public'
  and tablename in ('contribution_submissions','financial_transactions');

-- 4. Is the admin RPC installed?
select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and proname in ('approve_contribution','reject_contribution','admin_record_contribution');
