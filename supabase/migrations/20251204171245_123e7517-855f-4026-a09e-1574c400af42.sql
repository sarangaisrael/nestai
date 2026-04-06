-- תיקון מדיניות profiles - הוספת INSERT ו-DELETE
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);

-- תיקון מדיניות summary_logs - מחיקת המדיניות המגבילות מדי
DROP POLICY IF EXISTS "Service role can insert summary logs" ON public.summary_logs;
DROP POLICY IF EXISTS "Service role can update summary logs" ON public.summary_logs;
DROP POLICY IF EXISTS "Service role can delete summary logs" ON public.summary_logs;