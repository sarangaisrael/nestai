-- ── meditation_videos table ──────────────────────────────────────────────────
create table if not exists public.meditation_videos (
  id                uuid        primary key default gen_random_uuid(),
  title             text        not null,
  instructor        text,
  duration_minutes  integer,
  category          text,                                   -- חרדה | שינה | נשימה | מיקוד | טראומה
  video_url         text,                                   -- YouTube URL or bare video ID
  thumbnail_emoji   text        not null default '🧘',
  thumbnail_gradient text       not null default 'linear-gradient(135deg,#ede9fe,#f5f3ff)',
  is_featured       boolean     not null default false,
  is_new            boolean     not null default false,
  is_active         boolean     not null default true,
  sort_order        integer     not null default 0,
  created_at        timestamptz not null default now()
);

alter table public.meditation_videos enable row level security;

create policy "Users can view meditation videos"
  on public.meditation_videos for select
  using (is_active = true);
