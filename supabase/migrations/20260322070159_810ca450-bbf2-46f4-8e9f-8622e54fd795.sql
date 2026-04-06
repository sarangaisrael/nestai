CREATE OR REPLACE FUNCTION public.admin_review_therapist_registration(
  p_registration_id uuid,
  p_approve boolean
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  full_name text,
  status text,
  reviewed_at timestamptz,
  reviewed_by uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_registration public.therapist_registrations%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT *
  INTO v_registration
  FROM public.therapist_registrations
  WHERE therapist_registrations.id = p_registration_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Therapist registration not found';
  END IF;

  UPDATE public.therapist_registrations
  SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
      reviewed_at = now(),
      reviewed_by = auth.uid()
  WHERE therapist_registrations.id = p_registration_id
  RETURNING * INTO v_registration;

  IF p_approve AND v_registration.user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_registration.user_id, 'therapist'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN QUERY
  SELECT
    v_registration.id,
    v_registration.user_id,
    v_registration.email,
    v_registration.full_name,
    COALESCE(v_registration.status, 'pending'),
    v_registration.reviewed_at,
    v_registration.reviewed_by;
END;
$$;