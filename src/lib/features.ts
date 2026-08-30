import { supabase } from "@/integrations/supabase/client";

export const AI_PAUSED = true;
export const AI_PAUSED_MESSAGE = "Fitur AI dikunci nonaktif sementara untuk menghemat kredit.";
export function isAiFeature(key: string) {
  return key === "ai_grading_enabled" || key === "wa_ai_reply_enabled" || key === "wa_ai_enabled";
}

/**
 * Checks if a credit-consuming feature is enabled.
 * Default is FALSE if not set.
 */
export async function isFeatureEnabled(key: "ai_grading_enabled" | "wa_ai_reply_enabled" | "payment_reminders_enabled" | "db_backup_reminder_enabled") {
  if (AI_PAUSED && isAiFeature(key)) return false;
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  
  // Default to false if not set
  return data?.value === "true";
}


export async function toggleFeature(key: string, enabled: boolean) {
  if (AI_PAUSED && enabled && isAiFeature(key)) return { error: new Error(AI_PAUSED_MESSAGE) };
  const { error } = await supabase.rpc("admin_set_setting", {
    p_key: key,
    p_value: enabled ? "true" : "false"
  });
  return { error };
}
