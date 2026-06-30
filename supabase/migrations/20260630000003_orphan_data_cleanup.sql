-- Scheduled orphan-data cleanup (belt-and-suspenders on top of CASCADE deletes).
-- Removes rows in user tables whose auth.users record no longer exists.
-- Requires pg_cron extension (available on Supabase Pro/Team/Enterprise).
-- Runs on the 1st of each month at 03:00 UTC.

CREATE OR REPLACE FUNCTION public.cleanup_orphan_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Tables that use user_id → auth.users(id) with CASCADE but just in case
  DELETE FROM public.messages
    WHERE user_id NOT IN (SELECT id FROM auth.users);

  DELETE FROM public.journal_entries
    WHERE user_id NOT IN (SELECT id FROM auth.users);

  DELETE FROM public.daily_checkins
    WHERE user_id NOT IN (SELECT id FROM auth.users);

  DELETE FROM public.sleep_logs
    WHERE user_id NOT IN (SELECT id FROM auth.users);

  DELETE FROM public.weekly_summaries
    WHERE user_id NOT IN (SELECT id FROM auth.users);

  DELETE FROM public.monthly_summaries
    WHERE user_id NOT IN (SELECT id FROM auth.users);

  DELETE FROM public.user_preferences
    WHERE user_id NOT IN (SELECT id FROM auth.users);

  DELETE FROM public.user_settings
    WHERE user_id NOT IN (SELECT id FROM auth.users);

  DELETE FROM public.gratitude_entries
    WHERE user_id NOT IN (SELECT id FROM auth.users);

  DELETE FROM public.push_subscriptions
    WHERE user_id NOT IN (SELECT id FROM auth.users);
END;
$$;

-- Schedule via pg_cron: 1st of every month at 03:00 UTC
-- NOTE: pg_cron must be enabled in Supabase Dashboard → Database → Extensions
SELECT cron.schedule(
  'monthly-orphan-cleanup',
  '0 3 1 * *',
  $$SELECT public.cleanup_orphan_user_data()$$
);
