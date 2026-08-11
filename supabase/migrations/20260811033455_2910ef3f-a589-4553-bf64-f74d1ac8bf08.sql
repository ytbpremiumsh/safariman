UPDATE public.app_settings 
SET value = REPLACE(value::text, 'Gunakan bahasa Indonesia santai-formal', 'Gunakan bahasa Indonesia') 
WHERE key = 'wa_ai_behavior';