-- Add license number field to therapist registrations
ALTER TABLE public.therapist_registrations 
ADD COLUMN IF NOT EXISTS license_number text;