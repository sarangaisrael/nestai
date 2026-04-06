CREATE OR REPLACE FUNCTION public.submit_therapist_registration(
  p_full_name text,
  p_email text,
  p_specialization text,
  p_years_of_experience integer,
  p_license_number text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  status text,
  created_at timestamptz,
  reviewed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name text := btrim(coalesce(p_full_name, ''));
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_specialization text := btrim(coalesce(p_specialization, ''));
  v_license_number text := nullif(btrim(coalesce(p_license_number, '')), '');
  v_existing public.therapist_registrations%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF length(v_full_name) < 2 OR length(v_full_name) > 120 THEN
    RAISE EXCEPTION 'Full name must be between 2 and 120 characters';
  END IF;

  IF v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' OR length(v_email) > 255 THEN
    RAISE EXCEPTION 'Invalid email address';
  END IF;

  IF length(v_specialization) < 2 OR length(v_specialization) > 120 THEN
    RAISE EXCEPTION 'Specialization must be between 2 and 120 characters';
  END IF;

  IF p_years_of_experience IS NULL OR p_years_of_experience < 0 OR p_years_of_experience > 80 THEN
    RAISE EXCEPTION 'Years of experience must be between 0 and 80';
  END IF;

  IF v_license_number IS NOT NULL AND length(v_license_number) > 80 THEN
    RAISE EXCEPTION 'License number must be 80 characters or less';
  END IF;

  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admins cannot apply as therapists';
  END IF;

  SELECT *
  INTO v_existing
  FROM public.therapist_registrations tr
  WHERE tr.user_id = auth.uid()
  ORDER BY tr.created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF FOUND AND coalesce(v_existing.status, 'pending') = 'approved' THEN
    RETURN QUERY
    SELECT v_existing.id, 'approved'::text, v_existing.created_at, v_existing.reviewed_at;
    RETURN;
  END IF;

  IF FOUND THEN
    UPDATE public.therapist_registrations
    SET full_name = v_full_name,
        email = v_email,
        specialization = v_specialization,
        years_of_experience = p_years_of_experience,
        license_number = v_license_number,
        status = 'pending',
        reviewed_at = NULL,
        reviewed_by = NULL
    WHERE therapist_registrations.id = v_existing.id
    RETURNING therapist_registrations.id, therapist_registrations.status, therapist_registrations.created_at, therapist_registrations.reviewed_at
    INTO v_existing.id, v_existing.status, v_existing.created_at, v_existing.reviewed_at;

    RETURN QUERY
    SELECT v_existing.id, coalesce(v_existing.status, 'pending'), v_existing.created_at, v_existing.reviewed_at;
    RETURN;
  END IF;

  INSERT INTO public.therapist_registrations (
    user_id,
    full_name,
    email,
    specialization,
    years_of_experience,
    license_number,
    status
  ) VALUES (
    auth.uid(),
    v_full_name,
    v_email,
    v_specialization,
    p_years_of_experience,
    v_license_number,
    'pending'
  )
  RETURNING therapist_registrations.id, therapist_registrations.status, therapist_registrations.created_at, therapist_registrations.reviewed_at
  INTO v_existing.id, v_existing.status, v_existing.created_at, v_existing.reviewed_at;

  RETURN QUERY
  SELECT v_existing.id, coalesce(v_existing.status, 'pending'), v_existing.created_at, v_existing.reviewed_at;
END;
$$;