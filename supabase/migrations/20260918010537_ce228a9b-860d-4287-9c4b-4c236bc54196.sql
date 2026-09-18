ALTER TABLE public.staff_essay_reviews
  ADD COLUMN IF NOT EXISTS scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS total_score smallint NOT NULL DEFAULT 0,
  ADD CONSTRAINT staff_essay_reviews_total_score_range CHECK (total_score BETWEEN 0 AND 100);

ALTER TABLE public.seleksi_private_reviews
  ADD COLUMN IF NOT EXISTS scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS total_score smallint NOT NULL DEFAULT 0,
  ADD CONSTRAINT seleksi_private_reviews_total_score_range CHECK (total_score BETWEEN 0 AND 100);

CREATE TABLE public.admin_essay_reviews (
  participant_id uuid PRIMARY KEY REFERENCES public.participants(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL,
  reviewer_name text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('reviewed', 'interview', 'rejected')),
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_score smallint NOT NULL DEFAULT 0 CHECK (total_score BETWEEN 0 AND 100),
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_essay_reviews TO authenticated;
GRANT ALL ON public.admin_essay_reviews TO service_role;
ALTER TABLE public.admin_essay_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage admin essay reviews"
ON public.admin_essay_reviews FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER set_admin_essay_reviews_updated_at
BEFORE UPDATE ON public.admin_essay_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.admin_save_essay_review(
  p_participant_id uuid,
  p_scores jsonb,
  p_decision text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_name text;
  v_total integer;
  v_keys text[] := ARRAY['essay_1','essay_2','essay_3','case_1','case_2','case_3','case_4','case_5','case_6','case_7'];
  v_key text;
  v_value integer;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF p_decision NOT IN ('reviewed','interview','rejected') THEN
    RAISE EXCEPTION 'invalid decision';
  END IF;
  IF p_scores IS NULL OR jsonb_typeof(p_scores) <> 'object' THEN
    RAISE EXCEPTION 'invalid scores';
  END IF;
  v_total := 0;
  FOREACH v_key IN ARRAY v_keys LOOP
    IF NOT (p_scores ? v_key) OR jsonb_typeof(p_scores->v_key) <> 'number' THEN
      RAISE EXCEPTION 'all scores are required';
    END IF;
    v_value := (p_scores->>v_key)::integer;
    IF v_value < 0 OR v_value > 10 THEN
      RAISE EXCEPTION 'score out of range';
    END IF;
    v_total := v_total + v_value;
  END LOOP;
  IF (SELECT count(*) FROM jsonb_object_keys(p_scores)) <> 10 THEN
    RAISE EXCEPTION 'invalid score fields';
  END IF;

  SELECT COALESCE(raw_user_meta_data->>'name', email, 'Admin') INTO v_name
  FROM auth.users WHERE id = v_uid;

  INSERT INTO public.admin_essay_reviews
    (participant_id, reviewer_id, reviewer_name, decision, scores, total_score, reviewed_at, updated_at)
  VALUES
    (p_participant_id, v_uid, COALESCE(v_name, 'Admin'), p_decision, p_scores, v_total, now(), now())
  ON CONFLICT (participant_id) DO UPDATE SET
    reviewer_id = EXCLUDED.reviewer_id,
    reviewer_name = EXCLUDED.reviewer_name,
    decision = EXCLUDED.decision,
    scores = EXCLUDED.scores,
    total_score = EXCLUDED.total_score,
    reviewed_at = now(),
    updated_at = now();

  UPDATE public.participants SET
    status = CASE WHEN p_decision = 'interview' THEN 'interview'::participant_status
                  WHEN p_decision = 'rejected' THEN 'rejected'::participant_status
                  ELSE 'reviewed'::participant_status END,
    essay_status = CASE WHEN p_decision = 'interview' THEN 'passed'
                        WHEN p_decision = 'rejected' THEN 'failed'
                        ELSE 'pending' END,
    essay_updated_at = now(),
    tka_status = CASE WHEN p_decision = 'interview' THEN tka_status ELSE 'pending' END,
    tka_updated_at = CASE WHEN p_decision = 'interview' THEN tka_updated_at ELSE now() END,
    interview_status = CASE WHEN p_decision = 'interview' THEN interview_status ELSE 'pending' END,
    interview_updated_at = CASE WHEN p_decision = 'interview' THEN interview_updated_at ELSE now() END,
    updated_at = now()
  WHERE id = p_participant_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'participant not found'; END IF;
  RETURN jsonb_build_object('scores', p_scores, 'total_score', v_total, 'decision', p_decision, 'reviewer_name', COALESCE(v_name, 'Admin'), 'updated_at', now());
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_save_essay_review(uuid, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_essay_review(uuid, jsonb, text) TO service_role;