
CREATE TABLE public.page_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  ip_address text,
  user_agent text,
  device_type text,
  browser text,
  os text,
  path text NOT NULL,
  referrer text,
  language text,
  screen_size text,
  country text,
  city text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_page_visits_created_at ON public.page_visits(created_at DESC);
CREATE INDEX idx_page_visits_session ON public.page_visits(session_id);
CREATE INDEX idx_page_visits_path ON public.page_visits(path);

ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert visits"
ON public.page_visits FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view visits"
ON public.page_visits FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete visits"
ON public.page_visits FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
