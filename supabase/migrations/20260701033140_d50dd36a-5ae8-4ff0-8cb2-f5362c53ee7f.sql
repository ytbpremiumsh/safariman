CREATE OR REPLACE FUNCTION public.register_participant(
  p_full_name text,
  p_email text,
  p_whatsapp text,
  p_gender text,
  p_birth_date date,
  p_city text,
  p_education text,
  p_occupation text
)
RETURNS TABLE(id uuid, registration_code text, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT * FROM public.register_participant(
    p_full_name, p_email, p_whatsapp, p_gender, p_birth_date, p_city, p_education, p_occupation,
    'fully_funded'::program_category, NULL::text, NULL::text, NULL::text
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.register_participant(
  p_full_name text,
  p_email text,
  p_whatsapp text,
  p_gender text,
  p_birth_date date,
  p_city text,
  p_education text,
  p_occupation text,
  p_category program_category DEFAULT 'fully_funded'::program_category
)
RETURNS TABLE(id uuid, registration_code text, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT * FROM public.register_participant(
    p_full_name, p_email, p_whatsapp, p_gender, p_birth_date, p_city, p_education, p_occupation,
    p_category, NULL::text, NULL::text, NULL::text
  );
END;
$function$;

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
  p_instagram text DEFAULT NULL::text
)
RETURNS TABLE(id uuid, registration_code text, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT * FROM public.register_participant(
    p_full_name, p_email, p_whatsapp, p_gender, p_birth_date, p_city, p_education, p_occupation,
    p_category, p_instagram, NULL::text, NULL::text
  );
END;
$function$;

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
BEGIN
  RETURN QUERY
  SELECT * FROM public.register_participant(
    p_full_name, p_email, p_whatsapp, p_gender, p_birth_date, p_city, p_education, p_occupation,
    p_category, p_instagram, p_religion, NULL::text
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.register_participant(text,text,text,text,date,text,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_participant(text,text,text,text,date,text,text,text,program_category) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_participant(text,text,text,text,date,text,text,text,program_category,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_participant(text,text,text,text,date,text,text,text,program_category,text,text) TO anon, authenticated;