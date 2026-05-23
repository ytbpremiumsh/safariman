import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Membuat invoice donasi via Mayar untuk peserta yang lolos berkas administrasi.
// Body: { code: string }
// Response: { ok, url, invoiceId, status }

export const Route = createFileRoute("/api/public/mayar-create-invoice")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { code, force } = (await request.json()) as { code?: string; force?: boolean };
          if (!code || code.length < 4) {
            return Response.json({ ok: false, error: "Kode tidak valid" }, { status: 400 });
          }

          // Ambil settings Mayar (API key + nominal + deskripsi)
          const { data: settings } = await supabaseAdmin
            .from("app_settings")
            .select("key,value")
            .in("key", ["mayar_api_key", "mayar_donation_amount", "mayar_donation_description", "mayar_redirect_url"]);
          const cfg = Object.fromEntries((settings ?? []).map((r) => [r.key, r.value ?? ""])) as Record<string, string>;
          const apiKey = cfg.mayar_api_key;
          if (!apiKey) {
            return Response.json({ ok: false, error: "Pembayaran belum dikonfigurasi admin" }, { status: 503 });
          }
          const amount = Number(cfg.mayar_donation_amount || "150000");
          const description =
            cfg.mayar_donation_description ||
            "Kontribusi peserta untuk mendukung operasional program, kegiatan sosial, berbagi makanan, wakaf Al-Qur'an, dan keberlangsungan kegiatan Safar Iman.";
          const redirectUrl = cfg.mayar_redirect_url || `${new URL(request.url).origin}/donasi?code=${encodeURIComponent(code)}`;

          // Cari peserta
          const { data: p } = await supabaseAdmin
            .from("participants")
            .select("full_name, email, whatsapp, status, payment_status, payment_url, registration_code")
            .ilike("registration_code", code)
            .maybeSingle();
          if (!p) return Response.json({ ok: false, error: "Peserta tidak ditemukan" }, { status: 404 });
          if (p.status !== "accepted") {
            return Response.json({ ok: false, error: "Peserta belum dinyatakan lolos berkas administrasi" }, { status: 403 });
          }
          if (p.payment_status === "paid") {
            return Response.json({ ok: true, alreadyPaid: true });
          }
          // Reuse existing payment link kalau masih valid dan tidak di-force refresh
          if (!force && p.payment_url && p.payment_status === "pending") {
            return Response.json({ ok: true, url: p.payment_url, reused: true });
          }

          // Panggil Mayar
          const body = {
            name: p.full_name,
            email: p.email,
            mobile: p.whatsapp,
            redirectUrl,
            description,
            items: [
              {
                description,
                quantity: 1,
                rate: amount,
              },
            ],
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
            p_code: code,
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
