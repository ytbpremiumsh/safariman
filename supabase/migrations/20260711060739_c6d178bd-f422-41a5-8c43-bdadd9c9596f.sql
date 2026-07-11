
CREATE OR REPLACE FUNCTION public.get_twibbon_caption()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$ SELECT value FROM public.app_settings WHERE key = 'twibbon_caption' LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.get_poster_caption()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$ SELECT value FROM public.app_settings WHERE key = 'poster_caption' LIMIT 1; $$;

GRANT EXECUTE ON FUNCTION public.get_twibbon_caption() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_poster_caption() TO anon, authenticated;
