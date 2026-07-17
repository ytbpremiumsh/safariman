
ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS case_study_3 text,
  ADD COLUMN IF NOT EXISTS case_study_4 text,
  ADD COLUMN IF NOT EXISTS case_study_5 text,
  ADD COLUMN IF NOT EXISTS case_study_6 text,
  ADD COLUMN IF NOT EXISTS case_study_7 text;

DROP FUNCTION IF EXISTS public.submit_essay_by_code(text, text, text, text, text, text);
CREATE OR REPLACE FUNCTION public.submit_essay_by_code(
  p_code text,
  p_essay_worthy text,
  p_essay_dream text,
  p_essay_contribution text,
  p_case_study_1 text DEFAULT NULL,
  p_case_study_2 text DEFAULT NULL,
  p_case_study_3 text DEFAULT NULL,
  p_case_study_4 text DEFAULT NULL,
  p_case_study_5 text DEFAULT NULL,
  p_case_study_6 text DEFAULT NULL,
  p_case_study_7 text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_count int;
BEGIN
  UPDATE public.participants
  SET essay_worthy = p_essay_worthy,
      essay_dream = p_essay_dream,
      essay_contribution = p_essay_contribution,
      case_study_1 = COALESCE(p_case_study_1, case_study_1),
      case_study_2 = COALESCE(p_case_study_2, case_study_2),
      case_study_3 = COALESCE(p_case_study_3, case_study_3),
      case_study_4 = COALESCE(p_case_study_4, case_study_4),
      case_study_5 = COALESCE(p_case_study_5, case_study_5),
      case_study_6 = COALESCE(p_case_study_6, case_study_6),
      case_study_7 = COALESCE(p_case_study_7, case_study_7),
      updated_at = now()
  WHERE upper(registration_code) = upper(p_code)
    AND donation_status = 'paid';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

DROP FUNCTION IF EXISTS public.list_essay_pending_participants();
CREATE FUNCTION public.list_essay_pending_participants()
RETURNS TABLE(
  id uuid, registration_code text, full_name text, email text, whatsapp text,
  gender text, birth_date date, city text, education text, occupation text,
  category program_category, status participant_status,
  has_essay_worthy boolean, has_essay_dream boolean, has_essay_contribution boolean,
  has_case_study_1 boolean, has_case_study_2 boolean,
  has_case_study_3 boolean, has_case_study_4 boolean, has_case_study_5 boolean,
  has_case_study_6 boolean, has_case_study_7 boolean,
  cv_url text, photo_url text,
  donation_status text, donation_paid_at timestamptz,
  created_at timestamptz, updated_at timestamptz
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT p.id, p.registration_code, p.full_name, p.email, p.whatsapp,
    p.gender, p.birth_date, p.city, p.education, p.occupation, p.category, p.status,
    (p.essay_worthy IS NOT NULL), (p.essay_dream IS NOT NULL), (p.essay_contribution IS NOT NULL),
    (p.case_study_1 IS NOT NULL), (p.case_study_2 IS NOT NULL),
    (p.case_study_3 IS NOT NULL), (p.case_study_4 IS NOT NULL), (p.case_study_5 IS NOT NULL),
    (p.case_study_6 IS NOT NULL), (p.case_study_7 IS NOT NULL),
    p.cv_url, p.photo_url, p.donation_status, p.donation_paid_at, p.created_at, p.updated_at
  FROM public.participants p
  WHERE (p.category IS NULL OR p.category IN ('fully_funded','partial_funded','gelombang_1','gelombang_2'))
    AND p.status = 'accepted'::participant_status
    AND (p.essay_worthy IS NULL OR p.essay_dream IS NULL OR p.essay_contribution IS NULL)
  ORDER BY p.updated_at DESC;
$$;

DROP FUNCTION IF EXISTS public.list_essay_complete_participants();
CREATE FUNCTION public.list_essay_complete_participants()
RETURNS TABLE(
  id uuid, registration_code text, full_name text, email text, whatsapp text,
  gender text, birth_date date, city text, education text, occupation text,
  social_media text, reason text, achievements text, organization_experience text,
  category program_category, status participant_status,
  essay_worthy text, essay_dream text, essay_contribution text,
  case_study_1 text, case_study_2 text, case_study_3 text, case_study_4 text,
  case_study_5 text, case_study_6 text, case_study_7 text,
  cv_url text, photo_url text, twibbon_confirmed_at timestamptz,
  payment_status text, paid_at timestamptz, donation_status text, donation_paid_at timestamptz,
  essay_ai_score integer, essay_ai_percent integer, essay_ai_verdict text,
  essay_ai_summary text, essay_ai_graded_at timestamptz,
  created_at timestamptz, updated_at timestamptz
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT id, registration_code, full_name, email, whatsapp, gender, birth_date, city,
    education, occupation, social_media, reason, achievements, organization_experience,
    category, status, essay_worthy, essay_dream, essay_contribution,
    case_study_1, case_study_2, case_study_3, case_study_4, case_study_5, case_study_6, case_study_7,
    cv_url, photo_url, twibbon_confirmed_at,
    payment_status, paid_at, donation_status, donation_paid_at,
    essay_ai_score, essay_ai_percent, essay_ai_verdict, essay_ai_summary, essay_ai_graded_at,
    created_at, updated_at
  FROM public.participants
  WHERE essay_worthy IS NOT NULL AND essay_dream IS NOT NULL AND essay_contribution IS NOT NULL
    AND (category IS NULL OR category IN ('fully_funded','partial_funded','gelombang_1','gelombang_2'))
  ORDER BY created_at DESC;
$$;
