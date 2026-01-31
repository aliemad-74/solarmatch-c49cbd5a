-- Add CHECK constraints for input validation on leads table
-- Using validation triggers instead of CHECK constraints for more flexibility

-- Create a validation function for leads
CREATE OR REPLACE FUNCTION public.validate_lead_input()
RETURNS TRIGGER AS $$
BEGIN
  -- Email format validation
  IF NEW.email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Phone format validation (7-20 digits with optional +, -, spaces, parentheses)
  IF NEW.phone !~ '^[0-9+\-\(\) ]{7,20}$' THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;
  
  -- Name length validation
  IF length(NEW.name) < 2 OR length(NEW.name) > 200 THEN
    RAISE EXCEPTION 'Name must be between 2 and 200 characters';
  END IF;
  
  -- Email length validation
  IF length(NEW.email) > 255 THEN
    RAISE EXCEPTION 'Email must be less than 255 characters';
  END IF;
  
  -- Validate numeric fields if provided
  IF NEW.rooftop_area IS NOT NULL AND (NEW.rooftop_area <= 0 OR NEW.rooftop_area > 1000000) THEN
    RAISE EXCEPTION 'Rooftop area must be between 0 and 1,000,000';
  END IF;
  
  IF NEW.kw_installed IS NOT NULL AND (NEW.kw_installed <= 0 OR NEW.kw_installed > 10000) THEN
    RAISE EXCEPTION 'kW installed must be between 0 and 10,000';
  END IF;
  
  IF NEW.estimated_cost IS NOT NULL AND (NEW.estimated_cost < 0 OR NEW.estimated_cost > 100000000) THEN
    RAISE EXCEPTION 'Estimated cost must be between 0 and 100,000,000';
  END IF;
  
  IF NEW.estimated_savings IS NOT NULL AND (NEW.estimated_savings < 0 OR NEW.estimated_savings > 100000000) THEN
    RAISE EXCEPTION 'Estimated savings must be between 0 and 100,000,000';
  END IF;
  
  -- Location name length validation
  IF NEW.location_name IS NOT NULL AND length(NEW.location_name) > 500 THEN
    RAISE EXCEPTION 'Location name must be less than 500 characters';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for lead validation
DROP TRIGGER IF EXISTS validate_lead_before_insert ON public.leads;
CREATE TRIGGER validate_lead_before_insert
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_lead_input();

-- Also validate on update
DROP TRIGGER IF EXISTS validate_lead_before_update ON public.leads;
CREATE TRIGGER validate_lead_before_update
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_lead_input();

-- Update has_role function to be more secure (restrict checking other users' roles)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Users can only check their own roles, unless they are an admin
  IF _user_id != auth.uid() THEN
    -- Check if calling user is an admin
    IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$$;

-- Add comment explaining why SECURITY DEFINER is necessary
COMMENT ON FUNCTION public.has_role IS 'Checks if a user has a specific role. Uses SECURITY DEFINER to avoid RLS recursion when used in policies. Users can only check their own roles unless they are an admin.';