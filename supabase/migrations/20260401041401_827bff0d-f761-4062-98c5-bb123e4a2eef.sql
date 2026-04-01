
CREATE TABLE public.market_data (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_urls text[] DEFAULT '{}',
  scraped_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;

-- Anyone can read market data (public prices)
CREATE POLICY "Public can read market data"
ON public.market_data
FOR SELECT
TO anon, authenticated
USING (true);

-- Only service role can insert/update (edge functions)
CREATE POLICY "No public insert on market data"
ON public.market_data
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "No public update on market data"
ON public.market_data
FOR UPDATE
TO anon, authenticated
USING (false);

CREATE POLICY "No public delete on market data"
ON public.market_data
FOR DELETE
TO anon, authenticated
USING (false);

-- Create index for fast lookups
CREATE INDEX idx_market_data_type_scraped ON public.market_data (type, scraped_at DESC);
