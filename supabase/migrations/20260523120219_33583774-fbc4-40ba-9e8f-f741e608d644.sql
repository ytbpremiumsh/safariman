CREATE OR REPLACE FUNCTION public.get_panduan_url()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value FROM public.app_settings WHERE key = 'panduan_url' LIMIT 1;
$$;