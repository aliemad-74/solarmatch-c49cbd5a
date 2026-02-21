-- Drop the legacy foreign key constraint that causes insert failures
-- The user_id column referenced app_users but the system now uses profiles + auth_user_id
ALTER TABLE public.report_history DROP CONSTRAINT report_history_user_id_fkey;