
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS religion text;

CREATE OR REPLACE FUNCTION public.register_participant(
  p_full_name text,
  p_email text,
  p_whatsapp text,
  p_gender text,
  p_birth_date date,
  p_city text,
  p_education text,
  p_occupation text,
  p_category program_category DEFAULT 'fully_funded'::program_category,
  p_instagram text DEFAULT NULL::text,
  p_religion text DEFAULT NULL::text
)
RETURNS TABLE(id uuid, registration_code text, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
  v_code text;
BEGIN
  INSERT INTO public.participants (
    full_name, email, whatsapp, gender, birth_date, city, education, occupation, category, social_media, religion, status
  ) VALUES (
    p_full_name, p_email, p_whatsapp, p_gender, p_birth_date, p_city, p_education, p_occupation, p_category, p_instagram, p_religion,
    CASE WHEN p_category = 'self_funded'::program_category THEN 'interview'::participant_status ELSE 'pending'::participant_status END
  )
  RETURNING participants.id, participants.registration_code INTO v_id, v_code;

  RETURN QUERY SELECT v_id, v_code, p_full_name;
END;
$function$;
