-- 1. Fix function search_path
CREATE OR REPLACE FUNCTION public.gen_registration_code()
RETURNS text
LANGUAGE sql
SET search_path = public
AS $$
  SELECT 'HXP-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
$$;

-- 2. Tighten participants INSERT: registration goes via SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Anyone can register" ON public.participants;

-- 3. Replace permissive storage INSERT policies with participant-id-scoped checks
DROP POLICY IF EXISTS "Anyone can upload CV" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload photo" ON storage.objects;

CREATE POLICY "Upload CV to valid participant folder"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'participant-cv'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.participants
    WHERE id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Upload photo to valid participant folder"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'participant-photo'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.participants
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- 4. Public SELECT for participant photos (public bucket display)
DROP POLICY IF EXISTS "Public can view participant photos" ON storage.objects;
CREATE POLICY "Public can view participant photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'participant-photo');

-- 5. Admin-only UPDATE/DELETE on both buckets
DROP POLICY IF EXISTS "Admins update participant files" ON storage.objects;
CREATE POLICY "Admins update participant files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('participant-cv', 'participant-photo')
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id IN ('participant-cv', 'participant-photo')
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins delete participant files" ON storage.objects;
CREATE POLICY "Admins delete participant files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('participant-cv', 'participant-photo')
  AND public.has_role(auth.uid(), 'admin')
);