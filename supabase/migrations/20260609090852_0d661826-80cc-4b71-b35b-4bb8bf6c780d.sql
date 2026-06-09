
-- Seed CBT API key if missing
INSERT INTO public.app_settings (key, value)
VALUES ('cbt_api_key', 'cbt_' || encode(gen_random_bytes(24), 'hex'))
ON CONFLICT (key) DO NOTHING;

-- Helper function: list participants whose essay is complete (admin-only).
CREATE OR REPLACE FUNCTION public.list_essay_complete_participants()
RETURNS TABLE (
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
  category program_category,
  status participant_status,
  essay_worthy text,
  essay_dream text,
  essay_contribution text,
  cv_url text,
  photo_url text,
  donation_status text,
  donation_paid_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, registration_code, full_name, email, whatsapp, gender, birth_date, city,
         education, occupation, category, status, essay_worthy, essay_dream, essay_contribution,
         cv_url, photo_url, donation_status, donation_paid_at, created_at
  FROM public.participants
  WHERE essay_worthy IS NOT NULL
    AND essay_dream  IS NOT NULL
    AND essay_contribution IS NOT NULL
    AND (category IS NULL OR category IN ('fully_funded','partial_funded'))
  ORDER BY created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.list_essay_complete_participants() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_essay_complete_participants() TO authenticated, service_role;
