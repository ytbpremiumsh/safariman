DROP POLICY IF EXISTS "Admins can update twibbon assets" ON storage.objects;

CREATE POLICY "Admins can update twibbon assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'twibbon-assets' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'twibbon-assets' AND public.has_role(auth.uid(), 'admin'));