-- Fix registration_tracking: restrict to authenticated only
DROP POLICY IF EXISTS "Users can see own registration" ON public.registration_tracking;
CREATE POLICY "Users can see own registration" ON public.registration_tracking
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Fix app_users: remove email-based lookup
DROP POLICY IF EXISTS "Users can read own app_users record" ON public.app_users;
CREATE POLICY "Users can read own app_users record" ON public.app_users
  FOR SELECT TO authenticated
  USING (id = auth.uid());