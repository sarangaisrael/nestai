-- Drop therapist-related RLS policies from weekly_summaries
DROP POLICY IF EXISTS "Therapists can view connected patient summaries" ON public.weekly_summaries;

-- Drop therapist-related RLS policies from messages
DROP POLICY IF EXISTS "Therapists can view connected patient messages" ON public.messages;

-- Drop therapist-related RLS policies from monthly_summaries
DROP POLICY IF EXISTS "Therapists can view connected patient monthly summaries" ON public.monthly_summaries;

-- Drop therapist-related RLS policies from weekly_questionnaires
DROP POLICY IF EXISTS "Therapists can view connected patient questionnaires" ON public.weekly_questionnaires;

-- Drop therapist-related RLS policies from weekly_emotion_ratings
DROP POLICY IF EXISTS "Therapists can view connected patient emotion ratings" ON public.weekly_emotion_ratings;

-- Drop therapist-related database functions
DROP FUNCTION IF EXISTS public.therapist_has_patient_access(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_therapist_patient_connection_date(uuid, uuid);
DROP FUNCTION IF EXISTS public.connect_with_invite_code(text);
DROP FUNCTION IF EXISTS public.validate_invite_code(text);