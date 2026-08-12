import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if a credit-consuming feature is enabled.
 * Default is FALSE if not set.
 */
export async function isFeatureEnabled(key: "ai_grading_enabled" | "wa_ai_reply_enabled" | "payment_reminders_enabled" | "db_backup_reminder_enabled") {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  
  // Default to false if not set
  return data?.value === "true";
}


export async function toggleFeature(key: string, enabled: boolean) {
  const { error } = await supabase.rpc("admin_set_setting", {
    p_key: key,
    p_value: enabled ? "true" : "false"
  });
  return { error };
}
