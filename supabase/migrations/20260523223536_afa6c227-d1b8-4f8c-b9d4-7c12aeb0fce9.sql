-- Public bucket for twibbon frame
INSERT INTO storage.buckets (id, name, public)
VALUES ('twibbon-assets', 'twibbon-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read
CREATE POLICY "Public can view twibbon assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'twibbon-assets');

-- Admins manage uploads
CREATE POLICY "Admins can upload twibbon assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'twibbon-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update twibbon assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'twibbon-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete twibbon assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'twibbon-assets' AND public.has_role(auth.uid(), 'admin'));

-- Helper to expose the frame URL publicly via RPC
CREATE OR REPLACE FUNCTION public.get_twibbon_frame_url()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value FROM public.app_settings WHERE key = 'twibbon_frame_url' LIMIT 1;
$$;