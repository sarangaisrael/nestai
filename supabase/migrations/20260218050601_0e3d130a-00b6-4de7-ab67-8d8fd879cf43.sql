
-- Create meditations table
CREATE TABLE public.meditations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  media_url TEXT NOT NULL DEFAULT '',
  media_type TEXT NOT NULL DEFAULT 'youtube',
  tags TEXT[] NOT NULL DEFAULT '{}',
  published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meditations ENABLE ROW LEVEL SECURITY;

-- Everyone can view published meditations
CREATE POLICY "Anyone can view published meditations"
ON public.meditations FOR SELECT
USING (published = true);

-- Admins can view all meditations (including drafts)
CREATE POLICY "Admins can view all meditations"
ON public.meditations FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert meditations
CREATE POLICY "Admins can insert meditations"
ON public.meditations FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can update meditations
CREATE POLICY "Admins can update meditations"
ON public.meditations FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete meditations
CREATE POLICY "Admins can delete meditations"
ON public.meditations FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_meditations_updated_at
BEFORE UPDATE ON public.meditations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
