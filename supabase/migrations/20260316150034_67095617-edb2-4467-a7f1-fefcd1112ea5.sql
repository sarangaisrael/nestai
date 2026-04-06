
UPDATE landing_blocks 
SET block_type = 'problem_solution',
    config = '{"problem_title":"הגשר הנרטיבי: להגיע למפגש הבא מוכנים יותר","problem_body":"Nest AI היא גשר נרטיבי, לא כלי התערבות. בגישת אפס התערבות קלינית, אנחנו מעניקים למטופל מקום בטוח לאסוף את מחשבותיו ולהפיק סיכום שבועי מדויק. המטופל מגיע לפגישה מבושל ומוכן, מה שמחזק את הברית הטיפולית ומאפשר לך להתמקד בעיקר מהרגע הראשון.","solution_title":"המשכיות טיפולית המבוססת על נתונים אנושיים","solution_body":"אנחנו מאפשרים לקליניקה שלך לאמץ מודל של טיפול מבוסס מדידה (Measurement-Based Care) מבלי לאבד את האנושיות של התהליך. איסוף נתונים אובייקטיבי וניטור מגמות רגשיות לאורך זמן מגדילים סטטיסטית את סיכויי ההחלמה ומחזקים את המעורבות של המטופל בתהליך."}'::jsonb,
    updated_at = now()
WHERE id = '116326e7-99ba-41d6-86b0-0142f57e3b25';

DELETE FROM landing_blocks WHERE id = '302cf1cd-0aca-4992-b3db-c1705468cf5e';

UPDATE landing_blocks SET sort_order = 5 WHERE id = '65f9a7fd-539e-487e-a19b-1b4de70c084d';
UPDATE landing_blocks SET sort_order = 6 WHERE id = '95974e39-2e05-45c0-93ca-bb19c193a607';
