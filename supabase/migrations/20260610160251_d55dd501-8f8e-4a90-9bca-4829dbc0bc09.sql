-- 1) Remove participants from realtime publication to stop PII broadcast
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'participants'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.participants';
  END IF;
END $$;

-- 2) Restrict storage uploads to admins for participant buckets
DROP POLICY IF EXISTS "Admins can upload participant photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update participant photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete participant photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload participant cv" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update participant cv" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete participant cv" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read participant cv" ON storage.objects;

CREATE POLICY "Admins can upload participant photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'participant-photo' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update participant photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'participant-photo' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'participant-photo' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete participant photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'participant-photo' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload participant cv"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'participant-cv' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update participant cv"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'participant-cv' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'participant-cv' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete participant cv"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'participant-cv' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read participant cv"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'participant-cv' AND public.has_role(auth.uid(), 'admin'));
