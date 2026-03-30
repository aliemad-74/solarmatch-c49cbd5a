CREATE TABLE public.solar_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  city text,
  governorate text,
  formatted_address text,
  building_type text,
  pv_package text,
  monthly_consumption numeric,
  rooftop_area numeric,
  system_size_kw numeric,
  annual_production numeric,
  annual_savings numeric,
  payback_years numeric,
  total_cost numeric,
  coverage_ratio numeric,
  co2_saved numeric,
  feasibility text,
  aqi integer,
  elevation numeric,
  data_source text,
  dust_efficiency_loss numeric,
  temperature numeric,
  cloud_cover numeric,
  ai_recommendation text,
  ai_confidence text,
  user_id uuid,
  farm_mode boolean DEFAULT false,
  area_in_feddans numeric
);

ALTER TABLE public.solar_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert assessments"
  ON public.solar_assessments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view assessments"
  ON public.solar_assessments FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own assessments"
  ON public.solar_assessments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);