-- Remove email column from profiles table to prevent data exposure
-- Emails should only be accessed from auth.users (protected by Supabase)

-- First, drop the trigger and function that syncs email
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- Update the function to not insert email anymore
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- Remove the email column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- Create a secure admin-only function to get user emails
-- This function accesses auth.users which is protected and only accessible via service role
-- It checks that the calling user is an admin before returning data
CREATE OR REPLACE FUNCTION public.get_admin_user_emails(user_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to call this function
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  
  RETURN QUERY
  SELECT au.id as user_id, au.email::text
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;