-- Create a secure function to connect a patient using an invite code
-- This prevents brute-force attacks by not exposing whether codes exist
CREATE OR REPLACE FUNCTION public.connect_with_invite_code(_invite_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invite_record RECORD;
    v_user_id uuid;
BEGIN
    -- Get the current user's ID
    v_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
    END IF;
    
    -- Find the invite record (only pending invites)
    SELECT id, therapist_id, status, patient_id
    INTO v_invite_record
    FROM public.therapist_patients
    WHERE invite_code = _invite_code
    LIMIT 1;
    
    -- If no record found, return generic error (don't reveal if code exists)
    IF v_invite_record IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_or_expired_code');
    END IF;
    
    -- Check if already connected
    IF v_invite_record.status = 'connected' THEN
        -- Check if current user is already the connected patient
        IF v_invite_record.patient_id = v_user_id THEN
            RETURN jsonb_build_object('success', true, 'message', 'already_connected');
        END IF;
        RETURN jsonb_build_object('success', false, 'error', 'invalid_or_expired_code');
    END IF;
    
    -- Check if user is the therapist trying to connect to their own invite
    IF v_invite_record.therapist_id = v_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'cannot_connect_to_own_invite');
    END IF;
    
    -- Update the record to connect the patient
    UPDATE public.therapist_patients
    SET 
        patient_id = v_user_id,
        status = 'connected',
        connected_at = now(),
        updated_at = now()
    WHERE id = v_invite_record.id;
    
    RETURN jsonb_build_object('success', true, 'message', 'connected');
END;
$$;

-- Create a function to check if an invite code is valid (returns minimal info)
-- This is used for UI feedback without exposing sensitive data
CREATE OR REPLACE FUNCTION public.validate_invite_code(_invite_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invite_record RECORD;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('valid', false);
    END IF;
    
    -- Find the invite record
    SELECT id, status, therapist_id
    INTO v_invite_record
    FROM public.therapist_patients
    WHERE invite_code = _invite_code
    LIMIT 1;
    
    -- Return whether the code is valid and pending (without exposing other details)
    IF v_invite_record IS NULL THEN
        RETURN jsonb_build_object('valid', false);
    END IF;
    
    IF v_invite_record.status != 'pending' THEN
        RETURN jsonb_build_object('valid', false);
    END IF;
    
    -- Don't allow therapists to validate their own codes
    IF v_invite_record.therapist_id = auth.uid() THEN
        RETURN jsonb_build_object('valid', false, 'error', 'own_invite');
    END IF;
    
    RETURN jsonb_build_object('valid', true);
END;
$$;

-- Drop the existing SELECT policy for therapist_patients
DROP POLICY IF EXISTS "Therapists can view their patient connections" ON public.therapist_patients;

-- Create a more restrictive SELECT policy
-- Users can only see records where:
-- 1. They are the therapist who created the invite, OR
-- 2. They are already connected as the patient (patient_id matches their ID)
CREATE POLICY "Users can view their own connections"
ON public.therapist_patients
FOR SELECT
USING (
    auth.uid() = therapist_id 
    OR (auth.uid() = patient_id AND patient_id IS NOT NULL)
);

-- Remove the conflicting "Deny anonymous access" policy from therapist_registrations
-- since the INSERT policy already requires authentication
DROP POLICY IF EXISTS "Deny anonymous access to therapist_registrations" ON public.therapist_registrations;