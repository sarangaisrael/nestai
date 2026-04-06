-- תיקון מדיניות טבלת profiles - אפשר למשתמשים לראות את הפרופיל שלהם
DROP POLICY IF EXISTS "Only service role can access profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- הוספת מדיניות UPDATE ו-DELETE לטבלת weekly_summaries
CREATE POLICY "Users can update their own summaries"
ON public.weekly_summaries
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own summaries"
ON public.weekly_summaries
FOR DELETE
USING (auth.uid() = user_id);

-- הוספת מדיניות DELETE לטבלת user_preferences
CREATE POLICY "Users can delete their own preferences"
ON public.user_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- עדכון מדיניות summary_logs - הגבלת INSERT רק ל-service role
-- קודם מסירים את המדיניות הקיימת אם יש
DROP POLICY IF EXISTS "Service role can insert summary logs" ON public.summary_logs;

-- יוצרים מדיניות חדשה שמונעת INSERT מכל משתמש רגיל
CREATE POLICY "Service role can insert summary logs"
ON public.summary_logs
FOR INSERT
WITH CHECK (false);

-- מדיניות UPDATE ו-DELETE עבור summary_logs - גם מוגבלות
CREATE POLICY "Service role can update summary logs"
ON public.summary_logs
FOR UPDATE
USING (false);

CREATE POLICY "Service role can delete summary logs"
ON public.summary_logs
FOR DELETE
USING (false);