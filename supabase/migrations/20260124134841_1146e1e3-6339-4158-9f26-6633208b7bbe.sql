-- 1. Fix therapist_registrations: Require authentication for INSERT
DROP POLICY IF EXISTS "Anyone can register as therapist" ON public.therapist_registrations;

CREATE POLICY "Authenticated users can register as therapist" 
ON public.therapist_registrations 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Fix summary_logs: Only service role can insert (already correct - deny user inserts)
-- The existing policy "Deny user inserts on summary_logs" with WITH CHECK (false) is correct
-- No changes needed for summary_logs

-- 3. Verify all other tables have proper RLS (checking for any WITH CHECK (true) or USING (true))
-- Based on the schema, the policies are already properly configured with auth.uid() = user_id checks