import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Webhook callback dari Mayar saat invoice dibayar.
// SECURITY: Verifikasi HMAC signature pada setiap request agar tidak ada
// attacker yang bisa POST payload palsu dan menandai peserta sebagai 'paid'.
// Konfigurasi MAYAR_WEBHOOK_SECRET di server secrets, dan set webhook secret
// yang sama di dashboard Mayar.

function verifyMayarSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  try {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    // Mayar bisa kirim format "sha256=<hex>" atau hanya hex
    const provided = signature.startsWith("sha256=") ? signature.slice(7) : signature;
    const expectedBuf = Buffer.from(expected, "hex");
    const providedBuf = Buffer.from(provided, "hex");
    if (expectedBuf.length !== providedBuf.length) return false;
    return timingSafeEqual(expectedBuf, providedBuf);
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/mayar-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { data: row } = await supabaseAdmin
            .from("app_settings")
            .select("value")
            .eq("key", "mayar_webhook_secret")
            .maybeSingle();
          const secret = (row?.value ?? "").trim();
          if (!secret) {
            console.error("mayar_webhook_secret belum diisi di dashboard admin");
            return Response.json({ ok: false, error: "Server misconfigured" }, { status: 500 });
          }

          const rawBody = await request.text();
          const signature =
            request.headers.get("x-mayar-signature") ||
            request.headers.get("x-signature") ||
            request.headers.get("mayar-signature");

          if (!verifyMayarSignature(rawBody, signature, secret)) {
            console.warn("Mayar webhook: invalid signature");
            return Response.json({ ok: false, error: "Invalid signature" }, { status: 401 });
          }

          const payload: any = JSON.parse(rawBody || "{}");
          const event: string | undefined = payload?.event || payload?.type;
          const data = payload?.data ?? payload;
          const invoiceId: string | undefined =
            data?.id || data?.transactionId || data?.invoiceId || data?.invoice_id;
          const status: string | undefined = data?.status || payload?.status;

          if (!invoiceId) {
            return Response.json({ ok: false, error: "Missing invoice id" }, { status: 400 });
          }

          const paidLike =
            (status && /paid|success|settled|completed/i.test(status)) ||
            (event && /payment\.(received|success|paid)|invoice\.paid/i.test(event));

          if (!paidLike) {
            return Response.json({ ok: true, ignored: true });
          }

          const { data: updated } = await supabaseAdmin.rpc("mark_payment_paid", {
            p_invoice_id: invoiceId,
          });

          return Response.json({ ok: true, updated });
        } catch (e) {
          console.error("Mayar webhook error", e);
          return Response.json({ ok: false, error: "Internal error" }, { status: 500 });
        }
      },
      GET: async () => Response.json({ ok: true, info: "Mayar webhook endpoint" }),
    },
  },
});
