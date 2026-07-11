CREATE OR REPLACE FUNCTION public.list_essay_pending_participants()
RETURNS TABLE(
  id uuid, registration_code text, full_name text, email text, whatsapp text,
  gender text, birth_date date, city text, education text, occupation text,
  category program_category, status participant_status,
  has_essay_worthy boolean, has_essay_dream boolean, has_essay_contribution boolean,
  has_case_study_1 boolean, has_case_study_2 boolean,
  cv_url text, photo_url text,
  donation_status text, donation_paid_at timestamptz,
  created_at timestamptz, updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.registration_code, p.full_name, p.email, p.whatsapp,
    p.gender, p.birth_date, p.city, p.education, p.occupation,
    p.category, p.status,
    (p.essay_worthy IS NOT NULL), (p.essay_dream IS NOT NULL), (p.essay_contribution IS NOT NULL),
    (p.case_study_1 IS NOT NULL), (p.case_study_2 IS NOT NULL),
    p.cv_url, p.photo_url,
    p.donation_status, p.donation_paid_at,
    p.created_at, p.updated_at
  FROM public.participants p
  WHERE (p.category IS NULL OR p.category IN ('fully_funded','partial_funded','gelombang_1','gelombang_2'))
    AND p.status = 'accepted'::participant_status
    AND (
      p.essay_worthy IS NULL
      OR p.essay_dream IS NULL
      OR p.essay_contribution IS NULL
    )
  ORDER BY p.updated_at DESC;
$$;

REVOKE ALL ON FUNCTION public.list_essay_pending_participants() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_essay_pending_participants() TO authenticated, service_role;