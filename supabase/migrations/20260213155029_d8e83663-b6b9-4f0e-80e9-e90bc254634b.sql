
-- Enable pgcrypto for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create helper function to generate cryptographically strong invite codes
CREATE OR REPLACE FUNCTION public.generate_secure_invite_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_raw bytea;
  v_encoded text;
BEGIN
  v_raw := extensions.gen_random_bytes(32);
  v_encoded := encode(v_raw, 'base64');
  v_encoded := replace(v_encoded, '+', '-');
  v_encoded := replace(v_encoded, '/', '_');
  v_encoded := replace(v_encoded, '=', '');
  RETURN v_encoded;
END;
$$;
