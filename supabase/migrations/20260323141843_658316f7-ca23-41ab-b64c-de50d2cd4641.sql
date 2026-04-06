
DO $$
DECLARE
  v_user_id uuid := 'd4c2e851-ec11-44ce-9f2d-7692ea85405e';
BEGIN
  DELETE FROM public.messages WHERE user_id = v_user_id;
  DELETE FROM public.weekly_summaries WHERE user_id = v_user_id;
  DELETE FROM public.monthly_summaries WHERE user_id = v_user_id;
  DELETE FROM public.weekly_questionnaires WHERE user_id = v_user_id;
  DELETE FROM public.weekly_emotion_ratings WHERE user_id = v_user_id;
  DELETE FROM public.mood_entries WHERE user_id = v_user_id;
  DELETE FROM public.user_preferences WHERE user_id = v_user_id;
  DELETE FROM public.user_notifications WHERE user_id = v_user_id;
  DELETE FROM public.push_subscriptions WHERE user_id = v_user_id;
  DELETE FROM public.pwa_installations WHERE user_id = v_user_id;
  DELETE FROM public.subscriptions WHERE user_id = v_user_id;
  DELETE FROM public.user_feedback WHERE user_id = v_user_id;
  DELETE FROM public.summary_logs WHERE user_id = v_user_id;
  DELETE FROM public.payment_requests WHERE user_id = v_user_id;
  DELETE FROM public.therapist_patient_messages WHERE therapist_id = v_user_id OR patient_id = v_user_id;
  DELETE FROM public.therapist_patients WHERE therapist_id = v_user_id OR patient_id = v_user_id;
  DELETE FROM public.therapist_registrations WHERE user_id = v_user_id;
  DELETE FROM public.user_access_statuses WHERE user_id = v_user_id;
  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  DELETE FROM public.profiles WHERE user_id = v_user_id;
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;
