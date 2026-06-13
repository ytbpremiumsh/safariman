CREATE OR REPLACE FUNCTION public.list_essay_complete_participants()
 RETURNS TABLE(id uuid, registration_code text, full_name text, email text, whatsapp text, gender text, birth_date date, city text, education text, occupation text, social_media text, reason text, achievements text, organization_experience text, category program_category, status participant_status, essay_worthy text, essay_dream text, essay_contribution text, cv_url text, photo_url text, twibbon_confirmed_at timestamp with time zone, payment_status text, paid_at timestamp with time zone, donation_status text, donation_paid_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id, registration_code, full_name, email, whatsapp, gender, birth_date, city,
         education, occupation, social_media, reason, achievements, organization_experience,
         category, status, essay_worthy, essay_dream, essay_contribution,
         cv_url, photo_url, twibbon_confirmed_at,
         payment_status, paid_at, donation_status, donation_paid_at,
         created_at, updated_at
  FROM public.participants
  WHERE essay_worthy IS NOT NULL
    AND essay_dream  IS NOT NULL
    AND essay_contribution IS NOT NULL
    AND (category IS NULL OR category IN ('fully_funded','partial_funded'))
    AND status IN ('interview','accepted')
  ORDER BY created_at DESC;
$function$;