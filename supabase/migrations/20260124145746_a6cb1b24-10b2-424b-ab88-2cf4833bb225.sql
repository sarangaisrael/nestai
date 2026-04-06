-- Allow users to insert their own therapist role
DROP POLICY IF EXISTS "Deny user inserts on user_roles" ON public.user_roles;

CREATE POLICY "Users can add therapist role to themselves"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'therapist'
);

-- Keep restriction on update and delete
-- (existing policies "Deny user updates on user_roles" and "Deny user deletes on user_roles" remain)