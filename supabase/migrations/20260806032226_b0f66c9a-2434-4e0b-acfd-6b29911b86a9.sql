CREATE OR REPLACE FUNCTION public.get_stats_with_password(_password text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pw text;
  res jsonb;
BEGIN
  SELECT value INTO pw FROM public.app_settings WHERE key = 'stats_password';
  IF pw IS NULL OR pw = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_configured');
  END IF;
  IF _password IS NULL OR _password <> pw THEN
    RETURN jsonb_build_object('ok', false, 'error', 'wrong_password');
  END IF;

  SELECT jsonb_build_object(
    'ok', true,
    'generated_at', now(),
    'total', count(*),
    'reguler', count(*) FILTER (WHERE category IS NULL OR category IN ('fully_funded','partial_funded')),
    'self_funded', count(*) FILTER (WHERE category = 'self_funded'),
    'gelombang_1', count(*) FILTER (WHERE category = 'gelombang_1'),
    'gelombang_2', count(*) FILTER (WHERE category = 'gelombang_2'),
    'fast_track_paid', count(*) FILTER (WHERE category IN ('gelombang_1','gelombang_2') AND payment_status = 'paid'),
    'fast_track_unpaid', count(*) FILTER (WHERE category IN ('gelombang_1','gelombang_2') AND payment_status <> 'paid'),
    'berkas_submitted', count(*) FILTER (WHERE cv_url IS NOT NULL AND photo_url IS NOT NULL),
    'essay_submitted', count(*) FILTER (WHERE essay_worthy IS NOT NULL AND essay_worthy <> ''),
    'kontribusi_paid', count(*) FILTER (WHERE donation_status = 'paid'),
    'kontribusi_unpaid', count(*) FILTER (WHERE donation_status IS DISTINCT FROM 'paid'),
    'today_daftar', count(*) FILTER (WHERE (created_at AT TIME ZONE 'Asia/Jakarta')::date = ((now() AT TIME ZONE 'Asia/Jakarta')::date)),
    'today_kontribusi', count(*) FILTER (WHERE donation_status = 'paid' AND (donation_paid_at AT TIME ZONE 'Asia/Jakarta')::date = ((now() AT TIME ZONE 'Asia/Jakarta')::date)),
    'today_fast_track', count(*) FILTER (WHERE category IN ('gelombang_1','gelombang_2') AND payment_status = 'paid' AND (paid_at AT TIME ZONE 'Asia/Jakarta')::date = ((now() AT TIME ZONE 'Asia/Jakarta')::date))
  ) INTO res
  FROM public.participants;

  RETURN res;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_stats_with_password(text) TO anon, authenticated, service_role;