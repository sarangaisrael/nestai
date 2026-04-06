-- Create table for monthly summaries
CREATE TABLE public.monthly_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month_start TIMESTAMP WITH TIME ZONE NOT NULL,
  month_end TIMESTAMP WITH TIME ZONE NOT NULL,
  summary_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  viewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.monthly_summaries ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own monthly summaries" 
ON public.monthly_summaries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly summaries" 
ON public.monthly_summaries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monthly summaries" 
ON public.monthly_summaries 
FOR DELETE 
USING (auth.uid() = user_id);

-- Service role only insert (for scheduled function)
CREATE POLICY "Deny user inserts on monthly_summaries" 
ON public.monthly_summaries 
FOR INSERT 
TO authenticated
WITH CHECK (false);