
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
  v_triggered_count bigint;
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

  -- Build enabled urls array (fallback to single 'url' field if urls empty)
  SELECT COALESCE(jsonb_agg(u), '[]'::jsonb) INTO v_active_urls
  FROM jsonb_array_elements(v_urls) u
  WHERE COALESCE((u->>'enabled')::boolean, true)
    AND length(COALESCE(u->>'url','')) > 0;

  IF jsonb_array_length(v_active_urls) = 0 THEN
    v_url := COALESCE(cfg->>'url','');
    IF length(v_url) > 0 THEN
      v_active_urls := jsonb_build_array(jsonb_build_object('url', v_url, 'enabled', true));
    END IF;
  END IF;

  SELECT COALESCE(bool_or(COALESCE((t->>'enabled')::boolean, true)), false)
    INTO v_target_enabled
  FROM jsonb_array_elements(v_targets) t
  WHERE t->>'selector_id' = p_selector_id;

  v_count := jsonb_array_length(v_active_urls);

  IF v_enabled AND v_target_enabled AND v_count > 0 THEN
    SELECT COUNT(*)+1 INTO v_total FROM public.affiliate_clicks;
    IF (v_total % v_ratio) = 0 THEN
      v_trigger := true;
      -- Rotate among active urls based on triggered count so far
      SELECT COUNT(*) INTO v_triggered_count FROM public.affiliate_clicks WHERE triggered_affiliate;
      v_pick := COALESCE(v_active_urls->(v_triggered_count % v_count)->>'url', '');
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
