
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
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.participants (full_name, email, whatsapp, gender, birth_date, city, education, occupation)
  VALUES (p_full_name, p_email, p_whatsapp, p_gender, p_birth_date, p_city, p_education, p_occupation)
  RETURNING participants.id, participants.registration_code, participants.full_name;
END;
$$;
