
-- Fix search path on updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Revoke public execute on security definer function
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- Restrict photo bucket listing (only object lookup by exact path via signed/known URL)
DROP POLICY IF EXISTS "Photos are publicly viewable" ON storage.objects;
-- Public photos still accessible via direct public URL (bucket public=true) without SELECT policy needed
