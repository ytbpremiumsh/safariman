UPDATE public.app_settings
SET value = to_jsonb(replace(value::text, '13 Juli', '15 Juli'))::jsonb
WHERE key IN ('timeline_config','wa_quick_replies') AND value::text LIKE '%13 Juli%';