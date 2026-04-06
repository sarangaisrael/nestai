-- Add policy allowing users to view their own therapist registration
CREATE POLICY "Users can view their own registration"
ON public.therapist_registrations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));