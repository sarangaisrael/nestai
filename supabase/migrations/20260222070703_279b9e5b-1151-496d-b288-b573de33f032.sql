-- Remove the redundant broad SELECT policy that could cause confusion
DROP POLICY IF EXISTS "Deny anonymous access to push_subscriptions" ON public.push_subscriptions;