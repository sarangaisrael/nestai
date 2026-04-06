-- Fix conflicting RLS policies on subscriptions table
-- Drop the conflicting "deny anonymous" policy and keep only user-specific access

DROP POLICY IF EXISTS "Deny anonymous access to subscriptions" ON public.subscriptions;

-- The remaining policies already handle access correctly:
-- - Users can view their own subscriptions (SELECT where auth.uid() = user_id)
-- - Users can insert/update/delete their own subscriptions