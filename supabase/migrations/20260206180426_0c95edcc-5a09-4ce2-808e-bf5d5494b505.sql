-- Create a function to get public stats for the counter
-- This runs with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_reports INTEGER;
  total_kw NUMERIC;
BEGIN
  -- Count all reports
  SELECT COUNT(*) INTO total_reports FROM report_history;
  
  -- Sum all system sizes
  SELECT COALESCE(SUM(system_size_kw), 0) INTO total_kw FROM report_history;
  
  RETURN json_build_object(
    'reports', total_reports,
    'totalKw', ROUND(total_kw)
  );
END;
$$;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO authenticated;