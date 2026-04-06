-- Add restrictive RLS policies for user_roles table to prevent privilege escalation
-- Only admins should be able to manage roles, and this should be done via service role

-- Deny all user INSERT on user_roles (only service role can insert)
CREATE POLICY "Deny user inserts on user_roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (false);

-- Deny all user UPDATE on user_roles (only service role can update)
CREATE POLICY "Deny user updates on user_roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (false);

-- Deny all user DELETE on user_roles (only service role can delete)
CREATE POLICY "Deny user deletes on user_roles" 
ON public.user_roles 
FOR DELETE 
TO authenticated
USING (false);