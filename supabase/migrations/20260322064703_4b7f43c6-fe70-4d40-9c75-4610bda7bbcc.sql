CREATE OR REPLACE FUNCTION public.is_approved_therapist(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'therapist'::public.app_role)
    AND EXISTS (
      SELECT 1
      FROM public.therapist_registrations tr
      WHERE tr.user_id = _user_id
        AND tr.status = 'approved'
    );
$$;

CREATE OR REPLACE FUNCTION public.send_therapist_patient_message(
  p_patient_id uuid,
  p_title text,
  p_body text,
  p_message_type text DEFAULT 'update'::text,
  p_link text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message_id UUID;
  v_kind TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_approved_therapist(auth.uid()) THEN
    RAISE EXCEPTION 'Approved therapist access required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.therapist_patients tp
    WHERE tp.therapist_id = auth.uid()
      AND tp.patient_id = p_patient_id
      AND tp.status = 'connected'
  ) THEN
    RAISE EXCEPTION 'Patient access denied';
  END IF;

  IF NULLIF(BTRIM(COALESCE(p_title, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Title is required';
  END IF;

  IF NULLIF(BTRIM(COALESCE(p_body, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Body is required';
  END IF;

  v_kind := CASE WHEN LOWER(COALESCE(p_message_type, 'update')) = 'task' THEN 'task' ELSE 'update' END;

  INSERT INTO public.therapist_patient_messages (
    therapist_id,
    patient_id,
    message_type,
    title,
    body,
    link
  ) VALUES (
    auth.uid(),
    p_patient_id,
    v_kind,
    BTRIM(p_title),
    BTRIM(p_body),
    NULLIF(BTRIM(COALESCE(p_link, '')), '')
  )
  RETURNING id INTO v_message_id;

  INSERT INTO public.user_notifications (
    user_id,
    title,
    body,
    link,
    type
  ) VALUES (
    p_patient_id,
    BTRIM(p_title),
    BTRIM(p_body),
    NULLIF(BTRIM(COALESCE(p_link, '')), ''),
    CASE WHEN v_kind = 'task' THEN 'therapist_task' ELSE 'therapist_update' END
  );

  RETURN v_message_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_therapist_patients_dashboard()
RETURNS TABLE(
  connection_id uuid,
  patient_id uuid,
  patient_name text,
  connected_at timestamp with time zone,
  invite_code text,
  recent_activity_at timestamp with time zone,
  weekly_summary_count bigint,
  monthly_summary_count bigint,
  engagement_score integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_approved_therapist(auth.uid()) THEN
    RAISE EXCEPTION 'Approved therapist access required';
  END IF;

  RETURN QUERY
  WITH connected_patients AS (
    SELECT
      tp.id,
      tp.patient_id,
      COALESCE(NULLIF(BTRIM(tp.patient_name), ''), NULLIF(BTRIM(p.first_name), ''), 'מטופל/ת') AS patient_name,
      tp.connected_at,
      tp.invite_code
    FROM public.therapist_patients tp
    LEFT JOIN public.profiles p ON p.user_id = tp.patient_id
    WHERE tp.therapist_id = auth.uid()
      AND tp.status = 'connected'
      AND tp.patient_id IS NOT NULL
  ),
  patient_stats AS (
    SELECT
      cp.patient_id,
      CASE
        WHEN GREATEST(
          COALESCE((SELECT MAX(m.created_at) FROM public.messages m WHERE m.user_id = cp.patient_id AND m.role = 'user'), '-infinity'::timestamptz),
          COALESCE((SELECT MAX(me.created_at) FROM public.mood_entries me WHERE me.user_id = cp.patient_id), '-infinity'::timestamptz),
          COALESCE((SELECT MAX(ws.created_at) FROM public.weekly_summaries ws WHERE ws.user_id = cp.patient_id), '-infinity'::timestamptz),
          COALESCE((SELECT MAX(ms.created_at) FROM public.monthly_summaries ms WHERE ms.user_id = cp.patient_id), '-infinity'::timestamptz)
        ) = '-infinity'::timestamptz THEN NULL
        ELSE GREATEST(
          COALESCE((SELECT MAX(m.created_at) FROM public.messages m WHERE m.user_id = cp.patient_id AND m.role = 'user'), '-infinity'::timestamptz),
          COALESCE((SELECT MAX(me.created_at) FROM public.mood_entries me WHERE me.user_id = cp.patient_id), '-infinity'::timestamptz),
          COALESCE((SELECT MAX(ws.created_at) FROM public.weekly_summaries ws WHERE ws.user_id = cp.patient_id), '-infinity'::timestamptz),
          COALESCE((SELECT MAX(ms.created_at) FROM public.monthly_summaries ms WHERE ms.user_id = cp.patient_id), '-infinity'::timestamptz)
        )
      END AS recent_activity_at,
      COALESCE((SELECT COUNT(*) FROM public.weekly_summaries ws WHERE ws.user_id = cp.patient_id), 0)::BIGINT AS weekly_summary_count,
      COALESCE((SELECT COUNT(*) FROM public.monthly_summaries ms WHERE ms.user_id = cp.patient_id), 0)::BIGINT AS monthly_summary_count,
      COALESCE((SELECT COUNT(*) FROM public.messages m WHERE m.user_id = cp.patient_id AND m.role = 'user' AND m.created_at >= now() - interval '30 days'), 0) AS message_events,
      COALESCE((SELECT COUNT(*) FROM public.mood_entries me WHERE me.user_id = cp.patient_id AND me.created_at >= now() - interval '30 days'), 0) AS mood_events,
      COALESCE((SELECT COUNT(*) FROM public.weekly_summaries ws WHERE ws.user_id = cp.patient_id AND ws.created_at >= now() - interval '60 days'), 0) AS weekly_events,
      COALESCE((SELECT COUNT(*) FROM public.monthly_summaries ms WHERE ms.user_id = cp.patient_id AND ms.created_at >= now() - interval '90 days'), 0) AS monthly_events
    FROM connected_patients cp
  )
  SELECT
    cp.id,
    cp.patient_id,
    cp.patient_name,
    cp.connected_at,
    ps.recent_activity_at,
    cp.invite_code,
    ps.weekly_summary_count,
    ps.monthly_summary_count,
    LEAST(100, GREATEST(0, (ps.message_events * 4) + (ps.mood_events * 6) + (ps.weekly_events * 20) + (ps.monthly_events * 25)))::INTEGER AS engagement_score
  FROM connected_patients cp
  JOIN patient_stats ps ON ps.patient_id = cp.patient_id
  ORDER BY ps.recent_activity_at DESC NULLS LAST, cp.connected_at DESC NULLS LAST;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_therapist_patient_summaries(p_patient_id uuid)
RETURNS TABLE(
  id uuid,
  summary_type text,
  created_at timestamp with time zone,
  period_start timestamp with time zone,
  period_end timestamp with time zone,
  viewed_at timestamp with time zone,
  summary_text text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_approved_therapist(auth.uid()) THEN
    RAISE EXCEPTION 'Approved therapist access required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.therapist_patients tp
    WHERE tp.therapist_id = auth.uid()
      AND tp.patient_id = p_patient_id
      AND tp.status = 'connected'
  ) THEN
    RAISE EXCEPTION 'Patient access denied';
  END IF;

  RETURN QUERY
  SELECT ws.id, 'weekly'::TEXT, ws.created_at, ws.week_start, ws.week_end, ws.viewed_at, ws.summary_text
  FROM public.weekly_summaries ws
  WHERE ws.user_id = p_patient_id

  UNION ALL

  SELECT ms.id, 'monthly'::TEXT, ms.created_at, ms.month_start, ms.month_end, ms.viewed_at, ms.summary_text
  FROM public.monthly_summaries ms
  WHERE ms.user_id = p_patient_id

  ORDER BY created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_therapist_invite()
RETURNS TABLE(invite_id uuid, invite_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite_code TEXT;
  v_invite_id UUID;
  v_attempts INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_approved_therapist(auth.uid()) THEN
    RAISE EXCEPTION 'Approved therapist access required';
  END IF;

  LOOP
    v_attempts := v_attempts + 1;
    v_invite_code := public.generate_secure_invite_code();

    BEGIN
      INSERT INTO public.therapist_patients (therapist_id, invite_code, status)
      VALUES (auth.uid(), v_invite_code, 'pending')
      RETURNING id INTO v_invite_id;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempts >= 5 THEN
        RAISE EXCEPTION 'Unable to generate unique invite code';
      END IF;
    END;
  END LOOP;

  RETURN QUERY SELECT v_invite_id, v_invite_code;
END;
$$;