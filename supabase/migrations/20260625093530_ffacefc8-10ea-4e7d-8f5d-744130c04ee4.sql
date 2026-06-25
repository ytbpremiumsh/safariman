
ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS essay_ai_score int,
  ADD COLUMN IF NOT EXISTS essay_ai_percent int,
  ADD COLUMN IF NOT EXISTS essay_ai_verdict text,
  ADD COLUMN IF NOT EXISTS essay_ai_summary text,
  ADD COLUMN IF NOT EXISTS essay_ai_graded_at timestamptz;

ALTER TABLE public.participants
  DROP CONSTRAINT IF EXISTS participants_essay_ai_verdict_check;
ALTER TABLE public.participants
  ADD CONSTRAINT participants_essay_ai_verdict_check
  CHECK (essay_ai_verdict IS NULL OR essay_ai_verdict IN ('layak','tidak_layak','ragu'));

INSERT INTO public.app_settings (key, value)
VALUES
  ('berkas_results_published', 'false'),
  ('essay_results_published', 'false')
ON CONFLICT (key) DO NOTHING;

DROP FUNCTION IF EXISTS public.list_essay_complete_participants();
CREATE OR REPLACE FUNCTION public.list_essay_complete_participants()
 RETURNS TABLE(id uuid, registration_code text, full_name text, email text, whatsapp text, gender text, birth_date date, city text, education text, occupation text, social_media text, reason text, achievements text, organization_experience text, category program_category, status participant_status, essay_worthy text, essay_dream text, essay_contribution text, case_study_1 text, case_study_2 text, cv_url text, photo_url text, twibbon_confirmed_at timestamp with time zone, payment_status text, paid_at timestamp with time zone, donation_status text, donation_paid_at timestamp with time zone, essay_ai_score int, essay_ai_percent int, essay_ai_verdict text, essay_ai_summary text, essay_ai_graded_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id, registration_code, full_name, email, whatsapp, gender, birth_date, city,
         education, occupation, social_media, reason, achievements, organization_experience,
         category, status, essay_worthy, essay_dream, essay_contribution,
         case_study_1, case_study_2,
         cv_url, photo_url, twibbon_confirmed_at,
         payment_status, paid_at, donation_status, donation_paid_at,
         essay_ai_score, essay_ai_percent, essay_ai_verdict, essay_ai_summary, essay_ai_graded_at,
         created_at, updated_at
  FROM public.participants
  WHERE essay_worthy IS NOT NULL
    AND essay_dream  IS NOT NULL
    AND essay_contribution IS NOT NULL
    AND (category IS NULL OR category IN ('fully_funded','partial_funded','gelombang_1','gelombang_2'))
    AND status IN ('interview','accepted','reviewed','rejected')
  ORDER BY created_at DESC;
$function$;

DROP FUNCTION IF EXISTS public.lookup_tahapan_by_code(text);
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
  interview_status text,
  berkas_published boolean,
  essay_published boolean
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
    p.interview_status,
    COALESCE((SELECT value FROM public.app_settings WHERE key = 'berkas_results_published'),'false')::boolean,
    COALESCE((SELECT value FROM public.app_settings WHERE key = 'essay_results_published'),'false')::boolean
  FROM public.participants p
  WHERE upper(p.registration_code) = upper(p_code)
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_essay_ai(
  p_id uuid,
  p_score int,
  p_percent int,
  p_verdict text,
  p_summary text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF p_verdict IS NOT NULL AND p_verdict NOT IN ('layak','tidak_layak','ragu') THEN
    RAISE EXCEPTION 'invalid verdict';
  END IF;
  UPDATE public.participants
     SET essay_ai_score = p_score,
         essay_ai_percent = p_percent,
         essay_ai_verdict = p_verdict,
         essay_ai_summary = p_summary,
         essay_ai_graded_at = now(),
         updated_at = now()
   WHERE id = p_id;
  RETURN FOUND;
END;
$$;
