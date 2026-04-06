-- Drop the existing overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can register as therapist" ON public.therapist_registrations;

-- Create a new INSERT policy that requires authentication
CREATE POLICY "Authenticated users can register as therapist"
ON public.therapist_registrations
FOR INSERT
TO authenticated
WITH CHECK (
  email IS NOT NULL 
  AND length(TRIM(BOTH FROM email)) > 3 
  AND full_name IS NOT NULL 
  AND length(TRIM(BOTH FROM full_name)) > 1 
  AND specialization IS NOT NULL 
  AND length(TRIM(BOTH FROM specialization)) > 0 
  AND years_of_experience IS NOT NULL
);

-- Add explicit deny for anonymous SELECT (extra safety layer)
CREATE POLICY "Deny anonymous access to therapist_registrations"
ON public.therapist_registrations
FOR SELECT
TO anon
USING (false);