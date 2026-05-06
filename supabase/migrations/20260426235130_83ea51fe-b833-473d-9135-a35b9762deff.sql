ALTER TABLE public.solar_assessments
  ADD COLUMN IF NOT EXISTS aqi_value INTEGER,
  ADD COLUMN IF NOT EXISTS dominant_pollutant TEXT,
  ADD COLUMN IF NOT EXISTS pollen_dust_index INTEGER,
  ADD COLUMN IF NOT EXISTS soiling_loss_applied NUMERIC;