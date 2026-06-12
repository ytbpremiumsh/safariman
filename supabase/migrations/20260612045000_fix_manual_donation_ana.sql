-- Backfill: peserta reguler yang sudah ditandai paid manual via payment_status (bug lama)
-- harus juga punya donation_status = 'paid' agar bisa lanjut ke Essay.
UPDATE public.participants
SET donation_status = 'paid',
    donation_paid_at = COALESCE(donation_paid_at, paid_at, now())
WHERE category NOT IN ('gelombang_1','gelombang_2')
  AND payment_status = 'paid'
  AND donation_status <> 'paid';
