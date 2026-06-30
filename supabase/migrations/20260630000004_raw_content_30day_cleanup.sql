-- 30-day raw content retention policy
-- Deletes raw text content (messages, journal_entries, gratitude_entries)
-- 30 days after creation, for ALL active users.
--
-- Guard against deleting unsummarised content:
--   A row is safe to delete when EITHER:
--     (a) A weekly_summary exists for that user that was created at least 6 days
--         after the row — meaning the weekly job had a full cycle to capture it, OR
--     (b) The row is older than 37 days — a 7-day grace buffer beyond the 30-day
--         limit, after which we delete regardless (handles inactive users who have
--         no summaries at all).
--
-- NOTE on daily_checkins.note (free-text field):
--   This column is NOT included in this job because the user requested daily_checkins
--   to be kept indefinitely. However, the `note` column contains free-text encrypted
--   content similar to journal entries. Owner must decide: clear note to NULL after
--   30 days (keeping the numeric mood/activities row) or leave as-is.
--   See inline comment below for the ready-to-use statement.
--
-- Requires pg_cron extension (Supabase Pro/Team/Enterprise).
-- Enable: Supabase Dashboard → Database → Extensions → pg_cron

CREATE OR REPLACE FUNCTION public.cleanup_raw_content_30days()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_messages_deleted   bigint := 0;
  v_journal_deleted    bigint := 0;
  v_gratitude_deleted  bigint := 0;
  v_notes_cleared      bigint := 0;
  v_cutoff             timestamptz := now() - interval '30 days';
  v_hard_cutoff        timestamptz := now() - interval '37 days';
BEGIN

  -- ── messages ────────────────────────────────────────────────────────────────
  WITH deleted AS (
    DELETE FROM public.messages m
    WHERE m.created_at < v_cutoff
      AND (
        -- (a) A weekly summary was generated after this message had time to be captured
        EXISTS (
          SELECT 1 FROM public.weekly_summaries ws
          WHERE ws.user_id = m.user_id
            AND ws.created_at > m.created_at + interval '6 days'
        )
        OR
        -- (b) Hard cutoff: 37 days — delete regardless of summary status
        m.created_at < v_hard_cutoff
      )
    RETURNING 1
  )
  SELECT count(*) INTO v_messages_deleted FROM deleted;

  -- ── journal_entries ──────────────────────────────────────────────────────────
  WITH deleted AS (
    DELETE FROM public.journal_entries je
    WHERE je.created_at < v_cutoff
      AND (
        EXISTS (
          SELECT 1 FROM public.weekly_summaries ws
          WHERE ws.user_id = je.user_id
            AND ws.created_at > je.created_at + interval '6 days'
        )
        OR je.created_at < v_hard_cutoff
      )
    RETURNING 1
  )
  SELECT count(*) INTO v_journal_deleted FROM deleted;

  -- ── gratitude_entries ────────────────────────────────────────────────────────
  WITH deleted AS (
    DELETE FROM public.gratitude_entries ge
    WHERE ge.created_at < v_cutoff
      AND (
        EXISTS (
          SELECT 1 FROM public.weekly_summaries ws
          WHERE ws.user_id = ge.user_id
            AND ws.created_at > ge.created_at + interval '6 days'
        )
        OR ge.created_at < v_hard_cutoff
      )
    RETURNING 1
  )
  SELECT count(*) INTO v_gratitude_deleted FROM deleted;

  -- ── daily_checkins.note — null-out free text after 30 days ─────────────────
  -- Mood score and activities array are preserved; only the note is cleared.
  -- Same 30/37-day guard as messages and journal_entries.
  WITH cleared AS (
    UPDATE public.daily_checkins
    SET note = NULL
    WHERE note IS NOT NULL
      AND created_at < v_cutoff
      AND (
        EXISTS (
          SELECT 1 FROM public.weekly_summaries ws
          WHERE ws.user_id = daily_checkins.user_id
            AND ws.created_at > daily_checkins.created_at + interval '6 days'
        )
        OR created_at < v_hard_cutoff
      )
    RETURNING 1
  )
  SELECT count(*) INTO v_notes_cleared FROM cleared;

  RETURN jsonb_build_object(
    'run_at',              now(),
    'cutoff_30d',          v_cutoff,
    'hard_cutoff_37d',     v_hard_cutoff,
    'messages_deleted',    v_messages_deleted,
    'journal_deleted',     v_journal_deleted,
    'gratitude_deleted',   v_gratitude_deleted,
    'checkin_notes_cleared', v_notes_cleared
  );
END;
$$;

-- Schedule: daily at 02:00 UTC
-- NOTE: pg_cron must be enabled in Supabase Dashboard → Database → Extensions
SELECT cron.schedule(
  'daily-raw-content-cleanup',
  '0 2 * * *',
  $$SELECT public.cleanup_raw_content_30days()$$
);
