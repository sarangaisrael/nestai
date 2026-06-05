-- Testimonials section for landing page
ALTER TABLE landing_content
  ADD COLUMN IF NOT EXISTS show_testimonials     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS testimonial_1_quote   TEXT NOT NULL DEFAULT 'NestAI שינה לי את כל חוויית הטיפול. אני מגיעה לכל פגישה עם ראש מסודר — במקום לנסות לזכור בזמן אמת מה קרה לי השבוע.',
  ADD COLUMN IF NOT EXISTS testimonial_1_name    TEXT NOT NULL DEFAULT 'מ. כהן',
  ADD COLUMN IF NOT EXISTS testimonial_1_role    TEXT NOT NULL DEFAULT 'בטיפול CBT כבר שנה',
  ADD COLUMN IF NOT EXISTS testimonial_2_quote   TEXT NOT NULL DEFAULT 'סוף סוף יש לי מקום לרשום את מה שעובר עליי בין הפגישות. הסיכום השבועי עוזר לי לא לאבד את הניתוחים שלי כשאני כבר בחדר עם המטפלת.',
  ADD COLUMN IF NOT EXISTS testimonial_2_name    TEXT NOT NULL DEFAULT 'י. לוי',
  ADD COLUMN IF NOT EXISTS testimonial_2_role    TEXT NOT NULL DEFAULT 'בתהליך טיפולי אינטנסיבי',
  ADD COLUMN IF NOT EXISTS testimonial_3_quote   TEXT NOT NULL DEFAULT 'המטופלים שמגיעים עם NestAI מגיעים מוכנים יותר. אני רואה הבדל בעומק השיחות — הם לא מבזבזים 10 דקות על מה קרה השבוע אלא צוללים ישר לעומק.',
  ADD COLUMN IF NOT EXISTS testimonial_3_name    TEXT NOT NULL DEFAULT 'ד"ר מיכל אברהם',
  ADD COLUMN IF NOT EXISTS testimonial_3_role    TEXT NOT NULL DEFAULT 'פסיכולוגית קלינית תל אביב',
  ADD COLUMN IF NOT EXISTS testimonial_4_quote   TEXT NOT NULL DEFAULT 'ממליץ על NestAI לכל המטופלים שלי שרוצים להעמיק את התהליך. הכלי הזה יוצר רצף אמיתי בין הפגישות ומאפשר לנו לעבוד ביעילות הרבה יותר גבוהה.',
  ADD COLUMN IF NOT EXISTS testimonial_4_name    TEXT NOT NULL DEFAULT 'אורי שפירא MSW',
  ADD COLUMN IF NOT EXISTS testimonial_4_role    TEXT NOT NULL DEFAULT 'עובד סוציאלי קליני חיפה';
