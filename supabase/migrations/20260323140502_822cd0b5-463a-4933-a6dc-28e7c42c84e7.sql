CREATE OR REPLACE FUNCTION public.get_therapist_patients_dashboard()
 RETURNS TABLE(connection_id uuid, patient_id uuid, patient_name text, connected_at timestamp with time zone, invite_code text, recent_activity_at timestamp with time zone, weekly_summary_count bigint, monthly_summary_count bigint, engagement_score integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    cp.invite_code,
    ps.recent_activity_at,
    ps.weekly_summary_count,
    ps.monthly_summary_count,
    LEAST(100, GREATEST(0, (ps.message_events * 4) + (ps.mood_events * 6) + (ps.weekly_events * 20) + (ps.monthly_events * 25)))::INTEGER AS engagement_score
  FROM connected_patients cp
  JOIN patient_stats ps ON ps.patient_id = cp.patient_id
  ORDER BY ps.recent_activity_at DESC NULLS LAST, cp.connected_at DESC NULLS LAST;
END;
$function$;