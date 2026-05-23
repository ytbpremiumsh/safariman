import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Webhook callback dari Mayar saat invoice dibayar.
// Mayar akan POST event seperti { event: "payment.received", data: { id, status, ... } }
// Kita tandai peserta sebagai 'paid' berdasarkan invoice id.

export const Route = createFileRoute("/api/public/mayar-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const payload: any = await request.json().catch(() => ({}));
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
          return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
        }
      },
      GET: async () => Response.json({ ok: true, info: "Mayar webhook endpoint" }),
    },
  },
});
