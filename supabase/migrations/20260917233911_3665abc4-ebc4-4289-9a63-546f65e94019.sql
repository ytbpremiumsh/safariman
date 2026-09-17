ALTER TABLE public.seleksi_private_tokens
  ADD COLUMN IF NOT EXISTS reviewer_name text,
  ADD COLUMN IF NOT EXISTS created_by uuid;

CREATE INDEX IF NOT EXISTS seleksi_private_tokens_token_expires_idx
  ON public.seleksi_private_tokens(token, expires_at);