-- Add viewed_at column to weekly_summaries to track when user viewed the summary
ALTER TABLE public.weekly_summaries 
ADD COLUMN viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create an index for faster queries
CREATE INDEX idx_weekly_summaries_viewed_at ON public.weekly_summaries(user_id, viewed_at);