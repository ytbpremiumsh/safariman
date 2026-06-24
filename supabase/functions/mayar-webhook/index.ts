// deno-lint-ignore-file no-explicit-any
import { createHmac, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";
import { corsHeaders, json } from "../_shared/cors.ts";
import { getAdmin } from "../_shared/wa.ts";
import { sendWaForEvent } from "../_shared/wa.ts";
import { sendEmailForEvent } from "../_shared/email.ts";

function verify(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  try {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const provided = signature.startsWith("sha256=") ? signature.slice(7) : signature;
    const exp = Buffer.from(expected, "hex");
    const prov = Buffer.from(provided, "hex");
    if (exp.length !== prov.length) return false;
    return timingSafeEqual(exp, prov);
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method === "GET") return json({ ok: true, info: "Mayar webhook endpoint" });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, { status: 405 });
  try {
    const supabaseAdmin = getAdmin();
    const { data: row } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "mayar_webhook_secret")
      .maybeSingle();
    const secret = (row?.value ?? "").trim();

    const rawBody = await req.text();
    const signature =
      req.headers.get("x-mayar-signature") ||
      req.headers.get("x-signature") ||
      req.headers.get("mayar-signature") ||
      req.headers.get("x-hub-signature-256");

    // Verifikasi signature kalau secret dikonfigurasi & header dikirim.
    // Kalau salah satu tidak ada, tetap proses (biar pembayaran tidak macet
    // gara-gara konfigurasi). Status & invoice id tetap divalidasi di bawah.
    if (secret && signature && !verify(rawBody, signature, secret)) {
      console.error("Mayar webhook: invalid signature");
      return json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }
    if (!secret) console.warn("Mayar webhook: secret belum diisi, signature dilewati");
    if (secret && !signature) console.warn("Mayar webhook: signature header tidak ada, dilewati");

    const payload: any = JSON.parse(rawBody || "{}");
    const event: string | undefined = payload?.event || payload?.type || payload?.eventType;
    const data = payload?.data ?? payload?.payload ?? payload;
    const invoiceId: string | undefined =
      data?.id ||
      data?.transactionId ||
      data?.invoiceId ||
      data?.invoice_id ||
      data?.transaction?.id ||
      data?.invoice?.id ||
      payload?.transactionId ||
      payload?.invoiceId;
    const status: string | undefined =
      data?.status || data?.transaction?.status || data?.invoice?.status || payload?.status;
    if (!invoiceId) {
      console.error("Mayar webhook: invoice id tidak ditemukan", { event, status });
      return json({ ok: false, error: "Missing invoice id" }, { status: 400 });
    }

    const paidLike =
      (status && /paid|success|settled|completed|capture|SUCCESS/i.test(status)) ||
      (event && /payment\.(received|success|paid)|invoice\.paid|transaction\.(paid|success)/i.test(event));
    if (!paidLike) {
      console.log("Mayar webhook: event diabaikan", { event, status, invoiceId });
      return json({ ok: true, ignored: true });
    }


    const { data: updatedReg } = await supabaseAdmin.rpc("mark_payment_paid", { p_invoice_id: invoiceId });
    let updatedDonation = false;
    if (!updatedReg) {
      const { data: ud } = await supabaseAdmin.rpc("mark_donation_paid", { p_invoice_id: invoiceId });
      updatedDonation = !!ud;
    }

    if (updatedReg) {
      try {
        const { data: p } = await supabaseAdmin
          .from("participants")
          .select("registration_code, category")
          .eq("payment_invoice_id", invoiceId)
          .maybeSingle();
        if (p?.registration_code) {
          if (p.category === "gelombang_1" || p.category === "gelombang_2") {
            await sendWaForEvent("pendaftaran", p.registration_code);
          }
          await sendEmailForEvent("pendaftaran", p.registration_code);
        }
      } catch (e) {
        console.error("Gagal kirim notif registrasi", e);
      }
    }

    if (updatedDonation) {
      try {
        const { data: p } = await supabaseAdmin
          .from("participants")
          .select("registration_code")
          .eq("donation_invoice_id", invoiceId)
          .maybeSingle();
        if (p?.registration_code) {
          await sendEmailForEvent("kontribusi", p.registration_code);
        }
      } catch (e) {
        console.error("Gagal kirim email kontribusi", e);
      }
    }

    return json({
      ok: true,
      updated: updatedReg || updatedDonation,
      type: updatedReg ? "registration" : updatedDonation ? "donation" : "none",
    });
  } catch (e) {
    console.error("Mayar webhook error", e);
    return json({ ok: false, error: "Internal error" }, { status: 500 });
  }
});
