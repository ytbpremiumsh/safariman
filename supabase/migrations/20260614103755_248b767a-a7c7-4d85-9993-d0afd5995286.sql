CREATE POLICY "Public read document-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'document-assets');

CREATE POLICY "Admins manage document-assets insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'document-assets' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage document-assets update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'document-assets' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage document-assets delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'document-assets' AND public.has_role(auth.uid(), 'admin'::app_role));
