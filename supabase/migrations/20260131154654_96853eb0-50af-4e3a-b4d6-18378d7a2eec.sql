
-- Fix the redundant RLS policy on therapist_registrations
-- The "Users can view their own registration" policy has an unnecessary OR condition for admins
-- which is already covered by a separate admin-only policy

-- Drop the existing policy with redundant condition
DROP POLICY IF EXISTS "Users can view their own registration" ON public.therapist_registrations;

-- Recreate with only the user-specific condition (admins already have access via their own policy)
CREATE POLICY "Users can view their own registration" 
ON public.therapist_registrations 
FOR SELECT 
USING (auth.uid() = user_id);
