
CREATE OR REPLACE FUNCTION public.get_faq_config()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'enabled', COALESCE((SELECT value FROM public.app_settings WHERE key = 'faq_enabled' LIMIT 1), 'true') <> 'false',
    'items', COALESCE((SELECT value::jsonb FROM public.app_settings WHERE key = 'faq_items' LIMIT 1), '[]'::jsonb)
  );
$$;
