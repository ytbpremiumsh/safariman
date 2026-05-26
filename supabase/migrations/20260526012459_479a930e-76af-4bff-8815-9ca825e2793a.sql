ALTER TABLE public.participants REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;