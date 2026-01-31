-- Create leads table to store contact form submissions
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  preferred_contact TEXT NOT NULL DEFAULT 'call',
  best_time TEXT NOT NULL DEFAULT 'morning',
  location_name TEXT,
  rooftop_area NUMERIC,
  kw_installed NUMERIC,
  estimated_cost NUMERIC,
  estimated_savings NUMERIC,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert leads (public form)
CREATE POLICY "Anyone can submit a lead"
  ON public.leads
  FOR INSERT
  WITH CHECK (true);

-- Deny all SELECT from client (protect data)
CREATE POLICY "No public read access"
  ON public.leads
  FOR SELECT
  USING (false);