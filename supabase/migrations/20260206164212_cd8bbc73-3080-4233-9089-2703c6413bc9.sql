-- Add RLS policy for Admins to view all app_users
CREATE POLICY "Admins can view all users"
ON public.app_users FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add RLS policy for Admins to update app_users (e.g., report_limit)
CREATE POLICY "Admins can update all users"
ON public.app_users FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add RLS policy for Admins to view all report_history
CREATE POLICY "Admins can view all reports"
ON public.report_history FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));