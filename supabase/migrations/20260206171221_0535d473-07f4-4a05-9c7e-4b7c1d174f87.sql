-- Create table to track IP registrations
CREATE TABLE public.registration_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast IP lookups
CREATE INDEX idx_registration_tracking_ip ON public.registration_tracking(ip_address);
CREATE INDEX idx_registration_tracking_created ON public.registration_tracking(created_at);

-- Enable RLS
ALTER TABLE public.registration_tracking ENABLE ROW LEVEL SECURITY;

-- Only system can insert (via trigger)
CREATE POLICY "System can insert tracking"
ON public.registration_tracking
FOR INSERT
WITH CHECK (true);

-- Admins can view
CREATE POLICY "Admins can view tracking"
ON public.registration_tracking
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create list of blocked email domains
CREATE TABLE public.blocked_email_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blocked_email_domains ENABLE ROW LEVEL SECURITY;

-- Public can read (for validation)
CREATE POLICY "Public can read blocked domains"
ON public.blocked_email_domains
FOR SELECT
USING (true);

-- Only admins can manage
CREATE POLICY "Admins can manage blocked domains"
ON public.blocked_email_domains
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Insert common disposable email domains
INSERT INTO public.blocked_email_domains (domain) VALUES
  ('tempmail.com'),
  ('guerrillamail.com'),
  ('10minutemail.com'),
  ('throwaway.email'),
  ('mailinator.com'),
  ('temp-mail.org'),
  ('fakeinbox.com'),
  ('getnada.com'),
  ('maildrop.cc'),
  ('dispostable.com'),
  ('tempail.com'),
  ('yopmail.com'),
  ('sharklasers.com'),
  ('trashmail.com'),
  ('mohmal.com'),
  ('emailondeck.com'),
  ('tempr.email'),
  ('tempmailo.com'),
  ('burnermail.io'),
  ('throam.com');

-- Function to check if registration is allowed
CREATE OR REPLACE FUNCTION public.check_registration_allowed(
  p_ip_address TEXT,
  p_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ip_count INTEGER;
  email_domain TEXT;
  is_blocked BOOLEAN;
  max_accounts_per_ip INTEGER := 3;
BEGIN
  -- Extract email domain
  email_domain := split_part(p_email, '@', 2);
  
  -- Check if email domain is blocked
  SELECT EXISTS(
    SELECT 1 FROM public.blocked_email_domains WHERE domain = email_domain
  ) INTO is_blocked;
  
  IF is_blocked THEN
    RETURN json_build_object(
      'allowed', false,
      'reason', 'blocked_email_domain',
      'message', 'This email domain is not allowed. Please use a different email.'
    );
  END IF;
  
  -- Count registrations from this IP in last 24 hours
  SELECT COUNT(*) INTO ip_count
  FROM public.registration_tracking
  WHERE ip_address = p_ip_address
    AND created_at > now() - interval '24 hours';
  
  IF ip_count >= max_accounts_per_ip THEN
    RETURN json_build_object(
      'allowed', false,
      'reason', 'ip_limit_exceeded',
      'message', 'Too many accounts created from this network. Please try again later.'
    );
  END IF;
  
  RETURN json_build_object(
    'allowed', true,
    'remaining', max_accounts_per_ip - ip_count
  );
END;
$$;

-- Function to record registration
CREATE OR REPLACE FUNCTION public.record_registration(
  p_ip_address TEXT,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.registration_tracking (ip_address, user_id)
  VALUES (p_ip_address, p_user_id);
END;
$$;