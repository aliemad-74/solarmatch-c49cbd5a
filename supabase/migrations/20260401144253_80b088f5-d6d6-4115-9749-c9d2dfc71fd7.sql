
-- Add DELETE policy for admins on app_users
CREATE POLICY "Admins can delete app_users" ON public.app_users
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
