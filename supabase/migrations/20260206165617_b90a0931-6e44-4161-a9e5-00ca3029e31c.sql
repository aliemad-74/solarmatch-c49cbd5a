-- Fix overly permissive policies on app_users table
-- These were for the old registration system, now we use profiles table

-- Drop the old permissive policies
DROP POLICY IF EXISTS "Users can read own record" ON public.app_users;
DROP POLICY IF EXISTS "Users can update own record" ON public.app_users;
DROP POLICY IF EXISTS "Anyone can register" ON public.app_users;

-- Create more restrictive policies for app_users (legacy table)
-- Only admins can access app_users now
CREATE POLICY "Only admins can insert app_users"
ON public.app_users FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));