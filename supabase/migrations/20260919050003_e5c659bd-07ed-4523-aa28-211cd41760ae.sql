CREATE POLICY "Server manages AI provider secrets"
ON public.ai_provider_secrets
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);