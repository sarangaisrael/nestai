-- ── Subscriptions table ────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  plan        text        not null default 'trial',   -- 'trial' | 'monthly' | 'yearly'
  is_active   boolean     not null default true,
  starts_at   timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '14 days'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id)
);

alter table public.subscriptions enable row level security;

-- Users can read their own subscription
create policy "subscriptions: user read own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Auto-create 14-day trial on new signup
create or replace function public.handle_new_user_subscription()
returns trigger language plpgsql security definer as $$
begin
  insert into public.subscriptions (user_id, plan, is_active, starts_at, expires_at)
  values (new.id, 'trial', true, now(), now() + interval '14 days')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created_subscription
  after insert on auth.users
  for each row execute procedure public.handle_new_user_subscription();

-- Admin RPC: update any user's subscription
-- Called from AdminDashboard with plan='monthly'|'yearly'|'trial' and optional days extension
create or replace function public.admin_set_user_subscription(
  p_user_id   uuid,
  p_plan      text,     -- 'trial' | 'monthly' | 'yearly' | 'cancelled'
  p_days      integer default null  -- if provided, sets expires_at to now()+p_days
)
returns void language plpgsql security definer as $$
declare
  v_expires timestamptz;
  v_active  boolean;
begin
  if p_plan = 'cancelled' then
    v_expires := now();
    v_active  := false;
  elsif p_days is not null then
    v_expires := now() + (p_days || ' days')::interval;
    v_active  := true;
  elsif p_plan = 'monthly' then
    v_expires := now() + interval '30 days';
    v_active  := true;
  elsif p_plan = 'yearly' then
    v_expires := now() + interval '365 days';
    v_active  := true;
  else
    -- trial: 14 days
    v_expires := now() + interval '14 days';
    v_active  := true;
  end if;

  insert into public.subscriptions (user_id, plan, is_active, starts_at, expires_at, updated_at)
  values (p_user_id, p_plan, v_active, now(), v_expires, now())
  on conflict (user_id) do update
    set plan       = excluded.plan,
        is_active  = excluded.is_active,
        expires_at = excluded.expires_at,
        updated_at = now();
end;
$$;
