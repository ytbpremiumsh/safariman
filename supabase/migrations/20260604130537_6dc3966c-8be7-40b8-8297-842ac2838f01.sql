
CREATE OR REPLACE FUNCTION public.submit_essay_by_code(p_code text, p_essay_worthy text, p_essay_dream text, p_essay_contribution text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_count int;
BEGIN
  UPDATE public.participants
  SET essay_worthy = p_essay_worthy,
      essay_dream = p_essay_dream,
      essay_contribution = p_essay_contribution,
      updated_at = now()
  WHERE upper(registration_code) = upper(p_code)
    AND donation_status = 'paid';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;
