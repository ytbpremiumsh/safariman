import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Server function untuk auto-kirim notifikasi WA setelah pendaftaran/berkas.
// SECURITY: dipindah dari /api/public/wa-notify (route HTTP terbuka) ke
// createServerFn agar tidak bisa dipanggil/spam dari luar app.
// Browser memanggil via useServerFn; server tetap memvalidasi input ketat.

type Event = "pendaftaran" | "berkas" | "essay";
const TPL_KEY: Record<Event, string> = {
  pendaftaran: "wa_template_pendaftaran",
  berkas: "wa_template_berkas",
  essay: "wa_template_essay",
};

const KATEGORI_LABEL: Record<string, string> = {
  fully_funded: "Reguler (Fully Funded)",
  self_funded: "Self Funded",
  partial_funded: "Partial Funded",
};

const inputSchema = z.object({
  event: z.enum(["pendaftaran", "berkas", "essay"]),
  code: z
    .string()
    .trim()
    .min(4)
    .max(32)
    .regex(/^[A-Za-z0-9-]+$/, "kode tidak valid"),
});

function fill(tpl: string, vars: Record<string, string>) {
  return tpl
    .replace(/\\n/g, "\n")
    .replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

function normalizeNumber(wa: string) {
  const digits = wa.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  return digits;
}

export const notifyWaEvent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { event, code } = data;

    const { data: settings } = await supabaseAdmin
      .from("app_settings")
      .select("key,value")
      .in("key", ["mpwa_api_key", "mpwa_sender", TPL_KEY[event]]);

    const cfg = Object.fromEntries((settings ?? []).map((r) => [r.key, r.value ?? ""])) as Record<
      string,
      string
    >;
    const apiKey = cfg.mpwa_api_key;
    const sender = cfg.mpwa_sender;
    const tpl = cfg[TPL_KEY[event]];
    if (!apiKey || !sender || !tpl) {
      return { ok: false, error: "MPWA belum dikonfigurasi" };
    }

    const { data: p } = await supabaseAdmin
      .from("participants")
      .select("full_name, whatsapp, registration_code, category")
      .ilike("registration_code", code)
      .maybeSingle();
    if (!p) return { ok: false, error: "Peserta tidak ditemukan" };

    const message = fill(tpl, {
      nama: p.full_name,
      kode: p.registration_code,
      kategori: KATEGORI_LABEL[p.category ?? ""] ?? (p.category ?? "-"),
      status: event === "pendaftaran" ? "Terdaftar" : event === "berkas" ? "Berkas Lengkap" : "Essay Lengkap",
    });

    const number = normalizeNumber(p.whatsapp);

    try {
      const res = await fetch("https://app.ayopintar.com/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          sender,
          number,
          message,
          footer: "Safar Iman",
        }),
      });
      return { ok: res.ok, status: res.status };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  });
