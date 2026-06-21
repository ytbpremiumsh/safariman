CREATE OR REPLACE FUNCTION public.get_poster_url()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value FROM public.app_settings WHERE key = 'poster_url' LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_poster_url() TO anon, authenticated;