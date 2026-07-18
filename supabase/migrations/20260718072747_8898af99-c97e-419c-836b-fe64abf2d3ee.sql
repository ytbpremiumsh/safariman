
CREATE TABLE IF NOT EXISTS public.payment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('fast_track','kontribusi')),
  channel text NOT NULL DEFAULT 'email',
  sent_by uuid,
  auto boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'sent',
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_participant ON public.payment_reminders(participant_id, kind, created_at DESC);

GRANT SELECT ON public.payment_reminders TO authenticated;
GRANT ALL ON public.payment_reminders TO service_role;
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can read reminders" ON public.payment_reminders;
CREATE POLICY "Admin can read reminders" ON public.payment_reminders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- List peserta yang belum bayar (fast_track = gelombang_1/2 belum paid, kontribusi = donation belum paid)
CREATE OR REPLACE FUNCTION public.list_unpaid_participants_with_reminders()
RETURNS TABLE(
  id uuid, registration_code text, full_name text, email text, whatsapp text,
  category program_category, created_at timestamptz,
  fast_track_unpaid boolean, kontribusi_unpaid boolean,
  fast_track_reminder_count int, kontribusi_reminder_count int,
  last_fast_track_reminder_at timestamptz, last_kontribusi_reminder_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.registration_code, p.full_name, p.email, p.whatsapp, p.category, p.created_at,
    (p.category IN ('gelombang_1'::program_category,'gelombang_2'::program_category)
      AND COALESCE(p.payment_status,'pending') <> 'paid'
      AND p.email IS NOT NULL) AS fast_track_unpaid,
    (COALESCE(p.donation_status,'pending') <> 'paid'
      AND p.email IS NOT NULL) AS kontribusi_unpaid,
    COALESCE((SELECT COUNT(*)::int FROM public.payment_reminders r WHERE r.participant_id = p.id AND r.kind='fast_track'),0),
    COALESCE((SELECT COUNT(*)::int FROM public.payment_reminders r WHERE r.participant_id = p.id AND r.kind='kontribusi'),0),
    (SELECT MAX(created_at) FROM public.payment_reminders r WHERE r.participant_id = p.id AND r.kind='fast_track'),
    (SELECT MAX(created_at) FROM public.payment_reminders r WHERE r.participant_id = p.id AND r.kind='kontribusi')
  FROM public.participants p
  WHERE p.email IS NOT NULL AND p.email <> ''
    AND (
      (p.category IN ('gelombang_1'::program_category,'gelombang_2'::program_category)
        AND COALESCE(p.payment_status,'pending') <> 'paid')
      OR COALESCE(p.donation_status,'pending') <> 'paid'
    )
  ORDER BY p.created_at DESC;
$$;

-- Ambil peserta yang layak dikirim reminder otomatis (H+1, H+3, H+7 sejak pendaftaran; max 3).
CREATE OR REPLACE FUNCTION public.list_auto_reminder_candidates()
RETURNS TABLE(participant_id uuid, kind text, registration_code text, full_name text, email text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT p.id AS participant_id,
           k.kind,
           p.registration_code, p.full_name, p.email,
           p.created_at,
           EXTRACT(EPOCH FROM (now() - p.created_at))/86400.0 AS age_days,
           (SELECT COUNT(*) FROM public.payment_reminders r
             WHERE r.participant_id = p.id AND r.kind = k.kind)::int AS sent_count,
           (SELECT MAX(r.created_at) FROM public.payment_reminders r
             WHERE r.participant_id = p.id AND r.kind = k.kind) AS last_sent_at
    FROM public.participants p
    CROSS JOIN LATERAL (VALUES ('fast_track'::text), ('kontribusi'::text)) AS k(kind)
    WHERE p.email IS NOT NULL AND p.email <> ''
      AND (
        (k.kind = 'fast_track'
          AND p.category IN ('gelombang_1'::program_category,'gelombang_2'::program_category)
          AND COALESCE(p.payment_status,'pending') <> 'paid')
        OR (k.kind = 'kontribusi'
          AND COALESCE(p.donation_status,'pending') <> 'paid')
      )
  )
  SELECT c.participant_id, c.kind, c.registration_code, c.full_name, c.email
  FROM candidates c
  WHERE c.sent_count < 3
    AND (c.last_sent_at IS NULL OR (now() - c.last_sent_at) > interval '20 hours')
    AND (
      (c.sent_count = 0 AND c.age_days >= 1)
      OR (c.sent_count = 1 AND c.age_days >= 3)
      OR (c.sent_count = 2 AND c.age_days >= 7)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_unpaid_participants_with_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_auto_reminder_candidates() TO service_role;
