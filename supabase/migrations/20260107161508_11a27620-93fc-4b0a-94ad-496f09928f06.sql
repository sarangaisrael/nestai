-- Create table for weekly emotion ratings
CREATE TABLE public.weekly_emotion_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  summary_id UUID NOT NULL REFERENCES public.weekly_summaries(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, summary_id)
);

-- Enable Row Level Security
ALTER TABLE public.weekly_emotion_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own emotion ratings" 
ON public.weekly_emotion_ratings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emotion ratings" 
ON public.weekly_emotion_ratings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emotion ratings" 
ON public.weekly_emotion_ratings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_weekly_emotion_ratings_updated_at
BEFORE UPDATE ON public.weekly_emotion_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();