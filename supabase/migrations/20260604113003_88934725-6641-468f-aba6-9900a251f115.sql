-- 1. Add new enum values for gelombang categories
ALTER TYPE public.program_category ADD VALUE IF NOT EXISTS 'gelombang_1';
ALTER TYPE public.program_category ADD VALUE IF NOT EXISTS 'gelombang_2';

-- 2. Default gelombang config (will be editable from admin)
INSERT INTO public.app_settings (key, value)
VALUES (
  'gelombang_config',
  '{"gelombang_1":{"name":"Reguler Gelombang 1","start":"2026-06-10","end":"2026-07-20","price":20000,"enabled":true,"description":"Tanpa Membagikan Twibbon & Poster\nTanpa Follow Instagram & Tiktok\nTanpa Mengirimkan Berkas Administrasi"},"gelombang_2":{"name":"Reguler Gelombang 2","start":"2026-07-21","end":"2026-08-15","price":50000,"enabled":true,"description":"Tanpa Membagikan Twibbon & Poster\nTanpa Follow Instagram & Tiktok\nTanpa Mengirimkan Berkas Administrasi"},"reguler":{"name":"Reguler","start":"2026-06-10","end":"2026-08-15","price":0,"enabled":true,"description":"Mengisi Form Pendaftaran\nMembagikan Twibbon & Poster\nFollow Instagram & Tiktok\nMengirimkan Berkas Administrasi"}}'
)
ON CONFLICT (key) DO NOTHING;

-- 3. Public reader for gelombang config (returns raw JSON string)
CREATE OR REPLACE FUNCTION public.get_gelombang_config()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value FROM public.app_settings WHERE key = 'gelombang_config' LIMIT 1;
$$;