import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Membuat invoice Mayar untuk biaya PENDAFTARAN jalur Gelombang 1 / 2.
// Body: { code: string }
// Response: { ok, url, invoiceId, alreadyPaid? }

type GelombangCfg = {
  name: string;
  start: string;
  end: string;
  price: number;
  enabled: boolean;
  description: string;
};

export const Route = createFileRoute("/api/public/mayar-pendaftaran-invoice")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { code } = (await request.json()) as { code?: string };
          if (!code || code.length < 4) {
            return Response.json({ ok: false, error: "Kode tidak valid" }, { status: 400 });
          }

          // Cari peserta
          const { data: p } = await supabaseAdmin
            .from("participants")
            .select("full_name, email, whatsapp, payment_status, payment_url, registration_code, category")
            .ilike("registration_code", code)
            .maybeSingle();
          if (!p) return Response.json({ ok: false, error: "Peserta tidak ditemukan" }, { status: 404 });

          if (p.category !== "gelombang_1" && p.category !== "gelombang_2") {
            return Response.json(
              { ok: false, error: "Kategori ini tidak memerlukan biaya pendaftaran" },
              { status: 400 },
            );
          }

          if (p.payment_status === "paid") {
            return Response.json({ ok: true, alreadyPaid: true });
          }

          // Ambil config gelombang & Mayar key
          const { data: settings } = await supabaseAdmin
            .from("app_settings")
            .select("key,value")
            .in("key", ["mayar_api_key", "gelombang_config"]);
          const cfg = Object.fromEntries((settings ?? []).map((r) => [r.key, r.value ?? ""])) as Record<string, string>;
          const apiKey = cfg.mayar_api_key;
          if (!apiKey) {
            return Response.json({ ok: false, error: "Pembayaran belum dikonfigurasi admin" }, { status: 503 });
          }

          let gelombangCfg: Record<string, GelombangCfg> = {};
          try {
            gelombangCfg = JSON.parse(cfg.gelombang_config || "{}");
          } catch {
            return Response.json({ ok: false, error: "Konfigurasi gelombang rusak" }, { status: 500 });
          }
          const slot = gelombangCfg[p.category];
          if (!slot) {
            return Response.json({ ok: false, error: "Gelombang belum dikonfigurasi" }, { status: 500 });
          }
          const amount = Number(slot.price || 0);
          if (!amount || amount < 1000) {
            return Response.json({ ok: false, error: "Nominal pendaftaran tidak valid" }, { status: 500 });
          }
          const description = `Biaya pendaftaran ${slot.name} — Safar Iman`;
          const origin = new URL(request.url).origin;
          const redirectUrl = `${origin}/pendaftaran-sukses?code=${encodeURIComponent(p.registration_code)}`;

          // Reuse jika sudah ada invoice pending
          if (p.payment_url && p.payment_status === "pending") {
            return Response.json({ ok: true, url: p.payment_url, reused: true });
          }

          const body = {
            name: p.full_name,
            email: p.email,
            mobile: p.whatsapp,
            redirectUrl,
            description,
            items: [{ description, quantity: 1, rate: amount }],
          };

          const res = await fetch("https://api.mayar.id/hl/v1/invoice/create", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
          });
          const json: any = await res.json().catch(() => ({}));
          if (!res.ok || json?.statusCode >= 400) {
            return Response.json(
              { ok: false, error: json?.messages || json?.message || "Gagal membuat invoice", raw: json },
              { status: 502 },
            );
          }
          const url: string | undefined = json?.data?.link || json?.data?.url || json?.link;
          const invoiceId: string | undefined = json?.data?.id || json?.data?.transactionId || json?.id;
          if (!url || !invoiceId) {
            return Response.json({ ok: false, error: "Respon Mayar tidak lengkap", raw: json }, { status: 502 });
          }

          await supabaseAdmin.rpc("save_payment_invoice", {
            p_code: p.registration_code,
            p_invoice_id: invoiceId,
            p_url: url,
          });

          return Response.json({ ok: true, url, invoiceId });
        } catch (e) {
          return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
        }
      },
    },
  },
});
