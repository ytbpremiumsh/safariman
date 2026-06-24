INSERT INTO public.app_settings (key, value)
VALUES ('wa_channel_url', 'https://whatsapp.com/channel/0029VbCxSnICxoAwuDDdCt1Q')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_wa_channel_url()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT value FROM public.app_settings WHERE key = 'wa_channel_url' LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_wa_channel_url() TO anon, authenticated;