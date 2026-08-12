INSERT INTO public.app_settings (key, value)
VALUES 
  ('ai_grading_enabled', 'false'),
  ('wa_ai_reply_enabled', 'false'),
  ('payment_reminders_enabled', 'false'),
  ('db_backup_reminder_enabled', 'false')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;