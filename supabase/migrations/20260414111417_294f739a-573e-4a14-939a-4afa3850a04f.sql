-- Fix 1: Replace inline subquery with has_role() on user_roles INSERT policy
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Replace inline subquery on user_roles UPDATE policy  
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 3: Replace inline subquery on user_roles DELETE policy
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 4: Validate user_id on report_history INSERT
DROP POLICY IF EXISTS "Authenticated users can insert own reports" ON public.report_history;
CREATE POLICY "Authenticated users can insert own reports" ON public.report_history
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = auth_user_id
    AND auth_user_id IS NOT NULL
    AND (user_id = auth.uid())
  );