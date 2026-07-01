
CREATE TABLE public.affiliate_clicks (
  id bigserial PRIMARY KEY,
  selector_id text NOT NULL,
  triggered_affiliate boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.affiliate_clicks (created_at DESC);
CREATE INDEX ON public.affiliate_clicks (selector_id);

GRANT SELECT ON public.affiliate_clicks TO authenticated;
GRANT ALL ON public.affiliate_clicks TO service_role;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read affiliate_clicks" ON public.affiliate_clicks
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed default config
INSERT INTO public.app_settings(key, value, updated_at)
VALUES ('affiliate_config', jsonb_build_object(
  'enabled', false,
  'url', '',
  'ratio', 3,
  'targets', jsonb_build_array(
    jsonb_build_object('selector_id','nav_daftar','label','Navbar Daftar Sekarang','enabled', true),
    jsonb_build_object('selector_id','hero_daftar','label','Hero Daftar Sekarang','enabled', true),
    jsonb_build_object('selector_id','cta_daftar','label','CTA Bawah Daftar Sekarang','enabled', true)
  )
)::text, now())
ON CONFLICT (key) DO NOTHING;

-- Public: get config (only fields needed by client)
CREATE OR REPLACE FUNCTION public.get_affiliate_config()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((SELECT value::jsonb FROM public.app_settings WHERE key='affiliate_config'), '{}'::jsonb);
$$;

-- Public: log click, return {trigger_affiliate, affiliate_url}
CREATE OR REPLACE FUNCTION public.log_affiliate_click(p_selector_id text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  cfg jsonb;
  v_enabled boolean;
  v_url text;
  v_ratio int;
  v_targets jsonb;
  v_target_enabled boolean := false;
  v_total bigint;
  v_trigger boolean := false;
BEGIN
  IF p_selector_id IS NULL OR length(p_selector_id) = 0 OR length(p_selector_id) > 64 THEN
    RETURN jsonb_build_object('trigger_affiliate', false, 'affiliate_url', '');
  END IF;

  SELECT value::jsonb INTO cfg FROM public.app_settings WHERE key='affiliate_config';
  IF cfg IS NULL THEN
    RETURN jsonb_build_object('trigger_affiliate', false, 'affiliate_url', '');
  END IF;

  v_enabled := COALESCE((cfg->>'enabled')::boolean, false);
  v_url := COALESCE(cfg->>'url', '');
  v_ratio := GREATEST(1, COALESCE((cfg->>'ratio')::int, 3));
  v_targets := COALESCE(cfg->'targets', '[]'::jsonb);

  SELECT COALESCE(bool_or(COALESCE((t->>'enabled')::boolean, true)), false)
    INTO v_target_enabled
  FROM jsonb_array_elements(v_targets) t
  WHERE t->>'selector_id' = p_selector_id;

  IF v_enabled AND v_target_enabled AND length(v_url) > 0 THEN
    SELECT COUNT(*)+1 INTO v_total FROM public.affiliate_clicks;
    IF (v_total % v_ratio) = 0 THEN
      v_trigger := true;
    END IF;
  END IF;

  INSERT INTO public.affiliate_clicks(selector_id, triggered_affiliate)
    VALUES (p_selector_id, v_trigger);

  RETURN jsonb_build_object(
    'trigger_affiliate', v_trigger,
    'affiliate_url', CASE WHEN v_trigger THEN v_url ELSE '' END
  );
END;
$$;

-- Admin: save config
CREATE OR REPLACE FUNCTION public.admin_set_affiliate_config(p_json text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  -- Validate JSON
  PERFORM p_json::jsonb;
  INSERT INTO public.app_settings(key, value, updated_at)
  VALUES ('affiliate_config', p_json, now())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
  RETURN true;
END;
$$;

-- Admin: stats
CREATE OR REPLACE FUNCTION public.get_affiliate_stats(p_days int DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_total bigint;
  v_triggered bigint;
  v_by_selector jsonb;
  v_by_day jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  SELECT COUNT(*) INTO v_total FROM public.affiliate_clicks;
  SELECT COUNT(*) INTO v_triggered FROM public.affiliate_clicks WHERE triggered_affiliate;
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_by_selector FROM (
    SELECT selector_id,
           COUNT(*) AS clicks,
           SUM(CASE WHEN triggered_affiliate THEN 1 ELSE 0 END) AS triggered
    FROM public.affiliate_clicks
    GROUP BY selector_id
    ORDER BY clicks DESC
  ) t;
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_by_day FROM (
    SELECT (created_at AT TIME ZONE 'Asia/Jakarta')::date AS day,
           COUNT(*) AS clicks,
           SUM(CASE WHEN triggered_affiliate THEN 1 ELSE 0 END) AS triggered
    FROM public.affiliate_clicks
    WHERE created_at >= now() - (p_days || ' days')::interval
    GROUP BY 1
    ORDER BY 1 DESC
  ) t;
  RETURN jsonb_build_object(
    'total_clicks', v_total,
    'total_triggered', v_triggered,
    'by_selector', v_by_selector,
    'by_day', v_by_day
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_affiliate_config() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_affiliate_click(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_affiliate_config(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_affiliate_stats(int) TO authenticated;
