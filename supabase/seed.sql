-- ============================================================================
-- CLIENTECHO: Safe Public Application Seed Script
-- ============================================================================
-- NOTE: In Supabase, users must be created through Supabase Dashboard UI (Add User),
-- /signup page, or Supabase Admin API to ensure GoTrue Auth compatibility.
-- Do NOT insert directly into auth.users via raw SQL.

-- 1. Ensure public.creators records exist for all authenticated users
INSERT INTO public.creators (id, email, name, subscription_status, created_at, updated_at)
SELECT id, email, COALESCE(raw_user_meta_data->>'name', 'Creator Workspace'), 'pro', now(), now()
FROM auth.users
ON CONFLICT (id) DO NOTHING;
