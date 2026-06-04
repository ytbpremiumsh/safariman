
ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS donation_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS donation_invoice_id text,
  ADD COLUMN IF NOT EXISTS donation_url text,
  ADD COLUMN IF NOT EXISTS donation_paid_at timestamptz;

CREATE INDEX IF NOT EXISTS participants_donation_invoice_id_idx
  ON public.participants(donation_invoice_id);

UPDATE public.participants
SET donation_status = 'paid',
    donation_paid_at = COALESCE(donation_paid_at, paid_at, now())
WHERE payment_status = 'paid'
  AND (category IS NULL OR category NOT IN ('gelombang_1','gelombang_2'))
  AND donation_status <> 'paid';

DROP FUNCTION IF EXISTS public.lookup_participant_by_code(text);
DROP FUNCTION IF EXISTS public.lookup_payment_status_by_code(text);

CREATE OR REPLACE FUNCTION public.lookup_participant_by_code(p_code text)
RETURNS TABLE(
  id uuid, full_name text, has_berkas boolean, has_essay boolean,
  status participant_status, payment_status text,
  donation_status text, category program_category
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT
    id,
    full_name,
    (cv_url IS NOT NULL AND photo_url IS NOT NULL),
    (essay_worthy IS NOT NULL AND essay_dream IS NOT NULL AND essay_contribution IS NOT NULL),
    status,
    payment_status,
    donation_status,
    category
  FROM public.participants
  WHERE upper(registration_code) = upper(p_code)
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.lookup_payment_status_by_code(p_code text)
RETURNS TABLE(
  id uuid, full_name text, status participant_status,
  payment_status text, payment_url text, paid_at timestamptz,
  category program_category,
  donation_status text, donation_url text, donation_paid_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT id, full_name, status, payment_status, payment_url, paid_at, category,
         donation_status, donation_url, donation_paid_at
  FROM public.participants
  WHERE upper(registration_code) = upper(p_code)
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.save_donation_invoice(p_code text, p_invoice_id text, p_url text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_count int;
BEGIN
  UPDATE public.participants
  SET donation_invoice_id = p_invoice_id,
      donation_url = p_url,
      donation_status = 'pending',
      updated_at = now()
  WHERE upper(registration_code) = upper(p_code);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_donation_paid(p_invoice_id text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_count int;
BEGIN
  UPDATE public.participants
  SET donation_status = 'paid', donation_paid_at = now(), updated_at = now()
  WHERE donation_invoice_id = p_invoice_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;
