-- Add explicit DENY policies for summary_logs table
-- Users should only be able to SELECT their own logs, never modify them

-- Deny INSERT for all users (only service role can insert)
CREATE POLICY "Deny user inserts on summary_logs"
ON public.summary_logs
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Deny UPDATE for all users (audit logs should be immutable)
CREATE POLICY "Deny user updates on summary_logs"
ON public.summary_logs
FOR UPDATE
TO authenticated
USING (false);

-- Deny DELETE for all users (audit logs should never be deleted by users)
CREATE POLICY "Deny user deletes on summary_logs"
ON public.summary_logs
FOR DELETE
TO authenticated
USING (false);