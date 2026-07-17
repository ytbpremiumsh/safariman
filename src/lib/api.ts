// Thin helper for calling Supabase Edge Functions from the browser.
// Replaces the old fetch("/api/public/...") + createServerFn pattern.
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";

// supabase.functions.invoke() melempar untuk semua respons non-2xx (mis. 503),
// jadi kita tidak pernah bisa membaca `{ ok:false, error }` yang function balas.
// Helper ini menyerap error itu, mengekstrak body JSON, dan mengembalikannya
// seakan-akan responsnya normal — supaya caller bisa retry / kasih pesan tepat.
async function invokeSoft<T>(name: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body: body as any });
  if (!error) return data as T;
  if (error instanceof FunctionsHttpError) {
    try {
      const text = await error.context.text();
      const parsed = JSON.parse(text);
      return parsed as T;
    } catch {
      return { ok: false, error: error.message } as T;
    }
  }
  throw error;
}

export type WaEvent = "pendaftaran" | "berkas" | "essay";
export type EmailEvent = "pendaftaran" | "berkas" | "essay" | "kontribusi";

export async function notifyWa(event: WaEvent, code: string) {
  const { data, error } = await supabase.functions.invoke("wa-notify", {
    body: { event, code },
  });
  if (error) throw error;
  return data;
}

export async function notifyEmail(event: EmailEvent, code: string) {
  const { data, error } = await supabase.functions.invoke("email-notify", {
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
  return data as { ok: boolean; url?: string; alreadyPaid?: boolean; synced?: boolean; reused?: boolean; error?: string };
}

export async function mayarCreateInvoice(code: string, force = false, syncOnly = false) {
  const { data, error } = await supabase.functions.invoke("mayar-create-invoice", {
    body: { code, force, syncOnly },
  });
  if (error) throw error;
  return data as { ok: boolean; url?: string; alreadyPaid?: boolean; reused?: boolean; synced?: boolean; error?: string };
}

export async function mpwaProxy(endpoint: "generate-qr" | "send-message" | "delete-device", payload: Record<string, unknown>) {
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
