-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can register as therapist" ON public.therapist_registrations;

-- Create a PERMISSIVE policy that allows authenticated users to insert
CREATE POLICY "Authenticated users can register as therapist"
ON public.therapist_registrations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);