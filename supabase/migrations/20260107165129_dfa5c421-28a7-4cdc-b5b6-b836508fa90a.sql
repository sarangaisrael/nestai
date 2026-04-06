
-- Fix push_subscriptions: Add explicit denial for anonymous access
CREATE POLICY "Deny anonymous access to push_subscriptions" 
ON public.push_subscriptions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix user_preferences: Add explicit denial for anonymous access  
CREATE POLICY "Deny anonymous access to user_preferences"
ON public.user_preferences
FOR SELECT
USING (auth.uid() IS NOT NULL);
