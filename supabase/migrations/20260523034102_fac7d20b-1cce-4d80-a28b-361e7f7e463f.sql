
-- Make essays/details optional at initial registration
ALTER TABLE public.participants
  ALTER COLUMN essay_worthy DROP NOT NULL,
  ALTER COLUMN essay_dream DROP NOT NULL,
  ALTER COLUMN essay_contribution DROP NOT NULL;

-- Short registration code (8 chars, uppercase alnum)
CREATE OR REPLACE FUNCTION public.gen_registration_code()
RETURNS text
LANGUAGE sql
VOLATILE
AS $$
  SELECT upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
$$;

ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS registration_code text UNIQUE NOT NULL DEFAULT public.gen_registration_code();

-- RPC: submit essay + berkas using only the registration code
CREATE OR REPLACE FUNCTION public.submit_berkas_by_code(
  p_code text,
  p_category program_category,
  p_cv_url text,
  p_photo_url text,
  p_essay_worthy text,
  p_essay_dream text,
  p_essay_contribution text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  UPDATE public.participants
  SET
    category = p_category,
    cv_url = p_cv_url,
    photo_url = p_photo_url,
    essay_worthy = p_essay_worthy,
    essay_dream = p_essay_dream,
    essay_contribution = p_essay_contribution,
    updated_at = now()
  WHERE upper(registration_code) = upper(p_code);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

-- RPC: lookup participant name by code (so we can greet/confirm before submit)
CREATE OR REPLACE FUNCTION public.lookup_participant_by_code(p_code text)
RETURNS TABLE(id uuid, full_name text, has_berkas boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, full_name, (cv_url IS NOT NULL AND photo_url IS NOT NULL) AS has_berkas
  FROM public.participants
  WHERE upper(registration_code) = upper(p_code)
  LIMIT 1;
$$;
