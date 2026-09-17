DROP FUNCTION IF EXISTS public.list_essay_complete_participants();

CREATE FUNCTION public.list_essay_complete_participants()
RETURNS TABLE(
  id uuid,
  registration_code text,
  full_name text,
  email text,
  whatsapp text,
  gender text,
  birth_date date,
  city text,
  education text,
  occupation text,
  social_media text,
  reason text,
  achievements text,
  organization_experience text,
  category public.program_category,
  status public.participant_status,
  essay_worthy text,
  essay_dream text,
  essay_contribution text,
  case_study_1 text,
  case_study_2 text,
  case_study_3 text,
  case_study_4 text,
  case_study_5 text,
  case_study_6 text,
  case_study_7 text,
  cv_url text,
  photo_url text,
  twibbon_confirmed_at timestamptz,
  payment_status text,
  paid_at timestamptz,
  donation_status text,
  donation_paid_at timestamptz,
  essay_ai_score integer,
  essay_ai_percent integer,
  essay_ai_verdict text,
  essay_ai_summary text,
  essay_ai_graded_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  reviewer_name text,
  reviewed_at timestamptz,
  review_decision text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  SELECT p.id, p.registration_code, p.full_name, p.email, p.whatsapp, p.gender,
         p.birth_date, p.city, p.education, p.occupation, p.social_media, p.reason,
         p.achievements, p.organization_experience, p.category, p.status,
         p.essay_worthy, p.essay_dream, p.essay_contribution,
         p.case_study_1, p.case_study_2, p.case_study_3, p.case_study_4,
         p.case_study_5, p.case_study_6, p.case_study_7,
         p.cv_url, p.photo_url, p.twibbon_confirmed_at,
         p.payment_status, p.paid_at, p.donation_status, p.donation_paid_at,
         p.essay_ai_score, p.essay_ai_percent, p.essay_ai_verdict,
         p.essay_ai_summary, p.essay_ai_graded_at,
         p.created_at, p.updated_at,
         sr.reviewer_name, sr.reviewed_at, sr.decision::text
  FROM public.participants p
  LEFT JOIN public.staff_essay_reviews sr ON sr.participant_id = p.id
  WHERE NULLIF(BTRIM(p.essay_worthy), '') IS NOT NULL
    AND NULLIF(BTRIM(p.essay_dream), '') IS NOT NULL
    AND NULLIF(BTRIM(p.essay_contribution), '') IS NOT NULL
    AND NULLIF(BTRIM(p.case_study_1), '') IS NOT NULL
    AND NULLIF(BTRIM(p.case_study_2), '') IS NOT NULL
    AND (p.category IS NULL OR p.category IN ('fully_funded','partial_funded','gelombang_1','gelombang_2'))
  ORDER BY p.updated_at DESC;
$function$;

REVOKE ALL ON FUNCTION public.list_essay_complete_participants() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_essay_complete_participants() TO authenticated, service_role;