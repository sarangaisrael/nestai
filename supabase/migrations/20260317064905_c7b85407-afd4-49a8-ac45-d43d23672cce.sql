
CREATE TABLE public.professional_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.professional_leads ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (no auth required for demo page)
CREATE POLICY "Anyone can insert professional leads"
ON public.professional_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view
CREATE POLICY "Admins can view professional leads"
ON public.professional_leads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete
CREATE POLICY "Admins can delete professional leads"
ON public.professional_leads
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
