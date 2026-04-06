
CREATE OR REPLACE FUNCTION public.get_my_access_state()
 RETURNS TABLE(user_id uuid, role access_role, stored_payment_status access_payment_status, effective_payment_status access_payment_status, registration_date timestamp with time zone, trial_ends_at timestamp with time zone, linked_therapist_id uuid, therapist_code text, covered_by_therapist boolean, can_submit_payment_request boolean, is_locked boolean, lock_message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_access public.user_access_statuses%ROWTYPE;
  v_therapist public.user_access_statuses%ROWTYPE;
  v_effective public.access_payment_status;
  v_lock_message text := NULL;
  v_covered boolean := false;
  v_can_request boolean := true;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT *
  INTO v_access
  FROM public.user_access_statuses
  WHERE public.user_access_statuses.user_id = v_user_id;

  IF v_access.user_id IS NULL THEN
    RAISE EXCEPTION 'Access profile not initialized';
  END IF;

  IF v_access.linked_therapist_id IS NOT NULL THEN
    SELECT *
    INTO v_therapist
    FROM public.user_access_statuses
    WHERE public.user_access_statuses.user_id = v_access.linked_therapist_id;
  END IF;

  IF v_access.role = 'therapist' THEN
    IF v_access.payment_status = 'active' THEN
      v_effective := 'active';
    ELSIF now() <= v_access.trial_ends_at THEN
      v_effective := 'trial';
    ELSE
      v_effective := 'locked';
      v_lock_message := 'תקופת הניסיון של 30 הימים הסתיימה. יש לשלוח בקשת תשלום כדי לחדש גישה שנתית בעלות 300 ש״ח.';
    END IF;
  ELSE
    IF v_access.linked_therapist_id IS NOT NULL AND v_therapist.user_id IS NOT NULL AND v_therapist.payment_status = 'active' THEN
      v_effective := 'active';
      v_covered := true;
    ELSIF v_access.payment_status = 'active' THEN
      v_effective := 'active';
    ELSIF now() <= v_access.trial_ends_at THEN
      v_effective := 'trial';
    ELSE
      v_effective := 'locked';
      IF v_access.linked_therapist_id IS NOT NULL THEN
        v_lock_message := 'יש ליצור קשר עם המטפל/ת שלך כדי לחדש את הגישה ל-NestAI.';
        v_can_request := false;
      ELSE
        v_lock_message := 'תקופת הניסיון של 30 הימים הסתיימה. יש לשלוח בקשת תשלום כדי לחדש גישה בעלות 20 ש״ח.';
      END IF;
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    v_access.user_id,
    v_access.role,
    v_access.payment_status,
    v_effective,
    v_access.registration_date,
    v_access.trial_ends_at,
    v_access.linked_therapist_id,
    v_access.therapist_code,
    v_covered,
    v_can_request,
    (v_effective = 'locked'),
    v_lock_message;
END;
$function$;
