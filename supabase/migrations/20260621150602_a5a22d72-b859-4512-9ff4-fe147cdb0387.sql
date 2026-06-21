DROP POLICY IF EXISTS "Public can view twibbon assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload twibbon assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update twibbon assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete twibbon assets" ON storage.objects;

CREATE POLICY "Public can view twibbon assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'twibbon-assets');

CREATE POLICY "Admins can upload twibbon assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'twibbon-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update twibbon assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'twibbon-assets' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'twibbon-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete twibbon assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'twibbon-assets' AND public.has_role(auth.uid(), 'admin'));