alter table public.user_preferences
  add column if not exists sleep_reminder_enabled boolean not null default true,
  add column if not exists sleep_reminder_time text not null default '07:30';
