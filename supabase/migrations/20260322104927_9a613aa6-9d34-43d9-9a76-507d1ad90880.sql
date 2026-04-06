-- Grandfather all existing users as permanently active before the billing rollout cutoff.
DO $$
DECLARE
  v_cutoff timestamptz := TIMESTAMPTZ '2026-03-22 23:59:59+02';
BEGIN
  UPDATE public.user_access_statuses
  SET payment_status = 'active'::public.access_payment_status,
      updated_at = now()
  WHERE registration_date <= v_cutoff
    AND payment_status <> 'active'::public.access_payment_status;
END $$;

CREATE OR REPLACE FUNCTION public.initialize_user_access(
  p_role public.access_role,
  p_therapist_code text DEFAULT NULL::text
)
RETURNS TABLE(
  user_id uuid,
  role public.access_role,
  payment_status public.access_payment_status,
  trial_ends_at timestamp with time zone,
  linked_therapist_id uuid,
  therapist_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing public.user_access_statuses%ROWTYPE;
  v_clean_code text := NULLIF(trim(coalesce(p_therapist_code, '')), '');
  v_linked_therapist_id uuid := NULL;
  v_generated_code text := NULL;
  v_cutoff constant timestamptz := TIMESTAMPTZ '2026-03-22 23:59:59+02';
  v_auth_created_at timestamptz := NULL;
  v_initial_payment_status public.access_payment_status := 'trial'::public.access_payment_status;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_role IS NULL THEN
    RAISE EXCEPTION 'Role is required';
  END IF;

  SELECT au.created_at
  INTO v_auth_created_at
  FROM auth.users au
  WHERE au.id = v_user_id;

  IF v_auth_created_at IS NOT NULL AND v_auth_created_at <= v_cutoff THEN
    v_initial_payment_status := 'active'::public.access_payment_status;
  END IF;

  IF v_clean_code IS NOT NULL THEN
    IF v_clean_code !~ '^[0-9]{6}$' THEN
      RAISE EXCEPTION 'Therapist code must be exactly 6 digits';
    END IF;

    SELECT uas.user_id
    INTO v_linked_therapist_id
    FROM public.user_access_statuses AS uas
    WHERE uas.role = 'therapist'
      AND uas.therapist_code = v_clean_code
    LIMIT 1;

    IF v_linked_therapist_id IS NULL THEN
      RAISE EXCEPTION 'Invalid therapist code';
    END IF;
  END IF;

  IF p_role = 'therapist' AND v_clean_code IS NOT NULL THEN
    RAISE EXCEPTION 'Therapists cannot register with a therapist code';
  END IF;

  SELECT *
  INTO v_existing
  FROM public.user_access_statuses AS uas
  WHERE uas.user_id = v_user_id
  FOR UPDATE;

  IF p_role = 'therapist' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'therapist'::public.app_role)
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'user'::public.app_role)
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_existing.user_id IS NULL THEN
    IF p_role = 'therapist' THEN
      v_generated_code := public.generate_unique_therapist_code();
    END IF;

    INSERT INTO public.user_access_statuses (
      user_id,
      role,
      payment_status,
      linked_therapist_id,
      therapist_code
    ) VALUES (
      v_user_id,
      p_role,
      v_initial_payment_status,
      CASE WHEN p_role = 'patient' THEN v_linked_therapist_id ELSE NULL END,
      CASE WHEN p_role = 'therapist' THEN v_generated_code ELSE NULL END
    )
    RETURNING * INTO v_existing;
  ELSE
    IF v_existing.role <> p_role THEN
      RAISE EXCEPTION 'Account role already set and cannot be changed';
    END IF;

    IF p_role = 'patient' AND v_linked_therapist_id IS NOT NULL AND v_existing.linked_therapist_id IS NULL THEN
      UPDATE public.user_access_statuses AS uas
      SET linked_therapist_id = v_linked_therapist_id,
          updated_at = now()
      WHERE uas.user_id = v_user_id
      RETURNING * INTO v_existing;
    END IF;

    IF v_existing.payment_status <> 'active'::public.access_payment_status
       AND v_auth_created_at IS NOT NULL
       AND v_auth_created_at <= v_cutoff THEN
      UPDATE public.user_access_statuses AS uas
      SET payment_status = 'active'::public.access_payment_status,
          updated_at = now()
      WHERE uas.user_id = v_user_id
      RETURNING * INTO v_existing;
    END IF;
  END IF;

  RETURN QUERY
  SELECT v_existing.user_id, v_existing.role, v_existing.payment_status, v_existing.trial_ends_at, v_existing.linked_therapist_id, v_existing.therapist_code;
END;
$function$;