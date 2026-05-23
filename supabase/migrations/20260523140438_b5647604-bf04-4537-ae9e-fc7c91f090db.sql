
-- Update lookup_participant_by_code to expose more flow state
DROP FUNCTION IF EXISTS public.lookup_participant_by_code(text);
CREATE OR REPLACE FUNCTION public.lookup_participant_by_code(p_code text)
RETURNS TABLE(
  id uuid,
  full_name text,
  has_berkas boolean,
  has_essay boolean,
  status participant_status,
  payment_status text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    id,
    full_name,
    (cv_url IS NOT NULL AND photo_url IS NOT NULL) AS has_berkas,
    (essay_worthy IS NOT NULL AND essay_dream IS NOT NULL AND essay_contribution IS NOT NULL) AS has_essay,
    status,
    payment_status
  FROM public.participants
  WHERE upper(registration_code) = upper(p_code)
  LIMIT 1;
$$;

-- New 3-arg submit_berkas_by_code (data + berkas only, no essays)
CREATE OR REPLACE FUNCTION public.submit_berkas_by_code(
  p_code text,
  p_cv_url text,
  p_photo_url text
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_count int;
BEGIN
  UPDATE public.participants
  SET cv_url = p_cv_url, photo_url = p_photo_url, updated_at = now()
  WHERE upper(registration_code) = upper(p_code);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

-- New: submit essays separately (only allowed if paid)
CREATE OR REPLACE FUNCTION public.submit_essay_by_code(
  p_code text,
  p_essay_worthy text,
  p_essay_dream text,
  p_essay_contribution text
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_count int;
BEGIN
  UPDATE public.participants
  SET essay_worthy = p_essay_worthy,
      essay_dream = p_essay_dream,
      essay_contribution = p_essay_contribution,
      updated_at = now()
  WHERE upper(registration_code) = upper(p_code)
    AND payment_status = 'paid';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;
