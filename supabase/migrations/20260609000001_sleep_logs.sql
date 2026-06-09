create table if not exists sleep_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  sleep_time time,
  wake_time time,
  sleep_hours numeric,
  sleep_quality integer,
  created_at timestamptz default now()
);

alter table sleep_logs enable row level security;

create policy "Users can manage their own sleep logs"
on sleep_logs for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
