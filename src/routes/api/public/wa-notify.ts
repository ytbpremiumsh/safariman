import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Auto-kirim notifikasi WA setelah event peserta (pendaftaran / berkas).
// Body: { event: "pendaftaran" | "berkas", code: string }
// Server akan: ambil settings MPWA + template dari app_settings, lookup peserta by kode,
// lalu kirim WA via MPWA. Tidak bocorin kredensial ke browser.

type Event = "pendaftaran" | "berkas";
const TPL_KEY: Record<Event, string> = {
  pendaftaran: "wa_template_pendaftaran",
  berkas: "wa_template_berkas",
};

const KATEGORI_LABEL: Record<string, string> = {
  fully_funded: "Reguler (Fully Funded)",
  self_funded: "Self Funded",
  partial_funded: "Partial Funded",
};

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

export const Route = createFileRoute("/api/public/wa-notify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { event, code } = (await request.json()) as { event: Event; code: string };
          if (!event || !code || !TPL_KEY[event]) {
            return Response.json({ ok: false, error: "Bad request" }, { status: 400 });
          }

          const { data: settings } = await supabaseAdmin
            .from("app_settings")
            .select("key,value")
            .in("key", ["mpwa_api_key", "mpwa_sender", TPL_KEY[event]]);

          const cfg = Object.fromEntries((settings ?? []).map((r) => [r.key, r.value ?? ""])) as Record<string, string>;
          const apiKey = cfg.mpwa_api_key;
          const sender = cfg.mpwa_sender;
          const tpl = cfg[TPL_KEY[event]];
          if (!apiKey || !sender || !tpl) {
            return Response.json({ ok: false, error: "MPWA belum dikonfigurasi" }, { status: 200 });
          }

          const { data: p } = await supabaseAdmin
            .from("participants")
            .select("full_name, whatsapp, registration_code, category")
            .ilike("registration_code", code)
            .maybeSingle();
          if (!p) return Response.json({ ok: false, error: "Peserta tidak ditemukan" }, { status: 404 });

          const message = fill(tpl, {
            nama: p.full_name,
            kode: p.registration_code,
            kategori: KATEGORI_LABEL[p.category ?? ""] ?? (p.category ?? "-"),
            status: event === "pendaftaran" ? "Terdaftar" : "Berkas Lengkap",
          });

          const number = normalizeNumber(p.whatsapp);

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
          const text = await res.text();
          return Response.json({ ok: res.ok, status: res.status, response: text });
        } catch (e) {
          return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
        }
      },
    },
  },
});
