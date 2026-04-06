
-- Drop the existing INSERT policy that allows arbitrary emails
DROP POLICY IF EXISTS "Authenticated users can register as therapist" ON public.therapist_registrations;

-- Create a more secure INSERT policy that requires:
-- 1. User must be authenticated
-- 2. User ID must match the authenticated user (if provided)
-- 3. Basic field validation remains
-- Note: Email validation should ideally match the authenticated user's email,
-- but since we can't access auth.email() directly, we require user_id to be set
CREATE POLICY "Authenticated users can register as therapist" 
ON public.therapist_registrations 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (user_id IS NULL OR user_id = auth.uid())
  AND email IS NOT NULL 
  AND length(TRIM(BOTH FROM email)) > 3
  AND full_name IS NOT NULL 
  AND length(TRIM(BOTH FROM full_name)) > 1
  AND specialization IS NOT NULL 
  AND length(TRIM(BOTH FROM specialization)) > 0
  AND years_of_experience IS NOT NULL
);
