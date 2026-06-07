// Thin helper for calling Supabase Edge Functions from the browser.
// Replaces the old fetch("/api/public/...") + createServerFn pattern.
import { supabase } from "@/integrations/supabase/client";

export type WaEvent = "pendaftaran" | "berkas" | "essay";

export async function notifyWa(event: WaEvent, code: string) {
  const { data, error } = await supabase.functions.invoke("wa-notify", {
    body: { event, code },
  });
  if (error) throw error;
  return data;
}

export async function mayarPendaftaranInvoice(code: string) {
  const { data, error } = await supabase.functions.invoke("mayar-pendaftaran-invoice", {
    body: { code },
  });
  if (error) throw error;
  return data as { ok: boolean; url?: string; alreadyPaid?: boolean; reused?: boolean; error?: string };
}

export async function mayarCreateInvoice(code: string, force = false) {
  const { data, error } = await supabase.functions.invoke("mayar-create-invoice", {
    body: { code, force },
  });
  if (error) throw error;
  return data as { ok: boolean; url?: string; alreadyPaid?: boolean; reused?: boolean; error?: string };
}

export async function mpwaProxy(endpoint: "generate-qr" | "send-message", payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("mpwa-proxy", {
    body: { endpoint, payload },
  });
  if (error) throw error;
  return data;
}

export function edgeFunctionUrl(name: string) {
  const base = (import.meta.env.VITE_SUPABASE_URL as string).replace(/\/$/, "");
  return `${base}/functions/v1/${name}`;
}
