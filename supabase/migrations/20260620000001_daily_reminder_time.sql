alter table public.user_preferences
  add column if not exists daily_reminder_time text not null default '21:00';
