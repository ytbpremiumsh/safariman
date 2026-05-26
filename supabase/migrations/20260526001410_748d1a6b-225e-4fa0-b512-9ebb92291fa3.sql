DROP FUNCTION IF EXISTS public.lookup_payment_status_by_code(text);
CREATE OR REPLACE FUNCTION public.lookup_payment_status_by_code(p_code text)
 RETURNS TABLE(id uuid, full_name text, status participant_status, payment_status text, payment_url text, paid_at timestamp with time zone, category program_category)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id, full_name, status, payment_status, payment_url, paid_at, category
  FROM public.participants
  WHERE upper(registration_code) = upper(p_code)
  LIMIT 1;
$function$;