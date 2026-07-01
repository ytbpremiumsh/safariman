CREATE OR REPLACE FUNCTION public.get_self_funded_public_config()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'enabled', COALESCE((SELECT value FROM public.app_settings WHERE key = 'self_funded_enabled' LIMIT 1), 'true') <> 'false',
    'paid_enabled', COALESCE((SELECT value FROM public.app_settings WHERE key = 'self_funded_paid_enabled' LIMIT 1), 'true') <> 'false',
    'price', GREATEST(0, COALESCE(NULLIF((SELECT value FROM public.app_settings WHERE key = 'self_funded_price' LIMIT 1), '')::int, 50000))
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_self_funded_public_config() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.register_participant(
  p_full_name text,
  p_email text,
  p_whatsapp text,
  p_gender text,
  p_birth_date date,
  p_city text,
  p_education text,
  p_occupation text,
  p_category program_category DEFAULT 'fully_funded'::program_category,
  p_instagram text DEFAULT NULL::text,
  p_religion text DEFAULT NULL::text,
  p_has_passport text DEFAULT NULL::text
)
RETURNS TABLE(id uuid, registration_code text, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
  v_code text;
  v_self_enabled boolean;
BEGIN
  IF p_category = 'self_funded'::program_category THEN
    SELECT COALESCE((SELECT value FROM public.app_settings WHERE key = 'self_funded_enabled' LIMIT 1), 'true') <> 'false'
      INTO v_self_enabled;
    IF NOT v_self_enabled THEN
      RAISE EXCEPTION 'Pendaftaran Self Funded sedang dinonaktifkan';
    END IF;
  END IF;

  INSERT INTO public.participants (
    full_name, email, whatsapp, gender, birth_date, city, education, occupation,
    category, social_media, religion, has_passport, status
  ) VALUES (
    p_full_name, p_email, p_whatsapp, p_gender, p_birth_date, p_city, p_education, p_occupation,
    p_category, p_instagram, p_religion, p_has_passport,
    CASE WHEN p_category = 'self_funded'::program_category THEN 'accepted'::participant_status ELSE 'pending'::participant_status END
  )
  RETURNING participants.id, participants.registration_code INTO v_id, v_code;

  RETURN QUERY SELECT v_id, v_code, p_full_name;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.register_participant(text,text,text,text,date,text,text,text,program_category,text,text,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.log_affiliate_click(p_selector_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cfg jsonb;
  v_enabled boolean;
  v_url text;
  v_ratio int;
  v_targets jsonb;
  v_urls jsonb;
  v_active_urls jsonb;
  v_target_enabled boolean := false;
  v_total bigint;
  v_trigger boolean := false;
  v_pick text := '';
  v_count int;
BEGIN
  IF p_selector_id IS NULL OR length(p_selector_id) = 0 OR length(p_selector_id) > 64 THEN
    RETURN jsonb_build_object('trigger_affiliate', false, 'affiliate_url', '');
  END IF;

  SELECT value::jsonb INTO cfg FROM public.app_settings WHERE key='affiliate_config';
  IF cfg IS NULL THEN
    RETURN jsonb_build_object('trigger_affiliate', false, 'affiliate_url', '');
  END IF;

  v_enabled := COALESCE((cfg->>'enabled')::boolean, false);
  v_ratio := GREATEST(1, COALESCE((cfg->>'ratio')::int, 3));
  v_targets := COALESCE(cfg->'targets', '[]'::jsonb);
  v_urls := COALESCE(cfg->'urls', '[]'::jsonb);

  SELECT COALESCE(jsonb_agg(u), '[]'::jsonb) INTO v_active_urls
  FROM jsonb_array_elements(v_urls) u
  WHERE COALESCE((u->>'enabled')::boolean, true)
    AND length(COALESCE(u->>'url','')) > 0
    AND COALESCE(u->>'url','') ~* '^https?://';

  IF jsonb_array_length(v_active_urls) = 0 THEN
    v_url := COALESCE(cfg->>'url','');
    IF v_url ~* '^https?://' THEN
      v_active_urls := jsonb_build_array(jsonb_build_object('url', v_url, 'enabled', true));
    END IF;
  END IF;

  SELECT COALESCE(bool_or(COALESCE((t->>'enabled')::boolean, true)), false)
    INTO v_target_enabled
  FROM jsonb_array_elements(v_targets) t
  WHERE t->>'selector_id' = p_selector_id;

  v_count := jsonb_array_length(v_active_urls);

  IF v_enabled AND v_target_enabled AND v_count > 0 THEN
    SELECT COUNT(*) + 1 INTO v_total
    FROM public.affiliate_clicks
    WHERE selector_id = p_selector_id;

    IF (v_total % v_ratio) = 0 THEN
      v_trigger := true;
      v_pick := COALESCE(v_active_urls->floor(random() * v_count)::int->>'url', '');
    END IF;
  END IF;

  INSERT INTO public.affiliate_clicks(selector_id, triggered_affiliate)
    VALUES (p_selector_id, v_trigger);

  RETURN jsonb_build_object(
    'trigger_affiliate', v_trigger,
    'affiliate_url', CASE WHEN v_trigger THEN v_pick ELSE '' END
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.log_affiliate_click(text) TO anon, authenticated;

UPDATE public.app_settings
SET value = jsonb_set(
  value::jsonb,
  '{targets}',
  (
    SELECT jsonb_agg(DISTINCT item)
    FROM (
      SELECT elem AS item
      FROM jsonb_array_elements(COALESCE(value::jsonb->'targets', '[]'::jsonb)) elem
      UNION ALL
      SELECT jsonb_build_object('selector_id', 'timeline_pendaftaran', 'label', 'Timeline — Daftar Sekarang', 'enabled', true)
      UNION ALL
      SELECT jsonb_build_object('selector_id', 'timeline_twibbon', 'label', 'Timeline — Buat Twibbon & Poster', 'enabled', true)
      UNION ALL
      SELECT jsonb_build_object('selector_id', 'timeline_berkas', 'label', 'Timeline — Kirim Berkas', 'enabled', true)
      UNION ALL
      SELECT jsonb_build_object('selector_id', 'timeline_essay', 'label', 'Timeline — Kirim Essay & Studi Kasus', 'enabled', true)
    ) s
  ),
  true
)::text,
updated_at = now()
WHERE key = 'affiliate_config';