-- Enable RLS on messages table (safe to run if already enabled)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow users to update only their own messages
CREATE POLICY "Users can update own messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete only their own messages
CREATE POLICY "Users can delete own messages"
ON public.messages
FOR DELETE
USING (auth.uid() = user_id);