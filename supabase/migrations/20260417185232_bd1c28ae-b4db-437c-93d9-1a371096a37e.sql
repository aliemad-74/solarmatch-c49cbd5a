
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_type text NOT NULL DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS agreed_to_terms boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS agreed_at timestamptz,
ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT true;
