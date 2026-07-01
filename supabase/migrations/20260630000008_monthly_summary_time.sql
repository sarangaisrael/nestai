-- Add monthly_summary_time to user_preferences
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS monthly_summary_time text NOT NULL DEFAULT '20:00';
