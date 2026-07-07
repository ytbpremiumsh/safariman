-- Composite index untuk query utama PesertaTable admin:
--   WHERE category IN (...) ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_participants_category_created
  ON public.participants (category, created_at DESC);

-- Percepat filter status pembayaran di dashboard
CREATE INDEX IF NOT EXISTS idx_participants_payment_status
  ON public.participants (payment_status)
  WHERE payment_status IS NOT NULL;

-- Percepat pemrosesan antrian email (state check by created_at)
CREATE INDEX IF NOT EXISTS idx_email_send_state_updated
  ON public.email_send_state (updated_at DESC);