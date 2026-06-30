-- Add consent timestamp to user_preferences for GDPR compliance
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
