-- Revert: Don't allow users to self-assign therapist role
DROP POLICY IF EXISTS "Users can add therapist role to themselves" ON public.user_roles;

-- Restore the deny policy
CREATE POLICY "Deny user inserts on user_roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Add user_id field to therapist_registrations to link to existing accounts
ALTER TABLE public.therapist_registrations 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
ADD COLUMN IF NOT EXISTS reviewed_by uuid;

-- Allow admins to update therapist registrations (for approval)
DROP POLICY IF EXISTS "Only admins can update therapist registrations" ON public.therapist_registrations;
CREATE POLICY "Admins can update therapist registrations"
ON public.therapist_registrations
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete therapist registrations
DROP POLICY IF EXISTS "Admins can delete therapist registrations" ON public.therapist_registrations;
CREATE POLICY "Admins can delete therapist registrations"
ON public.therapist_registrations
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));