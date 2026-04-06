-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Service can insert summary logs" ON public.summary_logs;

-- Ensure RLS is enabled (the edge function uses service role key which bypasses RLS)
ALTER TABLE public.summary_logs ENABLE ROW LEVEL SECURITY;

-- The existing SELECT policy for users to view their own logs remains:
-- "Users can view their own summary logs" - SELECT using (auth.uid() = user_id)