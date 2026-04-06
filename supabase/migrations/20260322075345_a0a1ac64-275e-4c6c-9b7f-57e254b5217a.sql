CREATE TYPE public.access_role AS ENUM ('therapist', 'patient');

CREATE TYPE public.access_payment_status AS ENUM ('trial', 'active', 'locked');

CREATE TYPE public.payment_request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.user_access_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  role public.access_role NOT NULL,
  registration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  trial_ends_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  payment_status public.access_payment_status NOT NULL DEFAULT 'trial',
  linked_therapist_id UUID NULL,
  therapist_code TEXT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT therapist_code_format CHECK (
    therapist_code IS NULL OR therapist_code ~ '^[0-9]{6}$'
  )
);

CREATE INDEX idx_user_access_statuses_user_id ON public.user_access_statuses(user_id);
CREATE INDEX idx_user_access_statuses_linked_therapist_id ON public.user_access_statuses(linked_therapist_id);
CREATE UNIQUE INDEX idx_user_access_statuses_therapist_code ON public.user_access_statuses(therapist_code) WHERE therapist_code IS NOT NULL;

ALTER TABLE public.user_access_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own access status"
ON public.user_access_statuses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all access statuses"
ON public.user_access_statuses
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update access statuses"
ON public.user_access_statuses
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Deny direct user inserts on access statuses"
ON public.user_access_statuses
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Deny direct user deletes on access statuses"
ON public.user_access_statuses
FOR DELETE
USING (false);

CREATE TABLE public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.access_role NOT NULL,
  linked_therapist_id UUID NULL,
  amount_ils INTEGER NOT NULL,
  payment_provider TEXT NOT NULL DEFAULT 'paybox_or_bit',
  contact_email TEXT NOT NULL,
  contact_name TEXT NULL,
  message TEXT NULL,
  status public.payment_request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT payment_requests_message_length CHECK (message IS NULL OR char_length(message) <= 1000),
  CONSTRAINT payment_requests_name_length CHECK (contact_name IS NULL OR char_length(contact_name) <= 120),
  CONSTRAINT payment_requests_email_length CHECK (char_length(contact_email) <= 255)
);

CREATE INDEX idx_payment_requests_user_id ON public.payment_requests(user_id);
CREATE INDEX idx_payment_requests_status ON public.payment_requests(status);

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment requests"
ON public.payment_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment requests"
ON public.payment_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update payment requests"
ON public.payment_requests
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Deny direct user inserts on payment requests"
ON public.payment_requests
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Deny direct user deletes on payment requests"
ON public.payment_requests
FOR DELETE
USING (false);

CREATE OR REPLACE FUNCTION public.generate_unique_therapist_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_exists boolean;
  v_attempts integer := 0;
BEGIN
  LOOP
    v_attempts := v_attempts + 1;
    v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');

    SELECT EXISTS (
      SELECT 1
      FROM public.user_access_statuses
      WHERE therapist_code = v_code
    ) INTO v_exists;

    IF NOT v_exists THEN
      RETURN v_code;
    END IF;

    IF v_attempts >= 20 THEN
      RAISE EXCEPTION 'Unable to generate unique therapist code';
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.initialize_user_access(
  p_role public.access_role,
  p_therapist_code text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  role public.access_role,
  payment_status public.access_payment_status,
  trial_ends_at timestamptz,
  linked_therapist_id uuid,
  therapist_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing public.user_access_statuses%ROWTYPE;
  v_clean_code text := NULLIF(trim(coalesce(p_therapist_code, '')), '');
  v_linked_therapist_id uuid := NULL;
  v_generated_code text := NULL;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_role IS NULL THEN
    RAISE EXCEPTION 'Role is required';
  END IF;

  IF v_clean_code IS NOT NULL THEN
    IF v_clean_code !~ '^[0-9]{6}$' THEN
      RAISE EXCEPTION 'Therapist code must be exactly 6 digits';
    END IF;

    SELECT uas.user_id
    INTO v_linked_therapist_id
    FROM public.user_access_statuses uas
    WHERE uas.role = 'therapist'
      AND uas.therapist_code = v_clean_code
    LIMIT 1;

    IF v_linked_therapist_id IS NULL THEN
      RAISE EXCEPTION 'Invalid therapist code';
    END IF;
  END IF;

  IF p_role = 'therapist' AND v_clean_code IS NOT NULL THEN
    RAISE EXCEPTION 'Therapists cannot register with a therapist code';
  END IF;

  SELECT *
  INTO v_existing
  FROM public.user_access_statuses
  WHERE public.user_access_statuses.user_id = v_user_id
  FOR UPDATE;

  IF p_role = 'therapist' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'therapist'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'user'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  IF v_existing.user_id IS NULL THEN
    IF p_role = 'therapist' THEN
      v_generated_code := public.generate_unique_therapist_code();
    END IF;

    INSERT INTO public.user_access_statuses (
      user_id,
      role,
      linked_therapist_id,
      therapist_code
    ) VALUES (
      v_user_id,
      p_role,
      CASE WHEN p_role = 'patient' THEN v_linked_therapist_id ELSE NULL END,
      CASE WHEN p_role = 'therapist' THEN v_generated_code ELSE NULL END
    )
    RETURNING * INTO v_existing;
  ELSE
    IF v_existing.role <> p_role THEN
      RAISE EXCEPTION 'Account role already set and cannot be changed';
    END IF;

    IF p_role = 'patient' AND v_linked_therapist_id IS NOT NULL AND v_existing.linked_therapist_id IS NULL THEN
      UPDATE public.user_access_statuses
      SET linked_therapist_id = v_linked_therapist_id,
          updated_at = now()
      WHERE public.user_access_statuses.user_id = v_user_id
      RETURNING * INTO v_existing;
    END IF;
  END IF;

  RETURN QUERY
  SELECT v_existing.user_id, v_existing.role, v_existing.payment_status, v_existing.trial_ends_at, v_existing.linked_therapist_id, v_existing.therapist_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_access_state()
RETURNS TABLE (
  user_id uuid,
  role public.access_role,
  stored_payment_status public.access_payment_status,
  effective_payment_status public.access_payment_status,
  registration_date timestamptz,
  trial_ends_at timestamptz,
  linked_therapist_id uuid,
  therapist_code text,
  covered_by_therapist boolean,
  can_submit_payment_request boolean,
  is_locked boolean,
  lock_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_access public.user_access_statuses%ROWTYPE;
  v_therapist public.user_access_statuses%ROWTYPE;
  v_effective public.access_payment_status;
  v_lock_message text := NULL;
  v_covered boolean := false;
  v_can_request boolean := true;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT *
  INTO v_access
  FROM public.user_access_statuses
  WHERE public.user_access_statuses.user_id = v_user_id;

  IF v_access.user_id IS NULL THEN
    RAISE EXCEPTION 'Access profile not initialized';
  END IF;

  IF v_access.linked_therapist_id IS NOT NULL THEN
    SELECT *
    INTO v_therapist
    FROM public.user_access_statuses
    WHERE public.user_access_statuses.user_id = v_access.linked_therapist_id;
  END IF;

  IF v_access.role = 'therapist' THEN
    IF v_access.payment_status = 'active' THEN
      v_effective := 'active';
    ELSIF now() <= v_access.trial_ends_at THEN
      v_effective := 'trial';
    ELSE
      v_effective := 'locked';
      v_lock_message := 'Your 30-day trial has ended. Submit a payment request to renew access for 300 NIS per year.';
    END IF;
  ELSE
    IF v_access.linked_therapist_id IS NOT NULL AND v_therapist.user_id IS NOT NULL AND v_therapist.payment_status = 'active' THEN
      v_effective := 'active';
      v_covered := true;
    ELSIF v_access.payment_status = 'active' THEN
      v_effective := 'active';
    ELSIF now() <= v_access.trial_ends_at THEN
      v_effective := 'trial';
    ELSE
      v_effective := 'locked';
      IF v_access.linked_therapist_id IS NOT NULL THEN
        v_lock_message := 'Contact your therapist to renew NestAI access.';
        v_can_request := false;
      ELSE
        v_lock_message := 'Your 30-day trial has ended. Submit a payment request to renew access for 20 NIS.';
      END IF;
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    v_access.user_id,
    v_access.role,
    v_access.payment_status,
    v_effective,
    v_access.registration_date,
    v_access.trial_ends_at,
    v_access.linked_therapist_id,
    v_access.therapist_code,
    v_covered,
    v_can_request,
    (v_effective = 'locked'),
    v_lock_message;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_payment_request(
  p_contact_name text DEFAULT NULL,
  p_message text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  amount_ils integer,
  status public.payment_request_status,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_access RECORD;
  v_email text;
  v_amount integer;
  v_name text := NULLIF(btrim(coalesce(p_contact_name, '')), '');
  v_message text := NULLIF(btrim(coalesce(p_message, '')), '');
  v_request_id uuid;
  v_request_status public.payment_request_status;
  v_created_at timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF v_name IS NOT NULL AND char_length(v_name) > 120 THEN
    RAISE EXCEPTION 'Contact name is too long';
  END IF;

  IF v_message IS NOT NULL AND char_length(v_message) > 1000 THEN
    RAISE EXCEPTION 'Message is too long';
  END IF;

  SELECT *
  INTO v_access
  FROM public.get_my_access_state();

  IF v_access.is_locked IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Payment requests are only available for locked accounts';
  END IF;

  IF v_access.can_submit_payment_request IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'This account depends on therapist renewal';
  END IF;

  SELECT au.email::text
  INTO v_email
  FROM auth.users au
  WHERE au.id = v_user_id;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Unable to determine contact email';
  END IF;

  v_amount := CASE
    WHEN v_access.role = 'therapist' THEN 300
    ELSE 20
  END;

  INSERT INTO public.payment_requests (
    user_id,
    role,
    linked_therapist_id,
    amount_ils,
    contact_email,
    contact_name,
    message
  ) VALUES (
    v_user_id,
    v_access.role,
    v_access.linked_therapist_id,
    v_amount,
    v_email,
    v_name,
    v_message
  )
  RETURNING public.payment_requests.id, public.payment_requests.amount_ils, public.payment_requests.status, public.payment_requests.created_at
  INTO v_request_id, v_amount, v_request_status, v_created_at;

  RETURN QUERY
  SELECT v_request_id, v_amount, v_request_status, v_created_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_payment_status(
  p_user_id uuid,
  p_payment_status public.access_payment_status
)
RETURNS TABLE (
  user_id uuid,
  payment_status public.access_payment_status,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated public.user_access_statuses%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.user_access_statuses
  SET payment_status = p_payment_status,
      updated_at = now()
  WHERE public.user_access_statuses.user_id = p_user_id
  RETURNING * INTO v_updated;

  IF v_updated.user_id IS NULL THEN
    RAISE EXCEPTION 'Access profile not found';
  END IF;

  RETURN QUERY
  SELECT v_updated.user_id, v_updated.payment_status, v_updated.updated_at;
END;
$$;

CREATE TRIGGER update_user_access_statuses_updated_at
BEFORE UPDATE ON public.user_access_statuses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_requests_updated_at
BEFORE UPDATE ON public.payment_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();