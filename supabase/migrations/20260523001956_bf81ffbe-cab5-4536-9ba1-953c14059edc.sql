DROP POLICY IF EXISTS "Anyone can update their own participant row by id" ON public.participants;

ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS edit_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS twibbon_confirmed_at timestamptz;

CREATE OR REPLACE FUNCTION public.update_participant_with_token(
  p_id uuid,
  p_token uuid,
  p_category program_category DEFAULT NULL,
  p_cv_url text DEFAULT NULL,
  p_photo_url text DEFAULT NULL,
  p_twibbon_confirmed boolean DEFAULT false
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
    category = COALESCE(p_category, category),
    cv_url = COALESCE(p_cv_url, cv_url),
    photo_url = COALESCE(p_photo_url, photo_url),
    twibbon_confirmed_at = CASE WHEN p_twibbon_confirmed THEN now() ELSE twibbon_confirmed_at END,
    updated_at = now()
  WHERE id = p_id AND edit_token = p_token;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.update_participant_with_token(uuid, uuid, program_category, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_participant_with_token(uuid, uuid, program_category, text, text, boolean) TO anon, authenticated;