-- Schedule Edge Functions via pg_cron + pg_net
-- Extensions already enabled in 20251123151920
-- ─────────────────────────────────────────────────────────────────────────────

-- Remove any previous jobs with the same names (idempotent)
SELECT cron.unschedule('hourly-summary-check') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'hourly-summary-check'
);
SELECT cron.unschedule('monthly-summary-scheduler') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'monthly-summary-scheduler'
);

-- 1. Weekly summary check — runs every hour, function handles per-user timing
SELECT cron.schedule(
  'hourly-summary-check',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://dtmjytjfiqunslouucet.supabase.co/functions/v1/hourly-summary-check',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0bWp5dGpmaXF1bnNsb3V1Y2V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NjM2MDcsImV4cCI6MjA5MTAzOTYwN30.RQAMtMn0170VgVWpjS4c9GzqIyGN_GZ7Mqe1D58gzFk"}'::jsonb,
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);

-- 2. Monthly summary scheduler — runs at 20:00 Israel time on the 1st of each month
-- Israel is UTC+3 in summer / UTC+2 in winter; 18:00 UTC covers both safely
SELECT cron.schedule(
  'monthly-summary-scheduler',
  '0 18 1 * *',
  $$
  SELECT net.http_post(
    url     := 'https://dtmjytjfiqunslouucet.supabase.co/functions/v1/monthly-summary-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0bWp5dGpmaXF1bnNsb3V1Y2V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NjM2MDcsImV4cCI6MjA5MTAzOTYwN30.RQAMtMn0170VgVWpjS4c9GzqIyGN_GZ7Mqe1D58gzFk"}'::jsonb,
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);
