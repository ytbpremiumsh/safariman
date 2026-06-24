
-- Fix function search_path mutable
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;

-- Remove broad SELECT policies on storage.objects for public buckets to prevent listing.
-- Files remain accessible via direct public URL (CDN serves public buckets without RLS).
DROP POLICY IF EXISTS "Public can view twibbon assets" ON storage.objects;
DROP POLICY IF EXISTS "Public can view participant photos" ON storage.objects;
