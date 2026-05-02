CREATE TABLE IF NOT EXISTS landing_content (
  id BIGINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  -- Navbar
  nav_logo            TEXT NOT NULL DEFAULT 'NestAI',
  nav_cta1_text       TEXT NOT NULL DEFAULT 'למטפלים',
  nav_cta2_text       TEXT NOT NULL DEFAULT 'התחל בחינם',
  -- Hero
  hero_line1          TEXT NOT NULL DEFAULT 'הרצף הטיפולי',
  hero_line2          TEXT NOT NULL DEFAULT 'מתחיל כאן',
  hero_subtitle       TEXT NOT NULL DEFAULT 'NestAI מאפשרת למטופלים לתעד את היומיום שלהם בין הפגישות — ולמטפל לקבל סיכום מוכן לפני כל מפגש.',
  hero_cta1           TEXT NOT NULL DEFAULT 'התחל בחינם ←',
  hero_cta2           TEXT NOT NULL DEFAULT 'למטפלים',
  hero_badge1         TEXT NOT NULL DEFAULT 'ללא הרשמה ארוכה',
  hero_badge2         TEXT NOT NULL DEFAULT 'פרטיות מלאה',
  hero_badge3         TEXT NOT NULL DEFAULT 'חינם לניסיון',
  -- Slide 1
  slide1_title        TEXT NOT NULL DEFAULT 'לא תישאר לבד עם המחשבות',
  slide1_subtitle     TEXT NOT NULL DEFAULT 'האפליקציה מלווה אותך בין הפגישות — בשיחה טבעית, בלי לחץ.',
  slide1_bullet1      TEXT NOT NULL DEFAULT 'תיעוד יומי טבעי',
  slide1_bullet2      TEXT NOT NULL DEFAULT 'אין משימות ואין לחץ',
  slide1_bullet3      TEXT NOT NULL DEFAULT 'הכל שמור ומוגן',
  -- Slide 2
  slide2_title        TEXT NOT NULL DEFAULT 'סיכום מוכן לפני כל פגישה',
  slide2_subtitle     TEXT NOT NULL DEFAULT 'המטפל מקבל תמונה מלאה לפני כל סשן — בלי לבקש ובלי להכין.',
  slide2_bullet1      TEXT NOT NULL DEFAULT 'סיכום אוטומטי לפני כל פגישה',
  slide2_bullet2      TEXT NOT NULL DEFAULT 'זיהוי דפוסים התנהגותיים',
  slide2_bullet3      TEXT NOT NULL DEFAULT 'מניעת נשירה',
  -- Slide 3
  slide3_title        TEXT NOT NULL DEFAULT 'הברית שמחזיקה את הטיפול',
  slide3_subtitle     TEXT NOT NULL DEFAULT 'הרצף בין הפגישות הוא מה שמחזיק את התהליך הטיפולי.',
  slide3_bullet1      TEXT NOT NULL DEFAULT 'מחזקת את הקשר בין מטפל למטופל',
  slide3_bullet2      TEXT NOT NULL DEFAULT 'הנתונים שייכים למטופל',
  slide3_bullet3      TEXT NOT NULL DEFAULT 'בנויה על אמון',
  -- Audience cards
  card1_title         TEXT NOT NULL DEFAULT 'למטפלים',
  card1_body          TEXT NOT NULL DEFAULT 'קבל סיכום מוכן לפני כל פגישה. המטופל מתעד ואתה מתמקד בטיפול.',
  card1_cta           TEXT NOT NULL DEFAULT 'הצטרף כמטפל ←',
  card2_title         TEXT NOT NULL DEFAULT 'למטופלים',
  card2_body          TEXT NOT NULL DEFAULT 'תיעוד פשוט ויומיומי. לא תישאר לבד עם המחשבות.',
  card2_cta           TEXT NOT NULL DEFAULT 'התחל בחינם ←',
  -- Footer
  footer_text         TEXT NOT NULL DEFAULT '© 2025 NestAI.care — הפלטפורמה מספקת כלים לתיעוד בלבד.',
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed with defaults (id=1, single row)
INSERT INTO landing_content (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Allow public read, authenticated write
ALTER TABLE landing_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_landing_content"  ON landing_content FOR SELECT USING (true);
CREATE POLICY "service_write_landing_content" ON landing_content FOR ALL USING (auth.role() = 'service_role');
