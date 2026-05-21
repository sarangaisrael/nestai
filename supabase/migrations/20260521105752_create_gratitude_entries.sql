-- Create gratitude_entries table
CREATE TABLE public.gratitude_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for fast per-user queries (sorted by newest first)
CREATE INDEX idx_gratitude_entries_user_created
  ON public.gratitude_entries (user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.gratitude_entries ENABLE ROW LEVEL SECURITY;

-- Users can read their own entries
CREATE POLICY "Users can read own gratitude entries"
  ON public.gratitude_entries
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own entries
CREATE POLICY "Users can insert own gratitude entries"
  ON public.gratitude_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own entries
CREATE POLICY "Users can delete own gratitude entries"
  ON public.gratitude_entries
  FOR DELETE
  USING (auth.uid() = user_id);
