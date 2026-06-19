CREATE OR REPLACE FUNCTION public.mark_payment_paid(p_invoice_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_count int;
BEGIN
  UPDATE public.participants
  SET payment_status = 'paid',
      paid_at = now(),
      status = CASE
                 WHEN category IN ('gelombang_1'::program_category, 'gelombang_2'::program_category, 'self_funded'::program_category)
                   THEN 'accepted'::participant_status
                 ELSE status
               END,
      updated_at = now()
  WHERE payment_invoice_id = p_invoice_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$function$;