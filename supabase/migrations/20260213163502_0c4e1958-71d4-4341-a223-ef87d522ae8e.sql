
-- Ensure patient_name cannot be set during invite creation (INSERT)
-- It should only be populated when a patient accepts the connection (UPDATE)
CREATE OR REPLACE FUNCTION public.enforce_patient_name_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Force patient_name to NULL on INSERT to prevent setting it before patient consent
  NEW.patient_name := NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_patient_name_null_on_insert
BEFORE INSERT ON public.therapist_patients
FOR EACH ROW
EXECUTE FUNCTION public.enforce_patient_name_on_insert();
