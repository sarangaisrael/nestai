-- Add therapy type and summary focus fields to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN therapy_type text,
ADD COLUMN summary_focus text[] DEFAULT ARRAY['emotions', 'thoughts', 'behaviors', 'changes'];

-- Add constraint to ensure at least one focus area is selected
ALTER TABLE public.user_preferences
ADD CONSTRAINT summary_focus_not_empty CHECK (array_length(summary_focus, 1) > 0);