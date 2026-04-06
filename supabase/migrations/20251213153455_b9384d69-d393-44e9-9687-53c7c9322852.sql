-- Create weekly questionnaire responses table
CREATE TABLE public.weekly_questionnaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Question responses (1-5 scale matching answer order)
  q1_feeling_vs_last_week INTEGER NOT NULL CHECK (q1_feeling_vs_last_week BETWEEN 1 AND 5),
  q2_stress_level INTEGER NOT NULL CHECK (q2_stress_level BETWEEN 1 AND 5),
  q3_clarity INTEGER NOT NULL CHECK (q3_clarity BETWEEN 1 AND 5),
  q4_coping_ability INTEGER NOT NULL CHECK (q4_coping_ability BETWEEN 1 AND 5),
  q5_weekly_feeling INTEGER NOT NULL CHECK (q5_weekly_feeling BETWEEN 1 AND 5),
  q6_next_week_outlook INTEGER NOT NULL CHECK (q6_next_week_outlook BETWEEN 1 AND 5),
  
  -- Ensure one questionnaire per user per week
  UNIQUE(user_id, week_start)
);

-- Enable RLS
ALTER TABLE public.weekly_questionnaires ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own questionnaires"
ON public.weekly_questionnaires
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own questionnaires"
ON public.weekly_questionnaires
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own questionnaires"
ON public.weekly_questionnaires
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own questionnaires"
ON public.weekly_questionnaires
FOR DELETE
USING (auth.uid() = user_id);

-- Index for efficient lookups
CREATE INDEX idx_weekly_questionnaires_user_week ON public.weekly_questionnaires(user_id, week_start DESC);