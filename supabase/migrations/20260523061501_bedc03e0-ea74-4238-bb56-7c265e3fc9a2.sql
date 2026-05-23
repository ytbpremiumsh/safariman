
ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_url text,
  ADD COLUMN IF NOT EXISTS payment_invoice_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE INDEX IF NOT EXISTS participants_payment_invoice_id_idx ON public.participants(payment_invoice_id);

-- Lookup payment status by code (public)
CREATE OR REPLACE FUNCTION public.lookup_payment_status_by_code(p_code text)
RETURNS TABLE(id uuid, full_name text, status participant_status, payment_status text, payment_url text, paid_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, full_name, status, payment_status, payment_url, paid_at
  FROM public.participants
  WHERE upper(registration_code) = upper(p_code)
  LIMIT 1;
$$;

-- Save invoice info (called from trusted server fn)
CREATE OR REPLACE FUNCTION public.save_payment_invoice(p_code text, p_invoice_id text, p_url text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count int;
BEGIN
  UPDATE public.participants
  SET payment_invoice_id = p_invoice_id,
      payment_url = p_url,
      payment_status = 'pending',
      updated_at = now()
  WHERE upper(registration_code) = upper(p_code);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

-- Mark payment as paid by invoice id (webhook)
CREATE OR REPLACE FUNCTION public.mark_payment_paid(p_invoice_id text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count int;
BEGIN
  UPDATE public.participants
  SET payment_status = 'paid', paid_at = now(), updated_at = now()
  WHERE payment_invoice_id = p_invoice_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_payment_status_by_code(text) TO anon, authenticated;
