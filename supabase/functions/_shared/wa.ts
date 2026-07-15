// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type WaEvent = "pendaftaran" | "berkas" | "essay";

const TPL_KEY: Record<WaEvent, string> = {
  pendaftaran: "wa_template_pendaftaran",
  berkas: "wa_template_berkas",
  essay: "wa_template_essay",
};
const TPL_KEY_SELF: Partial<Record<WaEvent, string>> = {
  pendaftaran: "wa_template_pendaftaran_self",
};

const KATEGORI_LABEL: Record<string, string> = {
  fully_funded: "Reguler (Fully Funded)",
  self_funded: "Self Funded",
  partial_funded: "Partial Funded",
  gelombang_1: "Fast Track Gelombang 1",
  gelombang_2: "Fast Track Gelombang 2",
};

function fill(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\\n/g, "\n").replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

function normalizeNumber(wa: string) {
  const digits = wa.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  return digits;
}

export function getAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export async function sendWaForEvent(event: WaEvent, code: string) {
  const supabaseAdmin = getAdmin();
  const { data: p } = await supabaseAdmin
    .from("participants")
    .select("full_name, whatsapp, registration_code, category")
    .ilike("registration_code", code)
    .maybeSingle();
  if (!p) return { ok: false, error: "Peserta tidak ditemukan" };

  const isSelf = p.category === "self_funded";
  const selfKey = TPL_KEY_SELF[event];
  const tplKey = isSelf && selfKey ? selfKey : TPL_KEY[event];

  const { data: settings } = await supabaseAdmin
    .from("app_settings")
    .select("key,value")
    .in("key", ["mpwa_api_key", "mpwa_sender", "wa_notif_enabled", tplKey, TPL_KEY[event]]);

  const cfg = Object.fromEntries(
    (settings ?? []).map((r: any) => [r.key, r.value ?? ""]),
  ) as Record<string, string>;
  // Notifikasi WA bisa dimatikan admin lewat toggle di dashboard.
  if ((cfg.wa_notif_enabled ?? "true") === "false") {
    return { ok: true, skipped: true, reason: "wa_notif_disabled" };
  }
  const apiKey = cfg.mpwa_api_key;
  const sender = cfg.mpwa_sender;
  const tpl = cfg[tplKey] || cfg[TPL_KEY[event]];
  if (!apiKey || !sender || !tpl) {
    return { ok: false, error: "MPWA belum dikonfigurasi" };
  }

  const message = fill(tpl, {
    nama: p.full_name,
    kode: p.registration_code,
    kategori: KATEGORI_LABEL[p.category ?? ""] ?? (p.category ?? "-"),
    status:
      event === "pendaftaran"
        ? "Terdaftar"
        : event === "berkas"
          ? "Berkas Lengkap"
          : "Essay Lengkap",
  });

  try {
    const res = await fetch("https://app.ayopintar.com/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        sender,
        number: normalizeNumber(p.whatsapp),
        message,
        footer: "Safar Iman",
      }),
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
