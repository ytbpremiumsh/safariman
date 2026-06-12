-- Auto-lolos berkas: when enabled, participants who submit berkas are auto-set to status 'interview' (lolos)

UPDATE public.app_settings SET value = value WHERE key = 'auto_lolos_berkas_enabled';
INSERT INTO public.app_settings (key, value) VALUES ('auto_lolos_berkas_enabled', 'false')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.submit_berkas_by_code(p_code text, p_cv_url text, p_photo_url text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count int;
  v_auto  boolean;
BEGIN
  SELECT COALESCE((SELECT value FROM public.app_settings WHERE key = 'auto_lolos_berkas_enabled' LIMIT 1), 'false') = 'true'
    INTO v_auto;

  UPDATE public.participants
  SET cv_url = p_cv_url,
      photo_url = p_photo_url,
      status = CASE
                 WHEN v_auto AND status IN ('pending','rejected') THEN 'interview'::participant_status
                 ELSE status
               END,
      updated_at = now()
  WHERE upper(registration_code) = upper(p_code);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_berkas_by_code(p_code text, p_cv_url text, p_photo_url text, p_essay_worthy text, p_essay_dream text, p_essay_contribution text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count int;
  v_auto  boolean;
BEGIN
  SELECT COALESCE((SELECT value FROM public.app_settings WHERE key = 'auto_lolos_berkas_enabled' LIMIT 1), 'false') = 'true'
    INTO v_auto;

  UPDATE public.participants
  SET cv_url = p_cv_url,
      photo_url = p_photo_url,
      essay_worthy = p_essay_worthy,
      essay_dream = p_essay_dream,
      essay_contribution = p_essay_contribution,
      status = CASE
                 WHEN v_auto AND status IN ('pending','rejected') THEN 'interview'::participant_status
                 ELSE status
               END,
      updated_at = now()
  WHERE upper(registration_code) = upper(p_code);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_berkas_by_code(p_code text, p_category program_category, p_cv_url text, p_photo_url text, p_essay_worthy text, p_essay_dream text, p_essay_contribution text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count int;
  v_auto  boolean;
BEGIN
  SELECT COALESCE((SELECT value FROM public.app_settings WHERE key = 'auto_lolos_berkas_enabled' LIMIT 1), 'false') = 'true'
    INTO v_auto;

  UPDATE public.participants
  SET category = p_category,
      cv_url = p_cv_url,
      photo_url = p_photo_url,
      essay_worthy = p_essay_worthy,
      essay_dream = p_essay_dream,
      essay_contribution = p_essay_contribution,
      status = CASE
                 WHEN v_auto AND status IN ('pending','rejected') THEN 'interview'::participant_status
                 ELSE status
               END,
      updated_at = now()
  WHERE upper(registration_code) = upper(p_code);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$function$;