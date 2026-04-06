-- Drop the existing permissive public policy
DROP POLICY IF EXISTS "Anyone can view system messages" ON public.system_messages;

-- Create new policy that requires authentication
CREATE POLICY "Authenticated users can view system messages" 
ON public.system_messages 
FOR SELECT 
TO authenticated
USING (true);