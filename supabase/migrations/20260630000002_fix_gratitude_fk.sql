-- Fix gratitude_entries: user_id was referencing profiles(id) instead of auth.users(id).
-- The RLS policy (auth.uid() = user_id) only works correctly when user_id = auth.users.id.
-- profiles.id is a separate gen_random_uuid() that does NOT equal auth.uid().
-- Result: all SELECT/INSERT/DELETE policies silently failed for all users.
--
-- NOTE: Any rows previously inserted via profiles.id remain in the table but are
-- unreachable through RLS (they were also unreachable before, so no data is lost).
-- The FK change does not delete existing rows.

ALTER TABLE public.gratitude_entries
  DROP CONSTRAINT IF EXISTS gratitude_entries_user_id_fkey;

ALTER TABLE public.gratitude_entries
  ADD CONSTRAINT gratitude_entries_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
