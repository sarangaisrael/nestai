-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view system messages" ON public.system_messages;

-- Create a new policy that only allows admins to view system messages
CREATE POLICY "Only admins can view system messages" 
ON public.system_messages 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));