DROP FUNCTION IF EXISTS public.save_payment_invoice(text, text, text);
CREATE OR REPLACE FUNCTION public.save_payment_invoice(p_code text, p_invoice_id text, p_url text, p_expires_at timestamptz DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_count int;
BEGIN
  UPDATE public.participants
  SET payment_invoice_id = p_invoice_id,
      payment_url = p_url,
      payment_status = 'pending',
      payment_invoice_expires_at = p_expires_at,
      updated_at = now()
  WHERE upper(registration_code) = upper(p_code);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN NOT (v_count = 0);
END;
$$;

DROP FUNCTION IF EXISTS public.save_donation_invoice(text, text, text);
CREATE OR REPLACE FUNCTION public.save_donation_invoice(p_code text, p_invoice_id text, p_url text, p_expires_at timestamptz DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_count int;
BEGIN
  UPDATE public.participants
  SET donation_invoice_id = p_invoice_id,
      donation_url = p_url,
      donation_status = 'pending',
      donation_invoice_expires_at = p_expires_at,
      updated_at = now()
  WHERE upper(registration_code) = upper(p_code);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN NOT (v_count = 0);
END;
$$;