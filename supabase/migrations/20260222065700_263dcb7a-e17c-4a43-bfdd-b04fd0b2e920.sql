DROP POLICY IF EXISTS "Anyone can view feature toggles" ON public.feature_toggles;

CREATE POLICY "Authenticated users can view feature toggles"
ON public.feature_toggles FOR SELECT
TO authenticated
USING (true);