CREATE OR REPLACE FUNCTION public.sync_essay_status_from_participant_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Hanya jalan bila status peserta berubah
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- Butuh essay lengkap agar dianggap "sudah kirim Essay & Studi Kasus"
  IF NEW.essay_worthy IS NULL
     OR NEW.essay_dream IS NULL
     OR NEW.essay_contribution IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status IN ('interview','accepted') AND NEW.essay_status IS DISTINCT FROM 'passed' THEN
    NEW.essay_status := 'passed';
    NEW.essay_updated_at := now();
  ELSIF NEW.status = 'rejected' AND NEW.essay_status IS DISTINCT FROM 'failed' THEN
    NEW.essay_status := 'failed';
    NEW.essay_updated_at := now();
    NEW.tka_status := 'pending';
    NEW.tka_updated_at := now();
    NEW.interview_status := 'pending';
    NEW.interview_updated_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_essay_status ON public.participants;
CREATE TRIGGER trg_sync_essay_status
BEFORE INSERT OR UPDATE OF status ON public.participants
FOR EACH ROW
EXECUTE FUNCTION public.sync_essay_status_from_participant_status();