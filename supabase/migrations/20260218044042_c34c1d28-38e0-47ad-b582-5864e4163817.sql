
-- Allow anyone to read system_messages (public content)
CREATE POLICY "Anyone can view system messages"
ON public.system_messages
FOR SELECT
USING (true);
