alter table public.weekly_summaries
  add column if not exists stress_score  numeric,
  add column if not exists anxiety_score numeric,
  add column if not exists joy_score     numeric;
