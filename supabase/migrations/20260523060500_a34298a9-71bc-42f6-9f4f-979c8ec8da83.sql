CREATE OR REPLACE FUNCTION public.get_countdown_target()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value FROM public.app_settings WHERE key = 'countdown_target' LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_countdown_target() TO anon, authenticated;