CREATE OR REPLACE FUNCTION public.list_unpaid_participants_with_reminders()
RETURNS TABLE(id uuid, registration_code text, full_name text, email text, whatsapp text, category program_category, created_at timestamp with time zone, fast_track_unpaid boolean, kontribusi_unpaid boolean, fast_track_reminder_count integer, kontribusi_reminder_count integer, last_fast_track_reminder_at timestamp with time zone, last_kontribusi_reminder_at timestamp with time zone, has_berkas boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p.id, p.registration_code, p.full_name, p.email, p.whatsapp, p.category, p.created_at,
    (p.category IN ('gelombang_1'::program_category,'gelombang_2'::program_category)
      AND COALESCE(p.payment_status,'pending') <> 'paid'
      AND p.email IS NOT NULL) AS fast_track_unpaid,
    (p.category = 'fully_funded'::program_category
      AND COALESCE(p.donation_status,'pending') <> 'paid'
      AND p.email IS NOT NULL) AS kontribusi_unpaid,
    COALESCE((SELECT COUNT(*)::int FROM public.payment_reminders r WHERE r.participant_id = p.id AND r.kind='fast_track'),0),
    COALESCE((SELECT COUNT(*)::int FROM public.payment_reminders r WHERE r.participant_id = p.id AND r.kind='kontribusi'),0),
    (SELECT MAX(created_at) FROM public.payment_reminders r WHERE r.participant_id = p.id AND r.kind='fast_track'),
    (SELECT MAX(created_at) FROM public.payment_reminders r WHERE r.participant_id = p.id AND r.kind='kontribusi'),
    (p.cv_url IS NOT NULL AND p.photo_url IS NOT NULL) AS has_berkas
  FROM public.participants p
  WHERE p.email IS NOT NULL AND p.email <> ''
    AND (
      (p.category IN ('gelombang_1'::program_category,'gelombang_2'::program_category)
        AND COALESCE(p.payment_status,'pending') <> 'paid')
      OR (p.category = 'fully_funded'::program_category
        AND COALESCE(p.donation_status,'pending') <> 'paid')
    );
$function$;