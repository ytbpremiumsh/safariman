-- Disable both current AI flags and the legacy WA flag.
-- This must be applied to production as well as deploying the edge functions.
INSERT INTO public.app_settings (key, value, updated_at)
VALUES ('wa_ai_reply_enabled', 'false', now()),
       ('wa_ai_enabled', 'false', now()),
       ('ai_grading_enabled', 'false', now())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
