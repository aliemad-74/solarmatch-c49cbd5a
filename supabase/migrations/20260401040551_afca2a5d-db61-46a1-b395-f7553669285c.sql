-- Add RLS policies to lead_rate_limits table
-- Block all public/anon/authenticated access since only service role needs it

CREATE POLICY "No public select on rate limits"
ON public.lead_rate_limits
FOR SELECT
TO anon, authenticated
USING (false);

CREATE POLICY "No public insert on rate limits"
ON public.lead_rate_limits
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "No public update on rate limits"
ON public.lead_rate_limits
FOR UPDATE
TO anon, authenticated
USING (false);

CREATE POLICY "No public delete on rate limits"
ON public.lead_rate_limits
FOR DELETE
TO anon, authenticated
USING (false);