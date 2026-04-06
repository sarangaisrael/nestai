
-- Add a validation trigger to enforce cryptographically strong invite codes
-- and rate-limit INSERT operations on therapist_patients

-- 1. Create a function to validate invite code strength and rate-limit inserts
CREATE OR REPLACE FUNCTION public.validate_invite_code_strength()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_count integer;
BEGIN
  -- Ensure invite_code is at least 32 characters (cryptographically strong)
  IF length(NEW.invite_code) < 32 THEN
    RAISE EXCEPTION 'Invite code must be at least 32 characters';
  END IF;

  -- Ensure invite_code only contains URL-safe base64 characters
  IF NEW.invite_code !~ '^[A-Za-z0-9_\-]+$' THEN
    RAISE EXCEPTION 'Invite code contains invalid characters';
  END IF;

  -- Rate limit: max 10 invites per therapist per hour
  SELECT count(*) INTO recent_count
  FROM public.therapist_patients
  WHERE therapist_id = NEW.therapist_id
    AND invite_created_at > now() - interval '1 hour';

  IF recent_count >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded: too many invites created recently';
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Attach the trigger to therapist_patients
DROP TRIGGER IF EXISTS validate_invite_code_strength_trigger ON public.therapist_patients;
CREATE TRIGGER validate_invite_code_strength_trigger
BEFORE INSERT ON public.therapist_patients
FOR EACH ROW
EXECUTE FUNCTION public.validate_invite_code_strength();
