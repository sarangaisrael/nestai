-- Create table to track PWA installations
CREATE TABLE public.pwa_installations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  installed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  platform TEXT, -- 'ios', 'android', 'desktop'
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pwa_installations ENABLE ROW LEVEL SECURITY;

-- Users can view their own installations
CREATE POLICY "Users can view their own installations"
ON public.pwa_installations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own installations
CREATE POLICY "Users can insert their own installations"
ON public.pwa_installations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can view all installations
CREATE POLICY "Admins can view all installations"
ON public.pwa_installations
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_pwa_installations_user_id ON public.pwa_installations(user_id);
CREATE INDEX idx_pwa_installations_installed_at ON public.pwa_installations(installed_at DESC);