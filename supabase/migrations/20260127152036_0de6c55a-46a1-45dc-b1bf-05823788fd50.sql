-- Allow therapist registrations also for anonymous visitors (therapists are not logged in yet)
-- Replace the previous INSERT policy
DROP POLICY IF EXISTS "Authenticated users can register as therapist" ON public.therapist_registrations;

CREATE POLICY "Anyone can register as therapist"
ON public.therapist_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL AND length(trim(email)) > 3 AND
  full_name IS NOT NULL AND length(trim(full_name)) > 1 AND
  specialization IS NOT NULL AND length(trim(specialization)) > 0 AND
  years_of_experience IS NOT NULL
);
