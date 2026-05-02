-- Add tools section columns to landing_content table
ALTER TABLE landing_content
  ADD COLUMN IF NOT EXISTS tools_title    TEXT NOT NULL DEFAULT 'הכלים שילוו אותך',
  ADD COLUMN IF NOT EXISTS tools_subtitle TEXT NOT NULL DEFAULT 'פשוט, יומיומי, ומדויק לתהליך הטיפולי',
  ADD COLUMN IF NOT EXISTS tool1_icon     TEXT NOT NULL DEFAULT '📝',
  ADD COLUMN IF NOT EXISTS tool1_title    TEXT NOT NULL DEFAULT 'תיעוד יומי',
  ADD COLUMN IF NOT EXISTS tool1_text     TEXT NOT NULL DEFAULT 'רשום מה עבר עליך בין הפגישות — מחשבה, רגש, או רגע שרצית לשמור. בלי לחץ, בלי משימות.',
  ADD COLUMN IF NOT EXISTS tool2_icon     TEXT NOT NULL DEFAULT '📊',
  ADD COLUMN IF NOT EXISTS tool2_title    TEXT NOT NULL DEFAULT 'דוח מגמות',
  ADD COLUMN IF NOT EXISTS tool2_text     TEXT NOT NULL DEFAULT 'זיהוי אוטומטי של דפוסים חוזרים לאורך זמן — נושאים, רגשות, ואירועים שחוזרים בין הפגישות.',
  ADD COLUMN IF NOT EXISTS tool3_icon     TEXT NOT NULL DEFAULT '🗓️',
  ADD COLUMN IF NOT EXISTS tool3_title    TEXT NOT NULL DEFAULT 'סיכום לפני פגישה',
  ADD COLUMN IF NOT EXISTS tool3_text     TEXT NOT NULL DEFAULT 'לפני כל מפגש, המטפל מקבל סיכום מוכן — בלי לבקש, בלי להכין. המטופל מתעד, אתה מתמקד.';
