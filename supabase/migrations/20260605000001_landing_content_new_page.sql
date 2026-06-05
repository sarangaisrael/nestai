-- Add columns for the redesigned landing page
-- Reuses: nav_cta2_text, hero_line1, hero_line2, hero_subtitle, hero_cta1, hero_badge1-3
-- New columns below

ALTER TABLE landing_content
  ADD COLUMN IF NOT EXISTS hero_eyebrow       TEXT DEFAULT 'מרחב לעיבוד ומעקב של התהליך הטיפולי',
  ADD COLUMN IF NOT EXISTS hero_eyebrow2      TEXT DEFAULT '100% חינם לתמיד',
  ADD COLUMN IF NOT EXISTS steps_title        TEXT DEFAULT '3 צעדים פשוטים בדרך לטיפול אפקטיבי יותר',
  ADD COLUMN IF NOT EXISTS steps_subtitle     TEXT DEFAULT 'מהרגע שאתה פותח את האפליקציה עד לפגישה הבאה — הכל קורה בשביל שתגיע מוכן ומחובר לעצמך.',
  ADD COLUMN IF NOT EXISTS step1_title        TEXT DEFAULT 'כתיבה חופשית',
  ADD COLUMN IF NOT EXISTS step1_body         TEXT DEFAULT 'כותבים שתי דקות ביום את מה שיושב על הלב, בלי לפחד לשכוח שום דבר במפגש.',
  ADD COLUMN IF NOT EXISTS step2_title        TEXT DEFAULT 'ראה את המגמות',
  ADD COLUMN IF NOT EXISTS step2_body         TEXT DEFAULT 'עקוב אחרי דפוסים חוזרים וראה את ההתקדמות הרגשית שלך לאורך זמן.',
  ADD COLUMN IF NOT EXISTS step3_title        TEXT DEFAULT 'מפסיקים לבזבז זמן יקר',
  ADD COLUMN IF NOT EXISTS step3_body         TEXT DEFAULT 'מקבלים סיכום מדויק ישירות לנייד, ומגיעים לקליניקה מוכנים לצלול ישר לעומק.',
  ADD COLUMN IF NOT EXISTS cta_section_title  TEXT DEFAULT 'מוכן/ה להתחיל?',
  ADD COLUMN IF NOT EXISTS cta_section_sub    TEXT DEFAULT 'הצטרף לאלפי משתמשים שמגיעים לכל פגישה מוכנים יותר.',
  ADD COLUMN IF NOT EXISTS cta_section_button TEXT DEFAULT 'מתחילים לכתוב בחינם';

-- Seed defaults into the existing row
UPDATE landing_content SET
  hero_eyebrow       = COALESCE(NULLIF(hero_eyebrow, ''),       'מרחב לעיבוד ומעקב של התהליך הטיפולי'),
  hero_eyebrow2      = COALESCE(NULLIF(hero_eyebrow2, ''),      '100% חינם לתמיד'),
  steps_title        = COALESCE(NULLIF(steps_title, ''),        '3 צעדים פשוטים בדרך לטיפול אפקטיבי יותר'),
  steps_subtitle     = COALESCE(NULLIF(steps_subtitle, ''),     'מהרגע שאתה פותח את האפליקציה עד לפגישה הבאה — הכל קורה בשביל שתגיע מוכן ומחובר לעצמך.'),
  step1_title        = COALESCE(NULLIF(step1_title, ''),        'כתיבה חופשית'),
  step1_body         = COALESCE(NULLIF(step1_body, ''),         'כותבים שתי דקות ביום את מה שיושב על הלב, בלי לפחד לשכוח שום דבר במפגש.'),
  step2_title        = COALESCE(NULLIF(step2_title, ''),        'ראה את המגמות'),
  step2_body         = COALESCE(NULLIF(step2_body, ''),         'עקוב אחרי דפוסים חוזרים וראה את ההתקדמות הרגשית שלך לאורך זמן.'),
  step3_title        = COALESCE(NULLIF(step3_title, ''),        'מפסיקים לבזבז זמן יקר'),
  step3_body         = COALESCE(NULLIF(step3_body, ''),         'מקבלים סיכום מדויק ישירות לנייד, ומגיעים לקליניקה מוכנים לצלול ישר לעומק.'),
  cta_section_title  = COALESCE(NULLIF(cta_section_title, ''),  'מוכן/ה להתחיל?'),
  cta_section_sub    = COALESCE(NULLIF(cta_section_sub, ''),    'הצטרף לאלפי משתמשים שמגיעים לכל פגישה מוכנים יותר.'),
  cta_section_button = COALESCE(NULLIF(cta_section_button, ''), 'מתחילים לכתוב בחינם')
WHERE id = 1;
