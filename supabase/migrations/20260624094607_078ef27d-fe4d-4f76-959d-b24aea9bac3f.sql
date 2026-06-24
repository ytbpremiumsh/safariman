CREATE OR REPLACE FUNCTION public.admin_set_setting(p_key text, p_value text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  INSERT INTO public.app_settings (key, value, updated_at)
  VALUES (p_key, p_value, now())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_setting(text, text) TO authenticated;