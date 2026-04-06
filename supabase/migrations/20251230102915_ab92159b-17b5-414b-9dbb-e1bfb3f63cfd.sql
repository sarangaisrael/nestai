-- Allow admins to view all push subscriptions
CREATE POLICY "Admins can view all push subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to delete any push subscription (for cleanup)
CREATE POLICY "Admins can delete any push subscription"
ON public.push_subscriptions
FOR DELETE
USING (has_role(auth.uid(), 'admin'));