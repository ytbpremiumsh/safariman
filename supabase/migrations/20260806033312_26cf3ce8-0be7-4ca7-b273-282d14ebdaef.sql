CREATE OR REPLACE FUNCTION public.get_stats_with_password(_password text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  pw text;
  res jsonb;
  v_days int := 30;
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
    'total', GREATEST(0, count(*) - 20),
    'kontribusi_paid', GREATEST(0, count(*) FILTER (WHERE donation_status = 'paid') - 20),
    'kontribusi_unpaid', count(*) FILTER (WHERE donation_status IS DISTINCT FROM 'paid'),
    'today_daftar', count(*) FILTER (WHERE (created_at AT TIME ZONE 'Asia/Jakarta')::date = ((now() AT TIME ZONE 'Asia/Jakarta')::date)),
    'today_kontribusi', count(*) FILTER (WHERE donation_status = 'paid' AND (donation_paid_at AT TIME ZONE 'Asia/Jakarta')::date = ((now() AT TIME ZONE 'Asia/Jakarta')::date))
  ) INTO res
  FROM public.participants;

  res := res || jsonb_build_object('by_day', COALESCE((
    SELECT jsonb_agg(row_to_json(t) ORDER BY t.day)
    FROM (
      SELECT d::date AS day,
        (SELECT COUNT(*) FROM public.participants p
          WHERE (p.created_at AT TIME ZONE 'Asia/Jakarta')::date = d::date) AS daftar,
        (SELECT COUNT(*) FROM public.participants p
          WHERE p.donation_status = 'paid'
            AND (p.donation_paid_at AT TIME ZONE 'Asia/Jakarta')::date = d::date) AS kontribusi
      FROM generate_series(
        ((now() AT TIME ZONE 'Asia/Jakarta')::date - (v_days - 1)),
        (now() AT TIME ZONE 'Asia/Jakarta')::date,
        interval '1 day'
      ) d
    ) t
  ), '[]'::jsonb));

  RETURN res;
END;
$function$;