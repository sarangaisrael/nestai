-- Add patient_name column to therapist_patients
ALTER TABLE public.therapist_patients 
ADD COLUMN patient_name text;