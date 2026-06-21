INSERT INTO public.app_settings (key, value) VALUES
  ('social_ig_accounts', '[
    {"handle":"safariman.id","url":"https://instagram.com/safariman.id","label":"Safar Iman"},
    {"handle":"hasanah.tours.travel","url":"https://instagram.com/hasanah.tours.travel","label":"Hasanah Tours"},
    {"handle":"hasanah.hajiumrohsemarang","url":"https://instagram.com/hasanah.hajiumrohsemarang","label":"Hasanah Semarang"},
    {"handle":"prestasikita","url":"https://instagram.com/prestasikita","label":"Prestasi Kita"}
  ]'),
  ('social_tiktok_accounts', '[
    {"handle":"safariman.id","url":"https://tiktok.com/@safariman.id","label":"Safar Iman"}
  ]')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_social_accounts()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'instagram', COALESCE((SELECT value::jsonb FROM public.app_settings WHERE key = 'social_ig_accounts' LIMIT 1), '[]'::jsonb),
    'tiktok',    COALESCE((SELECT value::jsonb FROM public.app_settings WHERE key = 'social_tiktok_accounts' LIMIT 1), '[]'::jsonb)
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_social_accounts() TO anon, authenticated;