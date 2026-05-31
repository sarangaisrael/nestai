# דוח אבטחה — NestAI / logme-main
> נוצר: 2026-05-31 | גרסה: 1.0

---

## ציון אבטחה כולל: 5 / 10

| תחום | ציון |
|---|---|
| אימות והרשאות | 5/10 |
| הצפנת נתונים | 6/10 |
| משתני סביבה | 3/10 |
| אבטחת API | 5/10 |
| פרטיות (חוק הגנת הפרטיות) | 6/10 |

הפרויקט בנוי על בסיס טוב — RLS פעיל, הצפנת AES-256-GCM ל-messages, JWT על רוב הפונקציות — אבל יש ליקויים קריטיים מספר שמסכנים נתוני כל המשתמשים.

---

## 🔴 בעיות קריטיות

### CRIT-1 — גישה צולבת לנתוני כל המשתמשים ב-`analyze-content`
**קובץ:** `supabase/functions/analyze-content/index.ts`

הפונקציה מבצעת:
```ts
supabase.from("messages").select("text, role, user_id").eq("role", "user")
// ✗ אין .eq("user_id", ...) — שולפת הודעות של כל המשתמשים
```
כלומר בכל ריצה של ה-cron, כל הודעות היומן של **כל המשתמשים** נשלחות לAI חיצוני (Gemini) בבת-אחת. זו הפרה בוטה של פרטיות, וכן פגיעה בחוק הגנת הפרטיות הישראלי 2011 ובתקנות 2017.

**תיקון:** להוסיף לולאה per-user עם `userId` בכל query, בדיוק כמו שעושה `hourly-summary-check`.

---

### CRIT-2 — עקיפת מנגנון AdminGate דרך ה-Console
**קובץ:** `src/components/AdminGate.tsx` (הגרסה שמשמשת ב-`App.tsx`)

```ts
// בודק:
sessionStorage.getItem("__admin_unlocked__") === "true"

// כל משתמש שפותח את Developer Tools יכול לרשום:
sessionStorage.setItem("__admin_unlocked__", "true")
// ולקבל גישה מלאה ל-Admin Dashboard
```

קיימת גרסה מאובטחת יותר ב-`src/components/admin/AdminGate.tsx` (בודקת `=== data.user.id`), אבל `App.tsx` מייבא את **הגרסה הישנה** בשורה 34.

**תיקון:** לשנות ב-`App.tsx` את הייבוא ל-`"./components/admin/AdminGate"`.

---

### CRIT-3 — קבצי `.env` עם מפתחות פעילים ב-Working Tree
**קבצים:** `.env`, `.env.save`

```
# .env — מפתח anon פעיל לפרויקט dtmjytjfiqunslouucet:
SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# .env.save — מפתח anon לפרויקט שני primcrenfgmaauwasbyk:
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# + מחרוזת לא מוסברת: sb_publishable_AZN3m4M3235iM49TsoTymQ_rdUMIaYgs...
```

אם הקבצים האלה ב-Git history — המפתחות חשופים לכל מי שיש לו גישה ל-repo.

**תיקון:** לוודא ש-`.env` ו-`.env.save` רשומים ב-`.gitignore`. אם הם כבר ב-git history — לבצע rotate לשני ה-anon keys בדשבורד Supabase.

---

### CRIT-4 — `system_messages` קריאה ציבורית ל-anon (כולל system prompts)
**Migration:** `20260316132757`

```sql
CREATE POLICY "Anyone can view system messages"
  ON public.system_messages FOR SELECT TO anon USING (true);
```

הטבלה מכילה: `chat_system_prompt`, `summary_system_prompt`, `ai_site_instruction`, `app_instructions`, `daily_push_settings`. כל גולש ללא אימות יכול לשלוף את ה-system prompts של ה-AI — זו חשיפה של ה-"secret sauce" ועלולה לאפשר prompt injection מתוכנן.

**תיקון:** לשנות את ה-policy ל-`TO authenticated` במקום `TO anon`.

---

### CRIT-5 — `regenerate-summary` שומר סיכום לא מוצפן
**קובץ:** `supabase/functions/regenerate-summary/index.ts`

```ts
await supabase.from("weekly_summaries").update({
  summary_text: newSummaryText,  // ✗ plaintext, לא מוצפן
})
```

כל שאר הפונקציות מצפינות לפני כתיבה. סיכום שנוצר מחדש נשמר בטקסט גלוי, דבר שמפר את עקביות ההצפנה.

**תיקון:** להוסיף `encryptText()` לפני ה-update, בדיוק כמו ב-`hourly-summary-check`.

---

### CRIT-6 — `generate-summary` משתמש ב-Key Derivation שונה מכל שאר הפונקציות
**קובץ:** `supabase/functions/generate-summary/index.ts`

```ts
// generate-summary — משתמש ב-raw base64:
const keyBytes = Uint8Array.from(atob(encryptionKey), c => c.charCodeAt(0));

// כל שאר הפונקציות — SHA-256 hash:
const hashBuffer = await crypto.subtle.digest("SHA-256", keyData);
```

ההודעות **מוצפנות** עם SHA-256(key) ו**מפוענחות** ב-`generate-summary` עם atob(key) — שתי נגזרות שונות. כל פענוח בפונקציה זו ייכשל בשקט ולעיתים יעביר טקסט לא מובן ל-AI.

**תיקון:** לאחד את הלוגיקה — לשנות ב-`generate-summary` לשימוש ב-SHA-256 hash כמו שאר הפונקציות.

---

## 🟡 אזהרות

### WARN-1 — `monthly-summary-scheduler` קורא `weekly_summaries` ללא פענוח
**קובץ:** `supabase/functions/monthly-summary-scheduler/index.ts`

הפונקציה שולפת את `summary_text` מ-`weekly_summaries` ושולחת לAI ליצירת סיכום חודשי. אם השדה מוצפן (כפי שנדרש לאחר השיפורים האחרונים), ה-AI מקבל base64 בלתי מובן.

**תיקון:** להוסיף `decryptText()` לפני שליחת הסיכומים ל-AI.

---

### WARN-2 — `paypal-get-client-id` חשוף ללא שום אימות
**קובץ:** `supabase/functions/paypal-get-client-id/index.ts` | `verify_jwt=false`

אין אימות מכל סוג שהוא. מחזיר את PayPal Client ID וכל מזהי התכניות (plan IDs). Client ID הוא ציבורי מטבעו ב-PayPal, אך חשיפת plan IDs עלולה לאפשר שימוש לרעה.

---

### WARN-3 — `send-push-notification` מאפשר עקיפת אימות דרך Service Role Key
**קובץ:** `supabase/functions/send-push-notification/index.ts`

```ts
const isServiceRoleCaller = bearer === supabaseServiceKey;
if (isServiceRoleCaller) {
  // עוקף את כל בדיקות ה-userId ו-admin
}
```

הפונקציה `verify_jwt=false` ופתוחה לאינטרנט. כל מי שמחזיק ב-service role key יכול לשלוח push לכל userId ללא בדיקה.

---

### WARN-4 — `paypal-cancel-subscription` משתמש ב-`getClaims` לא-סטנדרטי
**קובץ:** `supabase/functions/paypal-cancel-subscription/index.ts`

```ts
const claims = await supabase.auth.getClaims(token);
```

`getClaims` אינו method סטנדרטי ב-Supabase JS SDK. אם הקריאה נכשלת בשקט, הפונקציה עשויה להמשיך ולאפשר ביטול subscription ללא אימות תקין.

**תיקון:** להחליף ל-`supabase.auth.getUser(token)` — הדרך הסטנדרטית.

---

### WARN-5 — `CORS: *` על כל Edge Functions
כל הפונקציות מחזירות `"Access-Control-Allow-Origin": "*"`. לפונקציות המבצעות פעולות רגישות (encrypt-message, delete-account, regenerate-summary), עדיף להגביל ל-origin הספציפי של הפרויקט.

---

### WARN-6 — Stripe fallback origin מפנה לדומיין dev
**קובץ:** `supabase/functions/stripe-create-checkout/index.ts`

```ts
const origin = req.headers.get("origin") || "https://primcrenfgmaauwasbyk.lovable.app";
```

אם ה-Origin header חסר, Stripe מפנה חזרה ל-Lovable dev URL ולא לפרודקשן.

---

### WARN-7 — שתי גרסאות מקבילות של קומפוננטות עם התנהגות שונה
הקבצים הבאים קיימים בשני נתיבים עם קוד שונה:
- `src/components/AdminGate.tsx` vs `src/components/admin/AdminGate.tsx`
- `src/pages/AdminDashboard.tsx` vs `src/pages/admin/AdminDashboard.tsx`
- `src/components/WeeklyQuestionnaire.tsx` vs `src/components/insights/WeeklyQuestionnaire.tsx`

מסוכן מכיוון ששינוי אבטחה בגרסה אחת לא יחול בגרסה השנייה.

---

### WARN-8 — `heuristic looksEncrypted()` עשוי לתת false positive
```ts
function looksEncrypted(text: string): boolean {
  if (!text || text.length < 20) return false;
  try { return atob(text).length >= 12; } catch { return false; }
}
```

כל טקסט base64 לגיטימי (כמו URL-safe base64 מ-OAuth, avatar URLs, וכדומה) עלול להיחשב "מוצפן" ויועבר לפענוח — מה שיגרום לשגיאה בשקט ולאובדן התוכן.

---

### WARN-9 — `gratitude_entries` לא נמחקת ב-`delete-account`
**קובץ:** `supabase/functions/delete-account/index.ts`

הטבלה `gratitude_entries` נוספה במיגרציה `20260521105752` אבל לא נכללת ברשימת המחיקה. נתוני משתמש שמחק את חשבונו נשמרים.

---

### WARN-10 — `MailMessages.tsx` מאפשר insert ישיר ל-`system_messages`
**קובץ:** `src/pages/MailMessages.tsx:76`

Insert ישיר מצד הלקוח לטבלת `system_messages` (המכילה system prompts). הגנה תלויה לחלוטין ב-RLS — אם המדיניות לא מגבילה writes ל-admin בלבד, כל משתמש מאומת עלול לשנות system prompts.

---

## ✅ פרקטיקות טובות

### ENC-1 — הצפנת AES-256-GCM ל-messages
הודעות היומן מוצפנות בצד הלקוח לפני כתיבה ל-DB, ומפוענחות רק לפי צורך בצד ה-Edge Function. המפתח אינו מגיע לקליינט.

### ENC-2 — הצפנת `weekly_summaries` (hourly-summary-check)
`hourly-summary-check` מצפין את `summary_text` לפני כתיבה. `encrypt-existing-summaries` קיים לצורך הצפנה רטרואקטיבית.

### RLS-1 — RLS פעיל על כל הטבלאות
כל הטבלאות שנבדקו כוללות `ENABLE ROW LEVEL SECURITY`. ה-default הוא deny.

### RLS-2 — `user_roles` מוגנת מכתיבה
```sql
CREATE POLICY "Deny writes to user_roles for authenticated"
  ON user_roles FOR INSERT WITH CHECK (false);
```
רק service_role יכול לשנות roles — לא ניתן להסלמת הרשאות מצד הלקוח.

### AUTH-1 — JWT + בדיקת role כפולה לפונקציות admin
`send-push-to-all`, `content-insights`, `regenerate-summary` (cross-user) — כולן דורשות JWT תקין + בדיקת admin role מול `user_roles`.

### AUTH-2 — `verify-admin-password` דורש JWT + סיסמה נפרדת
Admin dashboard מחייב שני גורמי אימות: JWT תקין + `ADMIN_ACCESS_PASSWORD` מ-env.

### AUTH-3 — `delete-account` מוגן ב-JWT ומוחק נתוני משתמש מ-16 טבלאות
כולל מחיקת המשתמש מ-`auth.users` דרך `adminClient.auth.admin.deleteUser()`.

### ENV-1 — אין `service_role` key ב-client code
Grep על `src/` לא מצא אף `service_role` key, `ADMIN_ACCESS_PASSWORD`, או `MESSAGE_ENCRYPTION_KEY`.

### PUSH-1 — `push_subscriptions` חושפת רק metadata, לא את ה-keys
מיגרציה מגינה שלא יחשפו שדות `endpoint`, `p256dh`, `auth` (Web Push keys) דרך select ציבורי.

---

## המלצות לפי עדיפות

### עדיפות גבוהה (לפני production הבא)

| # | בעיה | פעולה |
|---|---|---|
| P1 | CRIT-2: AdminGate bypass | שנה ב-`App.tsx` שורה 34: `import AdminGate from "./components/admin/AdminGate"` |
| P2 | CRIT-1: Cross-tenant messages | הוסף לולאה per-user ב-`analyze-content` |
| P3 | CRIT-5: regenerate-summary plaintext | הצפן ב-`encryptText()` לפני `update` |
| P4 | CRIT-4: system_messages anon-read | שנה policy ל-`TO authenticated` |
| P5 | WARN-9: gratitude_entries לא נמחקת | הוסף `DELETE FROM gratitude_entries WHERE user_id = $1` ל-`delete-account` |

### עדיפות בינונית (Sprint הבא)

| # | בעיה | פעולה |
|---|---|---|
| P6 | CRIT-6: key derivation inconsistency | עדכן `generate-summary` לשימוש ב-SHA-256 |
| P7 | CRIT-3: .env files in git | הוסף `.env*` ל-`.gitignore`; rotate anon keys |
| P8 | WARN-1: monthly-summary לא מפענח | הוסף `decryptText()` לפני שליחה ל-AI |
| P9 | WARN-4: getClaims לא-סטנדרטי | החלף ל-`getUser(token)` ב-paypal-cancel |
| P10 | WARN-7: קוד כפול עם behavior שונה | מחק גרסאות ישנות, קנן לפי `src/components/admin/` |

### עדיפות נמוכה (Backlog)

| # | בעיה | פעולה |
|---|---|---|
| P11 | WARN-5: CORS wildcard | הגבל Origin לדומיין הפרודקשן |
| P12 | WARN-6: Stripe dev origin | החלף fallback ל-`https://nestai.care` |
| P13 | WARN-8: looksEncrypted heuristic | שמור byte-prefix ייחודי (magic bytes) בתוצאת ההצפנה |
| P14 | WARN-10: MailMessages insert | ודא RLS מגבילה writes ל-system_messages ל-admin בלבד |

---

## מפת הצפנה — מצב נוכחי

| טבלה | שדות רגישים | מוצפן? | הערות |
|---|---|---|---|
| `messages` | `text` | ✅ AES-256-GCM | מוצפן ב-`encrypt-message` |
| `weekly_summaries` | `summary_text` | ⚠️ חלקי | מוצפן ב-hourly-check; **לא** ב-regenerate |
| `monthly_summaries` | `summary_text` | ❌ לא | נכתב plaintext על ידי monthly-scheduler |
| `mood_entries` | `mood` | ❌ לא | ערך enum (happy/sad/etc) — נמוך-סיכון |
| `profiles` | `first_name`, `email`, `paypal_*` | ❌ לא | נמצא ב-DB plaintext |
| `push_subscriptions` | `endpoint`, `p256dh`, `auth` | ❌ לא | RLS מגינה, לא חשוף בquery |
| `weekly_questionnaires` | ציונים קליניים q1-q4 | ❌ לא | נתון פסיכולוגי רגיש |
| `gratitude_entries` | `text` | ❌ לא | תוכן יומן, plaintext |

---

## סיכום עמידה בחוק הגנת הפרטיות הישראלי

| דרישה | מצב |
|---|---|
| מידע רגיש (מידע בריאות/פסיכולוגי) מוגן | ⚠️ חלקי — messages מוצפנות, questionnaires ו-gratitude לא |
| זכות מחיקה | ✅ קיימת (delete-account), חסרה `gratitude_entries` |
| שקיפות על איסוף מידע | ✅ עמוד פרטיות קיים (`/app/privacy`) |
| מניעת גישה לא מורשית | ⚠️ בעיות ב-analyze-content, AdminGate |
| מינימום נתונים | ⚠️ `professional_leads` שומרת טלפון ואימייל ללא הגבלת זמן ברורה |
| הגבלת שמירת נתונים | ❌ אין retention policy מוגדרת בקוד |

---

*דוח זה נוצר ב-static analysis. מומלץ להשלים עם penetration test דינמי לפני השקה רחבה.*
