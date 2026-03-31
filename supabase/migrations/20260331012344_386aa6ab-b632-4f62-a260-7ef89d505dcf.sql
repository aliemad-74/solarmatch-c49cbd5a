
-- 1. Create a rate-limiting table for lead submissions
CREATE TABLE IF NOT EXISTS public.lead_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_lead_rate_limits_ip_created ON public.lead_rate_limits (ip_hash, created_at);

-- Enable RLS (deny all direct access - only used by trigger)
ALTER TABLE public.lead_rate_limits ENABLE ROW LEVEL SECURITY;

-- 2. Create rate-limiting function for leads
CREATE OR REPLACE FUNCTION public.check_lead_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
  max_per_hour INTEGER := 5;
BEGIN
  -- Count recent submissions (last hour) - uses email as identifier since we don't have IP in leads
  SELECT COUNT(*) INTO recent_count
  FROM public.leads
  WHERE email = NEW.email
    AND created_at > now() - interval '1 hour';

  IF recent_count >= max_per_hour THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Attach trigger to leads table
CREATE TRIGGER check_lead_rate_limit_trigger
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.check_lead_rate_limit();

-- 4. Tighten solar_assessments INSERT policy to restrict what anonymous users can set
-- The WITH CHECK (true) is overly permissive. Replace with a more restrictive policy.
DROP POLICY IF EXISTS "Anyone can insert assessments" ON public.solar_assessments;

CREATE POLICY "Anon and auth can insert assessments"
  ON public.solar_assessments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    latitude IS NOT NULL
    AND longitude IS NOT NULL
    AND latitude BETWEEN -90 AND 90
    AND longitude BETWEEN -180 AND 180
  );
