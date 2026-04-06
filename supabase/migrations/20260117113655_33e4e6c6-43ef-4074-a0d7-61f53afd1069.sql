-- Create table for therapist beta registrations
CREATE TABLE public.therapist_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  specialization TEXT NOT NULL,
  years_of_experience INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.therapist_registrations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public registration form)
CREATE POLICY "Anyone can register as therapist" 
ON public.therapist_registrations 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view registrations (correct argument order)
CREATE POLICY "Only admins can view therapist registrations" 
ON public.therapist_registrations 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));