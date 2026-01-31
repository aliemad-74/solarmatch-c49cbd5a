-- Fix the SELECT policy for leads table
-- The current policy is RESTRICTIVE which doesn't work as expected
-- We need a PERMISSIVE policy that only allows admins to view leads

-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Admins can view leads" ON public.leads;

-- Create a PERMISSIVE SELECT policy for admins only
CREATE POLICY "Admins can view leads"
ON public.leads
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));