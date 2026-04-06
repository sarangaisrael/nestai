-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view system messages" ON public.system_messages;

-- Add authenticated-only SELECT policy (admins already have their own policy)
CREATE POLICY "Authenticated users can view system messages"
ON public.system_messages
FOR SELECT
TO authenticated
USING (true);