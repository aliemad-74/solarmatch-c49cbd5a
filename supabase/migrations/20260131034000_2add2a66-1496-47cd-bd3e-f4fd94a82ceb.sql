-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Admins can view leads" ON public.leads;

-- Create a proper permissive SELECT policy that only allows admins to read leads
CREATE POLICY "Admins can view leads"
ON public.leads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));