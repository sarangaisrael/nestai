
-- Fix push_subscriptions: Remove admin delete policy that could expose data
-- The issue is admins shouldn't be able to see/access other users' push subscription details
DROP POLICY IF EXISTS "Admins can delete any push subscription" ON public.push_subscriptions;

-- Create a more secure admin policy - admins can only delete via service role in edge functions
-- not directly through client

-- Fix subscriptions table: The "Service role can update all subscriptions" policy
-- should only work for service_role, not authenticated users
DROP POLICY IF EXISTS "Service role can update all subscriptions" ON public.subscriptions;

-- The service role bypass RLS by default when using service_role key
-- So we don't need an explicit policy for it - it will work automatically
-- This removes the security hole where the policy was too permissive
