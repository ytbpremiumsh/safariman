CREATE TABLE public.ai_provider_secrets (
  provider text PRIMARY KEY CHECK (provider IN ('openrouter')),
  api_key text NOT NULL CHECK (length(api_key) >= 10),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.ai_provider_secrets TO service_role;

ALTER TABLE public.ai_provider_secrets ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.ai_provider_secrets IS
  'Server-only AI provider credentials. No anon or authenticated grants.';