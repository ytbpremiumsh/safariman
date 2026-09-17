CREATE TABLE public.seleksi_private_reviews (
  participant_id uuid PRIMARY KEY REFERENCES public.participants(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('reviewed', 'interview', 'rejected')),
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.seleksi_private_reviews TO service_role;

ALTER TABLE public.seleksi_private_reviews ENABLE ROW LEVEL SECURITY;

CREATE INDEX seleksi_private_reviews_decision_idx
  ON public.seleksi_private_reviews(decision, updated_at DESC);