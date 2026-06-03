
CREATE TABLE public.twibbon_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')::date
);

GRANT SELECT ON public.twibbon_downloads TO authenticated;
GRANT ALL ON public.twibbon_downloads TO service_role;

ALTER TABLE public.twibbon_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view downloads"
  ON public.twibbon_downloads FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_twibbon_downloads_day ON public.twibbon_downloads(day DESC);

CREATE OR REPLACE FUNCTION public.log_twibbon_download()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.twibbon_downloads DEFAULT VALUES;
$$;

GRANT EXECUTE ON FUNCTION public.log_twibbon_download() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_twibbon_download_stats(p_days int DEFAULT 30)
RETURNS TABLE(day date, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d::date AS day,
         COALESCE((SELECT COUNT(*) FROM public.twibbon_downloads td WHERE td.day = d::date), 0) AS count
  FROM generate_series(
    ((now() AT TIME ZONE 'Asia/Jakarta')::date - (p_days - 1)),
    (now() AT TIME ZONE 'Asia/Jakarta')::date,
    interval '1 day'
  ) d
  ORDER BY d DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_twibbon_download_stats(int) TO authenticated;
