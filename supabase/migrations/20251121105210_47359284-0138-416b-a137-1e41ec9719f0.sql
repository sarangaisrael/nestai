-- Add user preferences table for summary settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  summary_day TEXT NOT NULL DEFAULT 'saturday',
  summary_time TEXT NOT NULL DEFAULT '20:00',
  summary_timezone TEXT NOT NULL DEFAULT 'Asia/Jerusalem',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view their own preferences"
ON public.user_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own preferences"
ON public.user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update their own preferences"
ON public.user_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Add reply_count to messages to track assistant message sequences
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

-- Add is_system flag to identify system-generated messages
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- Add index for daily reminder queries
CREATE INDEX IF NOT EXISTS idx_messages_user_created_date 
ON public.messages(user_id, created_at);

-- Add last_summary_generated to track when summary was last created
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS last_summary_generated TIMESTAMP WITH TIME ZONE;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();