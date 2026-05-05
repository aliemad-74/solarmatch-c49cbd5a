
-- Trigger functions: never called directly via API, revoke from public roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.check_lead_rate_limit() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_profiles_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_app_users_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_lead_input() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_app_user_input() FROM anon, authenticated, public;

-- has_role is used inside RLS policies (server-side), no need to expose via RPC
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;

-- Keep the following callable because the client uses them:
-- - public.record_registration (called from client after signup) → authenticated only (already revoked from anon)
-- - public.check_registration_allowed (called from client/edge during signup) → keep anon access
-- - public.get_public_stats (intentionally public) → keep
