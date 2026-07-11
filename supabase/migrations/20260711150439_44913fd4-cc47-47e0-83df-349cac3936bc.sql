
-- Rewrite storage RLS policies to fully-qualify has_role() and app_role
-- so they resolve regardless of the storage schema's search_path.

-- twibbon-assets
DROP POLICY IF EXISTS "Admins can upload twibbon assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update twibbon assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete twibbon assets" ON storage.objects;

CREATE POLICY "Admins can upload twibbon assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'twibbon-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update twibbon assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'twibbon-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'twibbon-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete twibbon assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'twibbon-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- participant-cv
DROP POLICY IF EXISTS "Admins can upload participant cv" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update participant cv" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete participant cv" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read participant cv" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view CVs" ON storage.objects;

CREATE POLICY "Admins can upload participant cv" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'participant-cv' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update participant cv" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'participant-cv' AND public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'participant-cv' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete participant cv" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'participant-cv' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can read participant cv" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'participant-cv' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- participant-photo
DROP POLICY IF EXISTS "Admins can upload participant photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update participant photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete participant photos" ON storage.objects;

CREATE POLICY "Admins can upload participant photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'participant-photo' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update participant photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'participant-photo' AND public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'participant-photo' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete participant photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'participant-photo' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Combined participant files
DROP POLICY IF EXISTS "Admins delete participant files" ON storage.objects;
DROP POLICY IF EXISTS "Admins update participant files" ON storage.objects;

CREATE POLICY "Admins delete participant files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = ANY (ARRAY['participant-cv','participant-photo']) AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins update participant files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = ANY (ARRAY['participant-cv','participant-photo']) AND public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = ANY (ARRAY['participant-cv','participant-photo']) AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- document-assets
DROP POLICY IF EXISTS "Admins manage document-assets insert" ON storage.objects;
DROP POLICY IF EXISTS "Admins manage document-assets update" ON storage.objects;
DROP POLICY IF EXISTS "Admins manage document-assets delete" ON storage.objects;

CREATE POLICY "Admins manage document-assets insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'document-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage document-assets update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'document-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage document-assets delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'document-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));
