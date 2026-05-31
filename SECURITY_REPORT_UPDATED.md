# דוח אבטחה מעודכן — NestAI (logme-main)
**תאריך:** 31 מאי 2026  
**ביקורת קודמת:** ציון 5/10  
**ביקורת נוכחית:** ציון **7.5 / 10** ⬆️

---

## סיכום מנהלים

כל 6 הבעיות הקריטיות שזוהו בביקורת הקודמת תוקנו. המערכת עברה שיפור משמעותי בהגנה על מידע משתמשים, בבידוד בין משתמשים ובניהול סודות. נותרו מספר בעיות בדרגת אזהרה, שחלקן קריטיות לפונקציונליות (פענוח חודשי, תאימות מפתח הצפנה) ומצריכות טיפול בגרסה הבאה.

---

## ציון אבטחה

| קטגוריה | ציון קודם | ציון נוכחי |
|---|---|---|
| אימות והרשאות | 4/10 | 8/10 |
| הצפנת מידע | 5/10 | 8/10 |
| ניהול סודות | 3/10 | 9/10 |
| אבטחת API | 6/10 | 7/10 |
| פרטיות ומחיקת מידע | 6/10 | 9/10 |
| **סה"כ** | **5/10** | **7.5/10** |

---

## ✅ בעיות קריטיות שתוקנו

### CRIT-1 — דליפת מידע חוצה-משתמשים ב-`analyze-content` ✅
**מה היה:** הפונקציה שלפה הודעות מ-**כל** המשתמשים ללא סינון, ושלחה את כולן ל-AI לניתוח.  
**מה תוקן:**  
- נוסף פרסור `user_id` מגוף הבקשה (body).  
- אם `user_id` חסר — מוחזרת שגיאת `400` ולא מתבצעת שום שאילתה.  
- נוסף `.eq("user_id", userId)` לשאילתת `messages`.  
```ts
// לפני התיקון
.from("messages").select("text").eq("role", "user")...

// אחרי התיקון
.from("messages").select("text").eq("user_id", userId).eq("role", "user")...
```

---

### CRIT-2 — AdminGate עקף הגנת מנהל ✅
**מה היה:** `App.tsx` ייבא את הגרסה הישנה (`./components/AdminGate`) שבדקה אם sessionStorage מכיל את המחרוזת `"true"` — ניתן לזיוף בקלות ב-DevTools.  
**מה תוקן:** הנתיב שונה ל-`./components/admin/AdminGate` — הגרסה המאובטחת שמאחסנת ומשווה את ה-UUID של המשתמש.  
```ts
// לפני
const AdminGate = lazy(() => import("./components/AdminGate"));

// אחרי
const AdminGate = lazy(() => import("./components/admin/AdminGate"));
```

---

### CRIT-3 — קבצי `.env` עלולים להיכנס ל-Git ✅
**מה היה:** `.gitignore` לא כלל כלל `.env` — סיסמאות ומפתחות API היו עלולים להתפרסם ב-repository.  
**מה תוקן:** נוספו שלושה כללים בתחילת `.gitignore`:  
```
.env
.env.*
.env.save
```
כיסוי מלא: `.env.local`, `.env.production`, `.env.staging` ועוד.

---

### CRIT-4 — `system_messages` נגישה לאנונימים ✅
**מה היה:** טבלת `system_messages` הייתה קריאה ללא אימות — כל משתמש אנונימי יכול היה לראות הנחיות-מערכת, פרומפטים פנימיים ותצורה.  
**מה תוקן:** נוצרה מיגרציה `20260531000001_fix_system_messages_rls.sql`:  
```sql
DROP POLICY IF EXISTS "Allow public read access" ON system_messages;
-- [+ 3 וריאנטים נוספים]

CREATE POLICY "Authenticated users can read system messages"
  ON system_messages FOR SELECT TO authenticated USING (true);
```
> ⚠️ **דרוש:** הפעלת המיגרציה בסביבת ה-production עדיין ממתינה.

---

### CRIT-5 — `regenerate-summary` שמר סיכומים ב-plaintext ✅
**מה היה:** לפונקציה הייתה `decryptText` (לקריאה) אך לא `encryptText` — כשהיא כתבה סיכום מחודש, הוא נשמר ב-DB ללא הצפנה.  
**מה תוקן:** נוספה `encryptText` זהה לפונקציות האחרות; שני מסלולי השמירה (שבועי + חודשי) הוצפנו:  
```ts
const encryptionKey = Deno.env.get("MESSAGE_ENCRYPTION_KEY");
const textToSave = encryptionKey
  ? await encryptText(newSummaryText, encryptionKey)
  : newSummaryText;

await supabase.from("weekly_summaries").update({ summary_text: textToSave })...
```
הלקוח מקבל עדיין את ה-plaintext בתגובה — אין צורך בפענוח נוסף בצד הלקוח לאחר regenerate.

---

### CRIT-6 — `gratitude_entries` לא נמחקה במחיקת חשבון ✅
**מה היה:** הטבלה נוצרה במיגרציה `20260521105752` אך לא נוספה לרשימת הטבלאות ב-`delete-account`.  
**מה תוקן:** `gratitude_entries` נוספה למערך ה-18 טבלאות:  
```ts
const tables = [
  "messages", "weekly_summaries", ...,
  "gratitude_entries",  // ← נוסף
  "user_preferences", ...
];
```

---

## 🟡 בעיות פתוחות

### 🟡 WARN-1 — `MonthlySummary.tsx` לא מפענח סיכומים [**חומרה: גבוהה**]
**תיאור:** `Summary.tsx` מכיל `decryptText` ומפענח נכון. `MonthlySummary.tsx` **לא** מכיל לוגיקת פענוח כלל — קורא `summary_text` ומגיש ישירות ל-`parseReport()`. כעת שה-`regenerate-summary` מוצפן וה-`hourly-summary-check` מוצפן, המשתמשים יראו טקסט base64 גולמי במקום סיכום חודשי.  
**תיקון מוצע:** הוסף `decryptText` + `looksEncrypted` ל-`MonthlySummary.tsx` בדיוק כפי שנעשה ב-`Summary.tsx`.

---

### 🟡 WARN-2 — `analyze-content` משתמש בנגזרת מפתח שונה [**חומרה: גבוהה**]
**תיאור:** כל שאר הפונקציות (hourly-summary-check, regenerate-summary, encrypt-existing-summaries) משתמשות ב:  
```ts
const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(keyString));
```
אך `analyze-content` משתמש ב:  
```ts
const keyBytes = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
```
כלומר הוא מצפה למפתח base64 גולמי ולא למחרוזת רגילה — **הפענוח יכשל** על הודעות שהוצפנו ע"י הפונקציות האחרות.  
**תיקון מוצע:** תאם את `decryptText` ב-`analyze-content` לאותה לוגיקה: `SHA-256(encode(keyString))`.

---

### 🟡 WARN-3 — הגרסה הישנה של `AdminGate` עדיין קיימת [**חומרה: בינונית**]
**תיאור:** הקובץ `src/components/AdminGate.tsx` (הגרסה הלא-מאובטחת עם `sessionStorage === "true"`) עדיין קיים בקוד-בסיס, אם כי כבר לא מיובא.  
**סיכון:** ייבוא בשוגג בעתיד, או בלבול מצד מפתחים.  
**תיקון מוצע:** מחק את `src/components/AdminGate.tsx` ואת הנתיב הישן.

---

### 🟡 WARN-4 — `encrypt-existing-summaries` לא רשום ב-`config.toml` [**חומרה: בינונית**]
**תיאור:** הפונקציה החדשה `encrypt-existing-summaries` נוצרה כקובץ אך אין לה רשומה ב-`supabase/config.toml` (הגדרת `verify_jwt`, port וכו').  
**תיקון מוצע:** הוסף:  
```toml
[functions.encrypt-existing-summaries]
verify_jwt = false
```

---

### 🟡 WARN-5 — קוראים ל-`analyze-content` צריכים עדכון [**חומרה: בינונית**]
**תיאור:** הפונקציה דורשת כעת `user_id` בגוף הבקשה. לא נמצאו קוראים ב-`src/` — ייתכן שהיא מופעלת רק מ-cron חיצוני. כל קריאה ישנה ללא `user_id` תחזיר `400`.  
**תיקון מוצע:** ודא שכל הפעלה (cron / admin dashboard) מעביר `{ user_id: "<uuid>" }` בגוף הבקשה.

---

### 🟡 WARN-6 — CORS פתוח על כל ה-Edge Functions [**חומרה: נמוכה**]
**תיאור:** כל הפונקציות מגדירות `"Access-Control-Allow-Origin": "*"` — כל דומיין יכול לשלוח בקשות.  
**תיקון מוצע:** הגבל ל-`https://nestai.care` בסביבת production.

---

### 🟡 WARN-7 — אין Rate Limiting על Edge Functions [**חומרה: נמוכה**]
**תיאור:** אין הגבלת קצב בקשות על פונקציות כמו `chat`, `regenerate-summary`. חשיפה לשימוש לרעה ו-cost amplification.  
**תיקון מוצע:** הגדר מגבלות ב-Supabase Dashboard או הוסף בדיקת rate limit בפונקציות.

---

### 🟡 WARN-8 — `monthly_summaries` ישנות לא הוצפנו [**חומרה: נמוכה**]
**תיאור:** `encrypt-existing-summaries` מטפל רק ב-`weekly_summaries`. רשומות ישנות ב-`monthly_summaries` נשארות ב-plaintext.  
**תיקון מוצע:** הרחב את הפונקציה לכלול גם `monthly_summaries`.

---

## השוואת מצב — לפני ואחרי

| בעיה | לפני | אחרי |
|---|---|---|
| analyze-content שולח מידע ל-AI ממשתמשים אחרים | ❌ קריטי | ✅ תוקן |
| AdminGate ניתן לעקיפה ב-DevTools | ❌ קריטי | ✅ תוקן |
| .env עלול להיכנס ל-Git | ❌ קריטי | ✅ תוקן |
| system_messages קריאה לאנונימים | ❌ קריטי | ✅ תוקן (ממתין ל-deploy) |
| regenerate-summary שומר plaintext | ❌ קריטי | ✅ תוקן |
| gratitude_entries לא נמחקת | ❌ קריטי | ✅ תוקן |
| MonthlySummary.tsx לא מפענח | ⚠️ לא זוהה | 🟡 פתוח |
| analyze-content — תאימות מפתח הצפנה | ⚠️ לא זוהה | 🟡 פתוח |
| AdminGate ישן עדיין קיים | ⚠️ אזהרה | 🟡 פתוח |
| CORS פתוח | ⚠️ אזהרה | 🟡 פתוח |
| Rate Limiting חסר | ⚠️ אזהרה | 🟡 פתוח |

---

## עדיפויות לשלב הבא

| עדיפות | משימה | מורכבות | השפעה |
|---|---|---|---|
| 🔴 גבוהה | תיקון פענוח ב-`MonthlySummary.tsx` | נמוכה | גבוהה — פונקציונליות שבורה |
| 🔴 גבוהה | תיקון נגזרת מפתח ב-`analyze-content` | נמוכה | גבוהה — פענוח כושל |
| 🟠 בינונית | מחיקת `src/components/AdminGate.tsx` הישן | נמוכה | בינונית |
| 🟠 בינונית | רישום `encrypt-existing-summaries` ב-config.toml | נמוכה | בינונית |
| 🟠 בינונית | עדכון קוראים ל-`analyze-content` עם `user_id` | נמוכה | בינונית |
| 🟡 נמוכה | הגבלת CORS לדומיין production | בינונית | נמוכה |
| 🟡 נמוכה | Rate Limiting על Edge Functions | גבוהה | נמוכה |
| 🟡 נמוכה | הצפנת `monthly_summaries` ישנות | נמוכה | נמוכה |

---

## ממצאים חיוביים (נשמר מהביקורת הקודמת)

- ✅ JWT validation על כל פונקציות המשתמש (`verify_jwt = true`)
- ✅ Cron secret על כל הפונקציות המתוזמנות
- ✅ Service Role Key נשמר בצד שרת בלבד
- ✅ RLS מופעל על כל הטבלאות
- ✅ מחיקת חשבון מלאה כולל auth user
- ✅ הצפנת AES-256-GCM עקבית על הודעות ב-hourly-summary-check
- ✅ פענוח בצד הלקוח ב-Summary.tsx
- ✅ אחסון מפתחות רק ב-Deno.env (לא ב-client bundle) — למעט `VITE_MESSAGE_ENCRYPTION_KEY` שחייב להיות ב-client לפענוח

---

*דוח זה הופק ב-31.05.2026 על בסיס ביקורת קוד סטטית. מומלץ לבצע בדיקת חדירה דינמית (penetration test) לפני השקה מסחרית מלאה.*
