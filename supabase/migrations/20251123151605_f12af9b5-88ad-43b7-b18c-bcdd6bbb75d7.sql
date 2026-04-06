-- Add automation fields to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS weekly_summary_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS weekly_summary_last_sent_at timestamp with time zone;

-- Create summary_logs table for debugging
CREATE TABLE IF NOT EXISTS public.summary_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL, -- 'scheduled', 'sent', 'failed', 'retry'
  attempt_number integer DEFAULT 1,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on summary_logs
ALTER TABLE public.summary_logs ENABLE ROW LEVEL SECURITY;

-- Policy for viewing own logs
CREATE POLICY "Users can view their own summary logs"
ON public.summary_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Policy for inserting logs (service role only, but we'll use service key in edge function)
CREATE POLICY "Service can insert summary logs"
ON public.summary_logs
FOR INSERT
WITH CHECK (true);