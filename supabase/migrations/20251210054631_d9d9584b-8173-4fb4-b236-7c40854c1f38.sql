-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles - only admins can view all roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Create system_messages table
CREATE TABLE public.system_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on system_messages
ALTER TABLE public.system_messages ENABLE ROW LEVEL SECURITY;

-- Everyone can read system messages
CREATE POLICY "Anyone can view system messages"
ON public.system_messages
FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert system messages
CREATE POLICY "Only admins can insert system messages"
ON public.system_messages
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update system messages
CREATE POLICY "Only admins can update system messages"
ON public.system_messages
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete system messages
CREATE POLICY "Only admins can delete system messages"
ON public.system_messages
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default admin user (sarangaisrael@gmail.com)
-- First we need to find the user ID
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'sarangaisrael@gmail.com';
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- Insert first system message with home screen instructions
INSERT INTO public.system_messages (title, body)
VALUES (
  'איך לשמור את LogMe במסך הבית',
  'iPhone (Safari):
1. לחצו על כפתור השיתוף – הריבוע עם החץ כלפי מעלה, בתחתית או בראש המסך.
2. גללו למטה ובחרו "הוסף למסך הבית" (Add to Home Screen).
3. אשרו את השם ולחצו על הוסף. מעכשיו LogMe תופיע כמו אפליקציה רגילה במסך הבית.

Android (Chrome):
1. לחצו על שלוש הנקודות בפינה הימנית העליונה.
2. בחרו "הוסף למסך הבית" או "התקן אפליקציה" (Install app).
3. אשרו, והקיצור יתווסף למסך הבית שלכם.'
);