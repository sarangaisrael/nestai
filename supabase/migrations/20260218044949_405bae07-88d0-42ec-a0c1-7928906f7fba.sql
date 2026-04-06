
-- Feature toggles table for nav buttons and feature flags
CREATE TABLE public.feature_toggles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  category text NOT NULL DEFAULT 'feature', -- 'nav' | 'feature'
  config jsonb DEFAULT '{}'::jsonb, -- url, icon, order, etc.
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_toggles ENABLE ROW LEVEL SECURITY;

-- Everyone can read (app needs this to render nav/features)
CREATE POLICY "Anyone can view feature toggles"
  ON public.feature_toggles FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "Only admins can insert feature toggles"
  ON public.feature_toggles FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update feature toggles"
  ON public.feature_toggles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete feature toggles"
  ON public.feature_toggles FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_feature_toggles_updated_at
  BEFORE UPDATE ON public.feature_toggles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default nav items and feature flags
INSERT INTO public.feature_toggles (key, label, category, enabled, config) VALUES
  ('nav_dashboard', 'דשבורד', 'nav', true, '{"url": "/app/dashboard", "icon": "BarChart3", "order": 1}'::jsonb),
  ('nav_settings', 'הגדרות', 'nav', true, '{"url": "/app/settings", "icon": "Settings", "order": 2}'::jsonb),
  ('nav_monthly_summary', 'סיכום חודשי', 'nav', true, '{"url": "/app/monthly-summary", "icon": "Calendar", "order": 3}'::jsonb),
  ('nav_meditation', 'מדיטציה', 'nav', true, '{"url": "/app/meditation", "icon": "Brain", "order": 4}'::jsonb),
  ('nav_mail', 'הודעות', 'nav', true, '{"url": "/app/mail", "icon": "Mail", "order": 5}'::jsonb),
  ('feature_monthly_trends', 'דוח מגמות חודשי', 'feature', true, '{}'::jsonb),
  ('feature_voice_input', 'הקלטה קולית', 'feature', true, '{}'::jsonb),
  ('feature_weekly_questionnaire', 'שאלון שבועי', 'feature', true, '{}'::jsonb),
  ('feature_push_notifications', 'התראות פוש', 'feature', true, '{}'::jsonb);

-- Seed AI site instruction into system_messages if not exists
INSERT INTO public.system_messages (title, body)
SELECT 'ai_site_instruction', 'הוראות כלליות לבוט: היה תמציתי, חם ולא שיפוטי.'
WHERE NOT EXISTS (SELECT 1 FROM public.system_messages WHERE title = 'ai_site_instruction');
