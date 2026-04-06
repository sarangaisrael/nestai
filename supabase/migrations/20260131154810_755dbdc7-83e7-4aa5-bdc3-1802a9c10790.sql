
-- Add DELETE policy for subscriptions table
-- Users should only be able to delete their own subscriptions
CREATE POLICY "Users can delete their own subscriptions" 
ON public.subscriptions 
FOR DELETE 
USING (auth.uid() = user_id);
