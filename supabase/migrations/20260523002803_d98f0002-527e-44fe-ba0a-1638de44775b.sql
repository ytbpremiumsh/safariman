CREATE OR REPLACE FUNCTION public.claim_admin_if_first()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_has_admin boolean;
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO v_has_admin;
  IF v_has_admin THEN
    RETURN public.has_role(v_uid, 'admin');
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_admin_if_first() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_admin_if_first() TO authenticated;