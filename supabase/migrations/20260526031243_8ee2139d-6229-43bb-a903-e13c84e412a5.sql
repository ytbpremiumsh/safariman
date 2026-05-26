
-- 1) Drop overly broad SELECT policies that allowed anyone to LIST files in public buckets.
-- Files in public buckets are still served via their direct public URLs.
DROP POLICY IF EXISTS "Public can view participant photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view twibbon assets" ON storage.objects;

-- 2) Restrict Realtime subscriptions on the 'participants' topic to admins only.
-- Postgres-level RLS on `participants` already filters payloads, but we add an
-- explicit policy on realtime.messages so non-admins cannot even subscribe.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can receive realtime messages" ON realtime.messages;
CREATE POLICY "Admins can receive realtime messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
