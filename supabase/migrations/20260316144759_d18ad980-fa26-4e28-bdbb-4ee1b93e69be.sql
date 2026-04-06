
-- Landing page blocks table
CREATE TABLE public.landing_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_type text NOT NULL DEFAULT 'custom',
  sort_order integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_blocks ENABLE ROW LEVEL SECURITY;

-- Anyone can read (public landing page)
CREATE POLICY "Anyone can view landing blocks" ON public.landing_blocks
  FOR SELECT TO anon USING (true);

CREATE POLICY "Authenticated can view landing blocks" ON public.landing_blocks
  FOR SELECT TO authenticated USING (true);

-- Only admins can modify
CREATE POLICY "Admins can insert landing blocks" ON public.landing_blocks
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update landing blocks" ON public.landing_blocks
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete landing blocks" ON public.landing_blocks
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default blocks matching current landing page structure
INSERT INTO public.landing_blocks (block_type, sort_order, visible, config) VALUES
  ('hero', 1, true, '{}'),
  ('why', 2, true, '{}'),
  ('features', 3, true, '{}'),
  ('media', 4, true, '{}'),
  ('cta', 5, true, '{}');
