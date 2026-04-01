-- Fix 1: solar_assessments - prevent arbitrary user_id assignment
DROP POLICY IF EXISTS "Anon and auth can insert assessments" ON public.solar_assessments;
CREATE POLICY "Anon and auth can insert assessments" ON public.solar_assessments
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    latitude IS NOT NULL AND longitude IS NOT NULL
    AND latitude >= -90 AND latitude <= 90
    AND longitude >= -180 AND longitude <= 180
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Fix 2: report_history - require authenticated user
DROP POLICY IF EXISTS "Users can insert own reports" ON public.report_history;
CREATE POLICY "Authenticated users can insert own reports" ON public.report_history
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = auth_user_id
    AND auth_user_id IS NOT NULL
  );

-- Fix 3: app_users - allow users to read own record
CREATE POLICY "Users can read own app_users record" ON public.app_users
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));