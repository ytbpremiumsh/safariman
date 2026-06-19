UPDATE public.participants
SET status = 'accepted'::participant_status,
    updated_at = now()
WHERE payment_status = 'paid'
  AND category IN ('gelombang_1'::program_category, 'gelombang_2'::program_category)
  AND status <> 'accepted'::participant_status;