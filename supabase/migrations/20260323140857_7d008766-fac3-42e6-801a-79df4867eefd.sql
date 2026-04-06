
CREATE OR REPLACE FUNCTION public.get_therapist_patient_insights(p_patient_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_weekly_summary jsonb;
  v_monthly_summary jsonb;
  v_emotion_breakdown jsonb;
  v_intensity_points jsonb;
  v_pattern_cards jsonb;
  v_current_avg numeric := 0;
  v_previous_avg numeric := 0;
  v_trend_summary text;
  v_top_emotion text;
  v_top_emotion_count integer := 0;
  v_total_recent_moods integer := 0;
  v_recent_stress numeric := 0;
  v_previous_stress numeric := 0;
  v_recent_outlook numeric := 0;
  v_previous_outlook numeric := 0;
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

  SELECT jsonb_build_object(
    'id', ws.id,
    'created_at', ws.created_at,
    'period_start', ws.week_start,
    'period_end', ws.week_end,
    'viewed_at', ws.viewed_at,
    'summary_text', ws.summary_text
  )
  INTO v_weekly_summary
  FROM public.weekly_summaries ws
  WHERE ws.user_id = p_patient_id
  ORDER BY ws.created_at DESC
  LIMIT 1;

  SELECT jsonb_build_object(
    'id', ms.id,
    'created_at', ms.created_at,
    'period_start', ms.month_start,
    'period_end', ms.month_end,
    'viewed_at', ms.viewed_at,
    'summary_text', ms.summary_text
  )
  INTO v_monthly_summary
  FROM public.monthly_summaries ms
  WHERE ms.user_id = p_patient_id
  ORDER BY ms.created_at DESC
  LIMIT 1;

  WITH mood_counts AS (
    SELECT LOWER(BTRIM(mood)) AS emotion, COUNT(*)::int AS count
    FROM public.mood_entries
    WHERE user_id = p_patient_id
      AND created_at >= now() - interval '30 days'
      AND NULLIF(BTRIM(mood), '') IS NOT NULL
    GROUP BY LOWER(BTRIM(mood))
  ),
  mood_totals AS (
    SELECT COALESCE(SUM(count), 0)::int AS total_count FROM mood_counts
  )
  SELECT
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'emotion', mc.emotion,
          'percent', CASE WHEN mt.total_count = 0 THEN 0 ELSE ROUND((mc.count::numeric / mt.total_count::numeric) * 100) END,
          'count', mc.count
        )
        ORDER BY mc.count DESC, mc.emotion ASC
      ),
      '[]'::jsonb
    ),
    COALESCE((SELECT emotion FROM mood_counts ORDER BY count DESC, emotion ASC LIMIT 1), ''),
    COALESCE((SELECT count FROM mood_counts ORDER BY count DESC, emotion ASC LIMIT 1), 0),
    mt.total_count
  INTO v_emotion_breakdown, v_top_emotion, v_top_emotion_count, v_total_recent_moods
  FROM mood_totals mt
  LEFT JOIN mood_counts mc ON true
  GROUP BY mt.total_count;

  WITH questionnaire_points AS (
    SELECT
      week_start,
      ROUND(((q2_stress_level + (11 - q3_clarity) + (11 - q4_coping_ability) + (11 - q6_next_week_outlook)) / 4.0)::numeric, 1) AS intensity,
      q2_stress_level,
      q6_next_week_outlook
    FROM public.weekly_questionnaires
    WHERE user_id = p_patient_id
    ORDER BY week_start DESC
    LIMIT 8
  ),
  ordered_points AS (
    SELECT * FROM questionnaire_points ORDER BY week_start ASC
  ),
  recent_points AS (
    SELECT * FROM questionnaire_points ORDER BY week_start DESC LIMIT 4
  ),
  previous_points AS (
    SELECT * FROM questionnaire_points ORDER BY week_start DESC OFFSET 4 LIMIT 4
  )
  SELECT
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'date', op.week_start,
          'intensity', op.intensity,
          'stress_level', op.q2_stress_level,
          'outlook', op.q6_next_week_outlook
        ) ORDER BY op.week_start ASC
      ) FROM ordered_points op),
      '[]'::jsonb
    ),
    COALESCE((SELECT AVG(intensity) FROM recent_points), 0),
    COALESCE((SELECT AVG(intensity) FROM previous_points), 0),
    COALESCE((SELECT AVG(q2_stress_level) FROM recent_points), 0),
    COALESCE((SELECT AVG(q2_stress_level) FROM previous_points), 0),
    COALESCE((SELECT AVG(q6_next_week_outlook) FROM recent_points), 0),
    COALESCE((SELECT AVG(q6_next_week_outlook) FROM previous_points), 0)
  INTO v_intensity_points, v_current_avg, v_previous_avg, v_recent_stress, v_previous_stress, v_recent_outlook, v_previous_outlook;

  v_trend_summary := CASE
    WHEN jsonb_array_length(v_intensity_points) = 0 THEN 'עדיין אין מספיק נתונים כדי להציג מגמות עבור המטופל/ת הזה.'
    WHEN v_previous_avg = 0 THEN 'התחילו להצטבר נתוני מגמה ראשונים. אפשר כבר לזהות בסיס למדידה לאורך זמן.'
    WHEN v_current_avg <= v_previous_avg - 0.7 THEN 'יש שיפור עקבי בתקופה האחרונה — עוצמת המצוקה ירדה ביחס לשבועות הקודמים.'
    WHEN v_current_avg >= v_previous_avg + 0.7 THEN 'ניכרת עלייה בעומס הרגשי ביחס לשבועות הקודמים, וכדאי לבחון זאת בפגישה הקרובה.'
    ELSE 'המגמה יציבה יחסית בתקופה האחרונה, ללא שינוי חד בעומס הרגשי.'
  END;

  v_pattern_cards := jsonb_build_array(
    jsonb_build_object(
      'title', CASE WHEN NULLIF(v_top_emotion, '') IS NULL THEN 'עדיין אין רגש מוביל' ELSE 'הרגש המרכזי בתקופה האחרונה' END,
      'description', CASE
        WHEN NULLIF(v_top_emotion, '') IS NULL THEN 'אין עדיין מספיק דיווחי מצב רוח כדי לזהות רגש מוביל בחודש האחרון.'
        ELSE format('ב-30 הימים האחרונים הרגש שחזר הכי הרבה הוא "%s" (%s דיווחים).', v_top_emotion, v_top_emotion_count)
      END,
      'type', 'pattern',
      'emoji', '🧭'
    ),
    jsonb_build_object(
      'title', 'רמת לחץ',
      'description', CASE
        WHEN v_recent_stress = 0 AND v_previous_stress = 0 THEN 'עדיין אין מספיק שאלונים כדי להעריך שינוי ברמת הלחץ.'
        WHEN v_recent_stress <= v_previous_stress - 0.5 THEN 'השאלונים האחרונים מצביעים על ירידה ברמת הלחץ לעומת התקופה הקודמת.'
        WHEN v_recent_stress >= v_previous_stress + 0.5 THEN 'נרשמה עלייה ברמת הלחץ בשאלונים האחרונים לעומת התקופה הקודמת.'
        ELSE 'רמת הלחץ נשארת יחסית יציבה בין התקופות האחרונות.'
      END,
      'type', CASE
        WHEN v_recent_stress = 0 AND v_previous_stress = 0 THEN 'pattern'
        WHEN v_recent_stress <= v_previous_stress - 0.5 THEN 'positive'
        WHEN v_recent_stress >= v_previous_stress + 0.5 THEN 'warning'
        ELSE 'trigger'
      END,
      'emoji', '📈'
    ),
    jsonb_build_object(
      'title', 'מבט קדימה',
      'description', CASE
        WHEN v_recent_outlook = 0 AND v_previous_outlook = 0 THEN 'עדיין אין מספיק נתונים כדי לזהות שינוי בתחושת המסוגלות והאופטימיות.'
        WHEN v_recent_outlook >= v_previous_outlook + 0.5 THEN 'ניכרת עלייה בתחושת האופטימיות לקראת השבוע הבא.'
        WHEN v_recent_outlook <= v_previous_outlook - 0.5 THEN 'ניכרת ירידה בתחושת האופטימיות, וייתכן שנדרש חיזוק ממוקד.'
        ELSE 'תחושת האופק לשבוע הבא נשארת יציבה יחסית.'
      END,
      'type', CASE
        WHEN v_recent_outlook = 0 AND v_previous_outlook = 0 THEN 'pattern'
        WHEN v_recent_outlook >= v_previous_outlook + 0.5 THEN 'positive'
        WHEN v_recent_outlook <= v_previous_outlook - 0.5 THEN 'warning'
        ELSE 'pattern'
      END,
      'emoji', '💡'
    )
  );

  RETURN jsonb_build_object(
    'weekly_summary', v_weekly_summary,
    'monthly_summary', v_monthly_summary,
    'emotion_breakdown', COALESCE(v_emotion_breakdown, '[]'::jsonb),
    'intensity_points', COALESCE(v_intensity_points, '[]'::jsonb),
    'pattern_cards', COALESCE(v_pattern_cards, '[]'::jsonb),
    'trend_summary', v_trend_summary,
    'recent_mood_entries', v_total_recent_moods
  );
END;
$function$;
