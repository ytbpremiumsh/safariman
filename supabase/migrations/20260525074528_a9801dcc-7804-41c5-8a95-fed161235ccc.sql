CREATE OR REPLACE FUNCTION public.get_countdown_enabled()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT value FROM public.app_settings WHERE key = 'countdown_enabled' LIMIT 1),
    'true'
  ) <> 'false';
$$;