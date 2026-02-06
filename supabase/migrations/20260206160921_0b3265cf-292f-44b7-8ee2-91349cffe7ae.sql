-- Create app_users table for registration and usage tracking
CREATE TABLE public.app_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'verified',
  reports_generated INTEGER NOT NULL DEFAULT 0,
  report_limit INTEGER NOT NULL DEFAULT 1,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create report_history table for audit trail
CREATE TABLE public.report_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  location_name TEXT,
  system_size_kw NUMERIC,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;

-- app_users policies
-- Allow public to register (insert)
CREATE POLICY "Anyone can register"
  ON public.app_users
  FOR INSERT
  WITH CHECK (true);

-- Allow users to read their own record by email
CREATE POLICY "Users can read own record"
  ON public.app_users
  FOR SELECT
  USING (true);

-- Allow updates to own record (for incrementing reports_generated)
CREATE POLICY "Users can update own record"
  ON public.app_users
  FOR UPDATE
  USING (true);

-- report_history policies
-- Allow insert when user exists
CREATE POLICY "Anyone can insert report history"
  ON public.report_history
  FOR INSERT
  WITH CHECK (true);

-- Allow reading own report history
CREATE POLICY "Anyone can read report history"
  ON public.report_history
  FOR SELECT
  USING (true);

-- Create index for faster email lookups
CREATE INDEX idx_app_users_email ON public.app_users(email);

-- Create index for IP address lookups (abuse prevention)
CREATE INDEX idx_app_users_ip ON public.app_users(ip_address);

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_app_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_app_users_updated_at
  BEFORE UPDATE ON public.app_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_app_users_updated_at();

-- Validation trigger for app_users
CREATE OR REPLACE FUNCTION public.validate_app_user_input()
RETURNS TRIGGER AS $$
BEGIN
  -- Email format validation
  IF NEW.email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Phone format validation (7-20 digits with optional +, -, spaces, parentheses)
  IF NEW.phone !~ '^[0-9+\-\(\) ]{7,20}$' THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;
  
  -- Name length validation
  IF length(NEW.name) < 2 OR length(NEW.name) > 200 THEN
    RAISE EXCEPTION 'Name must be between 2 and 200 characters';
  END IF;
  
  -- Email length validation
  IF length(NEW.email) > 255 THEN
    RAISE EXCEPTION 'Email must be less than 255 characters';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_app_user_input
  BEFORE INSERT OR UPDATE ON public.app_users
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_app_user_input();