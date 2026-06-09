create table if not exists trauma_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  safety_level integer,
  had_trigger boolean,
  trigger_description text,
  body_locations text[],
  created_at timestamptz default now()
);

alter table trauma_logs enable row level security;

create policy "Users can manage their own trauma logs"
on trauma_logs for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
