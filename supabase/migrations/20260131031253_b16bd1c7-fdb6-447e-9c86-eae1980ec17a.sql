-- Fix the INSERT policy for leads - make it more specific
-- The public form should allow anyone to submit a lead (this is intentional for a contact form)
-- But we'll add a check to validate the data being inserted

DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;

-- Allow anonymous/public users to submit leads (contact form)
-- This is a restrictive policy that only allows INSERT, not UPDATE/DELETE
CREATE POLICY "Public can submit leads via form"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Ensure required fields are provided
  name IS NOT NULL AND 
  name <> '' AND
  email IS NOT NULL AND 
  email <> '' AND
  phone IS NOT NULL AND 
  phone <> '' AND
  -- Ensure status is always 'new' for public submissions
  status = 'new'
);