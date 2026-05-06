ALTER TABLE public.solar_assessments
  ADD COLUMN IF NOT EXISTS vision_usable_area_ratio NUMERIC,
  ADD COLUMN IF NOT EXISTS vision_obstacles_count INTEGER,
  ADD COLUMN IF NOT EXISTS vision_shading_level TEXT,
  ADD COLUMN IF NOT EXISTS vision_confidence TEXT;