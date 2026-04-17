-- Add reports_used_this_month to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS reports_used_this_month integer NOT NULL DEFAULT 0;

-- Create waitlist table
CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  plan_interest text NOT NULL DEFAULT 'premium',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can insert
CREATE POLICY "Anyone can join waitlist"
ON public.waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (email IS NOT NULL AND email <> '');

-- Admins can view
CREATE POLICY "Admins can view waitlist"
ON public.waitlist
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete
CREATE POLICY "Admins can delete waitlist"
ON public.waitlist
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));