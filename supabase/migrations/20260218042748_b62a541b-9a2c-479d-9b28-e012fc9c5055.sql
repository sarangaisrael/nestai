
-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all weekly summaries
CREATE POLICY "Admins can view all summaries"
ON public.weekly_summaries
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Function to get all users with emails (admin only)
CREATE OR REPLACE FUNCTION public.get_admin_all_users()
RETURNS TABLE(user_id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT au.id as user_id, au.email::text, au.created_at, au.last_sign_in_at
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$$;
