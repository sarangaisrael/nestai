-- Create therapist_patients table for therapist-patient relationships
CREATE TABLE public.therapist_patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID NOT NULL,
    patient_id UUID,
    invite_code TEXT UNIQUE NOT NULL,
    invite_created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    connected_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'revoked')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_therapist_patients_therapist ON public.therapist_patients(therapist_id);
CREATE INDEX idx_therapist_patients_patient ON public.therapist_patients(patient_id);
CREATE INDEX idx_therapist_patients_invite_code ON public.therapist_patients(invite_code);

-- Enable RLS
ALTER TABLE public.therapist_patients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for therapist_patients
-- Therapists can view their own patient connections
CREATE POLICY "Therapists can view their patient connections"
ON public.therapist_patients
FOR SELECT
USING (
    auth.uid() = therapist_id 
    OR auth.uid() = patient_id
);

-- Therapists can create invites
CREATE POLICY "Therapists can create invites"
ON public.therapist_patients
FOR INSERT
WITH CHECK (
    auth.uid() = therapist_id
    AND public.has_role(auth.uid(), 'therapist'::app_role)
);

-- Therapists can update their invites (revoke), patients can update to connect
CREATE POLICY "Users can update their connections"
ON public.therapist_patients
FOR UPDATE
USING (auth.uid() = therapist_id OR auth.uid() = patient_id);

-- Therapists can delete pending invites
CREATE POLICY "Therapists can delete pending invites"
ON public.therapist_patients
FOR DELETE
USING (
    auth.uid() = therapist_id 
    AND status = 'pending'
);

-- Create function to check if therapist has access to patient data
CREATE OR REPLACE FUNCTION public.therapist_has_patient_access(
    _therapist_id UUID,
    _patient_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.therapist_patients
        WHERE therapist_id = _therapist_id
        AND patient_id = _patient_id
        AND status = 'connected'
    )
$$;

-- Create function to get connection date for data visibility
CREATE OR REPLACE FUNCTION public.get_therapist_patient_connection_date(
    _therapist_id UUID,
    _patient_id UUID
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT connected_at
    FROM public.therapist_patients
    WHERE therapist_id = _therapist_id
    AND patient_id = _patient_id
    AND status = 'connected'
    LIMIT 1
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_therapist_patients_updated_at
BEFORE UPDATE ON public.therapist_patients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update RLS policies on weekly_summaries to allow therapist access
CREATE POLICY "Therapists can view connected patient summaries"
ON public.weekly_summaries
FOR SELECT
USING (
    public.therapist_has_patient_access(auth.uid(), user_id)
    AND created_at >= public.get_therapist_patient_connection_date(auth.uid(), user_id)
);

-- Update RLS policies on monthly_summaries to allow therapist access
CREATE POLICY "Therapists can view connected patient monthly summaries"
ON public.monthly_summaries
FOR SELECT
USING (
    public.therapist_has_patient_access(auth.uid(), user_id)
    AND created_at >= public.get_therapist_patient_connection_date(auth.uid(), user_id)
);

-- Update RLS policies on messages to allow therapist access
CREATE POLICY "Therapists can view connected patient messages"
ON public.messages
FOR SELECT
USING (
    public.therapist_has_patient_access(auth.uid(), user_id)
    AND created_at >= public.get_therapist_patient_connection_date(auth.uid(), user_id)
);

-- Update RLS policies on weekly_questionnaires to allow therapist access
CREATE POLICY "Therapists can view connected patient questionnaires"
ON public.weekly_questionnaires
FOR SELECT
USING (
    public.therapist_has_patient_access(auth.uid(), user_id)
    AND created_at >= public.get_therapist_patient_connection_date(auth.uid(), user_id)
);

-- Update RLS policies on weekly_emotion_ratings to allow therapist access
CREATE POLICY "Therapists can view connected patient emotion ratings"
ON public.weekly_emotion_ratings
FOR SELECT
USING (
    public.therapist_has_patient_access(auth.uid(), user_id)
    AND created_at >= public.get_therapist_patient_connection_date(auth.uid(), user_id)
);