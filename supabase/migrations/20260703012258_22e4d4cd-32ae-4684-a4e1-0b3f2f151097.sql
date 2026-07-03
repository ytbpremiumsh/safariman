
CREATE OR REPLACE FUNCTION public.admin_set_tahapan(p_id uuid, p_stage text, p_value text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF p_value NOT IN ('pending','passed','failed') THEN
    RAISE EXCEPTION 'invalid value';
  END IF;

  IF p_stage = 'essay' THEN
    UPDATE public.participants
    SET essay_status = p_value,
        essay_updated_at = now(),
        -- Cascade: bila essay bukan passed, tahap TKA & Interview otomatis di-reset ke pending
        tka_status = CASE WHEN p_value = 'passed' THEN tka_status ELSE 'pending' END,
        tka_updated_at = CASE WHEN p_value = 'passed' THEN tka_updated_at ELSE now() END,
        interview_status = CASE WHEN p_value = 'passed' THEN interview_status ELSE 'pending' END,
        interview_updated_at = CASE WHEN p_value = 'passed' THEN interview_updated_at ELSE now() END,
        updated_at = now()
    WHERE id = p_id;
  ELSIF p_stage = 'tka' THEN
    UPDATE public.participants
    SET tka_status = p_value,
        tka_updated_at = now(),
        -- Cascade: bila TKA bukan passed, Interview otomatis di-reset ke pending
        interview_status = CASE WHEN p_value = 'passed' THEN interview_status ELSE 'pending' END,
        interview_updated_at = CASE WHEN p_value = 'passed' THEN interview_updated_at ELSE now() END,
        updated_at = now()
    WHERE id = p_id;
  ELSIF p_stage = 'interview' THEN
    UPDATE public.participants
    SET interview_status = p_value,
        interview_updated_at = now(),
        status = CASE
                   WHEN p_value = 'passed' THEN 'accepted'::participant_status
                   WHEN p_value = 'failed' THEN 'rejected'::participant_status
                   ELSE status
                 END,
        updated_at = now()
    WHERE id = p_id;
  ELSE
    RAISE EXCEPTION 'invalid stage';
  END IF;

  RETURN FOUND;
END;
$function$;

-- Backfill: samakan tahap dengan keputusan Essay yang sudah tersimpan di kolom status
UPDATE public.participants
SET essay_status = 'failed',
    tka_status = 'pending',
    interview_status = 'pending',
    essay_updated_at = COALESCE(essay_updated_at, now()),
    tka_updated_at = now(),
    interview_updated_at = now(),
    updated_at = now()
WHERE status = 'rejected'
  AND essay_worthy IS NOT NULL
  AND essay_status = 'passed';
