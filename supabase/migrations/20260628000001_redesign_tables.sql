-- Daily mood + activity check-ins
create table if not exists daily_checkins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  mood integer not null check (mood between 1 and 5),
  activities text[] default '{}',
  note text,
  created_at timestamptz default now(),
  unique(user_id, date)
);
alter table daily_checkins enable row level security;
drop policy if exists "Users manage own checkins" on daily_checkins;
create policy "Users manage own checkins" on daily_checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Silent journal entries
create table if not exists journal_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  mood integer check (mood between 1 and 5),
  created_at timestamptz default now()
);
alter table journal_entries enable row level security;
drop policy if exists "Users manage own journal" on journal_entries;
create policy "Users manage own journal" on journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- User app settings
create table if not exists user_settings (
  user_id uuid references auth.users(id) on delete cascade primary key,
  checkin_time text not null default '20:00',
  sleep_reminder_time text not null default '08:00',
  sleep_reminder_enabled boolean not null default true,
  custom_activities jsonb not null default '[]',
  mood_labels jsonb not null default '["קשה","לא טוב","בסדר","טוב","מעולה"]',
  updated_at timestamptz default now()
);
alter table user_settings enable row level security;
drop policy if exists "Users manage own settings" on user_settings;
create policy "Users manage own settings" on user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-insert default settings row on new user
create or replace function public.handle_new_user_settings()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_settings on auth.users;
create trigger on_auth_user_created_settings
  after insert on auth.users
  for each row execute procedure public.handle_new_user_settings();
