CREATE TABLE IF NOT EXISTS public.therapist_patient_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'update',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.therapist_patient_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Therapists can send messages to connected patients"
ON public.therapist_patient_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = therapist_id
  AND public.has_role(auth.uid(), 'therapist'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.therapist_patients tp
    WHERE tp.therapist_id = auth.uid()
      AND tp.patient_id = therapist_patient_messages.patient_id
      AND tp.status = 'connected'
  )
);

CREATE POLICY "Therapists can view messages they sent"
ON public.therapist_patient_messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = therapist_id
  AND public.has_role(auth.uid(), 'therapist'::app_role)
);

CREATE POLICY "Patients can view their own therapist messages"
ON public.therapist_patient_messages
FOR SELECT
TO authenticated
USING (auth.uid() = patient_id);

CREATE UNIQUE INDEX IF NOT EXISTS therapist_patients_invite_code_key
ON public.therapist_patients (invite_code);

CREATE INDEX IF NOT EXISTS therapist_patients_therapist_status_idx
ON public.therapist_patients (therapist_id, status, connected_at DESC);

CREATE INDEX IF NOT EXISTS therapist_patients_patient_status_idx
ON public.therapist_patients (patient_id, status);

CREATE INDEX IF NOT EXISTS therapist_patient_messages_therapist_patient_created_idx
ON public.therapist_patient_messages (therapist_id, patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS weekly_summaries_user_created_idx
ON public.weekly_summaries (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS monthly_summaries_user_created_idx
ON public.monthly_summaries (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS messages_user_created_role_idx
ON public.messages (user_id, created_at DESC, role);

CREATE INDEX IF NOT EXISTS mood_entries_user_created_idx
ON public.mood_entries (user_id, created_at DESC);

DROP TRIGGER IF EXISTS update_therapist_patients_updated_at ON public.therapist_patients;
CREATE TRIGGER update_therapist_patients_updated_at
BEFORE UPDATE ON public.therapist_patients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.create_therapist_invite()
RETURNS TABLE(invite_id UUID, invite_code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite_code TEXT;
  v_invite_id UUID;
  v_attempts INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'therapist'::app_role) THEN
    RAISE EXCEPTION 'Therapist access required';
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

CREATE OR REPLACE FUNCTION public.claim_therapist_invite(p_invite_code TEXT)
RETURNS TABLE(connection_id UUID, therapist_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_connection RECORD;
  v_existing UUID;
  v_patient_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF public.has_role(auth.uid(), 'therapist'::app_role) THEN
    RAISE EXCEPTION 'Therapists cannot claim patient invites';
  END IF;

  SELECT tp.id, tp.therapist_id
  INTO v_connection
  FROM public.therapist_patients tp
  WHERE tp.invite_code = p_invite_code
    AND tp.status = 'pending'
  ORDER BY tp.invite_created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found or already used';
  END IF;

  IF v_connection.therapist_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot use your own invite';
  END IF;

  SELECT tp.id INTO v_existing
  FROM public.therapist_patients tp
  WHERE tp.therapist_id = v_connection.therapist_id
    AND tp.patient_id = auth.uid()
    AND tp.status = 'connected'
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN QUERY SELECT v_existing, v_connection.therapist_id;
    RETURN;
  END IF;

  SELECT NULLIF(BTRIM(first_name), '')
  INTO v_patient_name
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  UPDATE public.therapist_patients
  SET patient_id = auth.uid(),
      patient_name = COALESCE(v_patient_name, 'מטופל/ת'),
      status = 'connected',
      connected_at = now(),
      updated_at = now()
  WHERE id = v_connection.id
    AND status = 'pending';

  RETURN QUERY SELECT v_connection.id, v_connection.therapist_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_therapist_patients_dashboard()
RETURNS TABLE(
  connection_id UUID,
  patient_id UUID,
  patient_name TEXT,
  connected_at TIMESTAMP WITH TIME ZONE,
  invite_code TEXT,
  recent_activity_at TIMESTAMP WITH TIME ZONE,
  weekly_summary_count BIGINT,
  monthly_summary_count BIGINT,
  engagement_score INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'therapist'::app_role) THEN
    RAISE EXCEPTION 'Therapist access required';
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
    cp.invite_code,
    ps.recent_activity_at,
    ps.weekly_summary_count,
    ps.monthly_summary_count,
    LEAST(100, GREATEST(0, (ps.message_events * 4) + (ps.mood_events * 6) + (ps.weekly_events * 20) + (ps.monthly_events * 25)))::INTEGER AS engagement_score
  FROM connected_patients cp
  JOIN patient_stats ps ON ps.patient_id = cp.patient_id
  ORDER BY ps.recent_activity_at DESC NULLS LAST, cp.connected_at DESC NULLS LAST;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_therapist_patient_summaries(p_patient_id UUID)
RETURNS TABLE(
  id UUID,
  summary_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  summary_text TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'therapist'::app_role) THEN
    RAISE EXCEPTION 'Therapist access required';
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

CREATE OR REPLACE FUNCTION public.send_therapist_patient_message(
  p_patient_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_message_type TEXT DEFAULT 'update',
  p_link TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message_id UUID;
  v_kind TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'therapist'::app_role) THEN
    RAISE EXCEPTION 'Therapist access required';
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