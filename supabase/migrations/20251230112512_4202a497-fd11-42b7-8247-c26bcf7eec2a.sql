-- Remove the admin SELECT policy that exposes sensitive credentials
DROP POLICY IF EXISTS "Admins can view all push subscriptions" ON public.push_subscriptions;

-- Create a security definer function that returns only non-sensitive data for admin listing
-- This function bypasses RLS but only exposes safe columns
CREATE OR REPLACE FUNCTION public.get_admin_push_subscriptions()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ps.id, ps.user_id, ps.created_at
  FROM public.push_subscriptions ps
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
  ORDER BY ps.created_at DESC
$$;

-- Create a function to get the count of push subscriptions for admins
CREATE OR REPLACE FUNCTION public.get_admin_push_subscription_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::bigint
  FROM public.push_subscriptions
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
$$;