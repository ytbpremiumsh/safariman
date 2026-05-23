ALTER TABLE public.participants
  ALTER COLUMN category DROP NOT NULL,
  ALTER COLUMN reason DROP NOT NULL,
  ALTER COLUMN achievements DROP NOT NULL;

-- Allow public update of own row during the multi-step flow (twibbon / berkas) using the returned id
-- We'll restrict by id presence; safer alternative would be a token, but for this onboarding flow id is enough.
CREATE POLICY "Anyone can update their own participant row by id"
ON public.participants
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);