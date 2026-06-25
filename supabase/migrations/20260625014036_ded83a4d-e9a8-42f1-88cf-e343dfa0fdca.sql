
ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS tka_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS tka_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS interview_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS interview_updated_at timestamptz;

ALTER TABLE public.participants
  DROP CONSTRAINT IF EXISTS participants_tka_status_check;
ALTER TABLE public.participants
  ADD CONSTRAINT participants_tka_status_check CHECK (tka_status IN ('pending','passed','failed'));

ALTER TABLE public.participants
  DROP CONSTRAINT IF EXISTS participants_interview_status_check;
ALTER TABLE public.participants
  ADD CONSTRAINT participants_interview_status_check CHECK (interview_status IN ('pending','passed','failed'));

-- Public lookup for Cek Tahapan page
CREATE OR REPLACE FUNCTION public.lookup_tahapan_by_code(p_code text)
RETURNS TABLE(
  found boolean,
  full_name text,
  category program_category,
  status participant_status,
  has_berkas boolean,
  has_essay boolean,
  donation_status text,
  payment_status text,
  tka_status text,
  interview_status text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    true,
    p.full_name,
    p.category,
    p.status,
    (p.cv_url IS NOT NULL AND p.photo_url IS NOT NULL),
    (p.essay_worthy IS NOT NULL AND p.essay_dream IS NOT NULL AND p.essay_contribution IS NOT NULL),
    p.donation_status,
    p.payment_status,
    p.tka_status,
    p.interview_status
  FROM public.participants p
  WHERE upper(p.registration_code) = upper(p_code)
  LIMIT 1;
$$;

-- Admin sets a stage decision
CREATE OR REPLACE FUNCTION public.admin_set_tahapan(p_id uuid, p_stage text, p_value text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF p_value NOT IN ('pending','passed','failed') THEN
    RAISE EXCEPTION 'invalid value';
  END IF;

  IF p_stage = 'tka' THEN
    UPDATE public.participants
    SET tka_status = p_value,
        tka_updated_at = now(),
        status = CASE
                   WHEN p_value = 'failed' THEN 'rejected'::participant_status
                   ELSE status
                 END,
        updated_at = now()
    WHERE id = p_id;
  ELSIF p_stage = 'interview' THEN
    UPDATE public.participants
    SET interview_status = p_value,
        interview_updated_at = now(),
        status = CASE
                   WHEN p_value = 'passed' THEN 'accepted'::participant_status
                   WHEN p_value = 'failed' THEN 'rejected'::participant_status
                   ELSE status
                 END,
        updated_at = now()
    WHERE id = p_id;
  ELSE
    RAISE EXCEPTION 'invalid stage';
  END IF;

  RETURN FOUND;
END;
$$;

-- Admin listing for TKA & Interview tab (peserta yang lolos essay / lanjut)
CREATE OR REPLACE FUNCTION public.list_tahapan_participants()
RETURNS TABLE(
  id uuid,
  registration_code text,
  full_name text,
  email text,
  whatsapp text,
  city text,
  category program_category,
  status participant_status,
  tka_status text,
  interview_status text,
  tka_updated_at timestamptz,
  interview_updated_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, registration_code, full_name, email, whatsapp, city, category, status,
         tka_status, interview_status, tka_updated_at, interview_updated_at, created_at
  FROM public.participants
  WHERE status IN ('interview','accepted','rejected')
    AND essay_worthy IS NOT NULL
    AND essay_dream IS NOT NULL
    AND essay_contribution IS NOT NULL
  ORDER BY created_at DESC;
$$;
