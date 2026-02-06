-- Fix the INSERT policy to be more restrictive
-- Only authenticated users or system functions can insert tracking records
DROP POLICY "System can insert tracking" ON public.registration_tracking;

-- The insert is done via security definer function, so we deny direct inserts
CREATE POLICY "No direct insert on tracking"
ON public.registration_tracking
FOR INSERT
WITH CHECK (false);

-- Add policy for authenticated users to see their own registration
CREATE POLICY "Users can see own registration"
ON public.registration_tracking
FOR SELECT
USING (auth.uid() = user_id);