CREATE OR REPLACE FUNCTION public.list_admin_dashboard_rows()
RETURNS TABLE(
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  category program_category,
  submitted boolean,
  payment_status text,
  paid_at timestamptz,
  donation_status text,
  donation_paid_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.id, p.created_at, p.updated_at, p.category,
         (p.cv_url IS NOT NULL OR p.photo_url IS NOT NULL
          OR p.essay_worthy IS NOT NULL OR p.essay_dream IS NOT NULL
          OR p.essay_contribution IS NOT NULL) AS submitted,
         p.payment_status, p.paid_at, p.donation_status, p.donation_paid_at
  FROM public.participants p
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
  ORDER BY p.created_at DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.list_admin_dashboard_rows() FROM anon;
GRANT EXECUTE ON FUNCTION public.list_admin_dashboard_rows() TO authenticated;