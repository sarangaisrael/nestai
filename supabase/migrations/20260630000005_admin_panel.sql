-- Admin panel support: RLS policies + secure RPCs
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Allow admins to read ALL subscriptions (users still see only their own)
CREATE POLICY "subscriptions: admin read all"
  ON public.subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Allow admins to update ALL subscriptions
CREATE POLICY "subscriptions: admin update all"
  ON public.subscriptions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. RPC: return all users + subscription data
--    SECURITY DEFINER so it can read auth.users (not accessible to anon/authenticated)
--    Server-side admin check: raises exception if caller is not admin
CREATE OR REPLACE FUNCTION public.admin_get_users_with_subscriptions()
RETURNS TABLE(
  user_id      uuid,
  email        text,
  registered_at timestamptz,
  plan         text,
  is_active    boolean,
  expires_at   timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    u.id                              AS user_id,
    u.email                           AS email,
    u.created_at                      AS registered_at,
    COALESCE(s.plan, 'none')          AS plan,
    COALESCE(s.is_active, false)      AS is_active,
    s.expires_at                      AS expires_at
  FROM auth.users u
  LEFT JOIN public.subscriptions s ON s.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

-- 4. RPC: approve a subscription + write audit log atomically
--    Server-side admin check built-in; audit INSERT works because SECURITY DEFINER
--    bypasses the audit_logs RLS (which blocks direct user inserts by design)
CREATE OR REPLACE FUNCTION public.admin_approve_subscription(p_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
BEGIN
  IF NOT public.has_role(v_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  -- Delegate to existing function (handles upsert + expiry logic)
  PERFORM public.admin_set_user_subscription(p_target_user_id, 'monthly', NULL);

  -- Immutable audit trail
  INSERT INTO public.audit_logs (
    action_type, table_name, record_id,
    user_id, accessed_by, accessor_id, details
  ) VALUES (
    'write', 'subscriptions', p_target_user_id,
    p_target_user_id, 'admin', v_admin_id,
    jsonb_build_object(
      'action', 'approve_subscription',
      'plan',   'monthly',
      'granted_at', now()
    )
  );
END;
$$;
