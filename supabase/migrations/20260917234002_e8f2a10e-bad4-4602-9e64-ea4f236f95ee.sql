CREATE POLICY "Private reviews are internal only"
ON public.seleksi_private_reviews
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);