-- DEFAULT true so all current rows (existing users) are marked as already completed.
-- New users have no user_preferences row yet, so the app treats null as "needs onboarding".
alter table public.user_preferences
  add column if not exists onboarding_completed boolean not null default true;
