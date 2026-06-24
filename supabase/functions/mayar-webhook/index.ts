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

function addCandidate(values: string[], value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return;
  const normalized = String(value).trim();
  if (normalized && !values.includes(normalized)) values.push(normalized);
}

function collectInvoiceCandidates(payload: any, data: any): string[] {
  const values: string[] = [];

  // Mayar webhook payloads can include a payment/transaction id in `data.id`
  // while the invoice id created by our invoice endpoint is sent in another field.
  // Try invoice-specific fields first, then broader transaction ids as fallback.
  addCandidate(values, data?.invoiceId);
  addCandidate(values, data?.invoice_id);
  addCandidate(values, data?.invoice?.id);
  addCandidate(values, data?.invoice?.invoiceId);
  addCandidate(values, data?.invoice?.invoice_id);
  addCandidate(values, data?.transaction?.invoiceId);
  addCandidate(values, data?.transaction?.invoice_id);
  addCandidate(values, payload?.invoiceId);
  addCandidate(values, payload?.invoice_id);
  addCandidate(values, payload?.invoice?.id);
  addCandidate(values, payload?.invoice?.invoiceId);
  addCandidate(values, payload?.invoice?.invoice_id);
  addCandidate(values, payload?.transaction?.invoiceId);
  addCandidate(values, payload?.transaction?.invoice_id);
  addCandidate(values, data?.transactionId);
  addCandidate(values, data?.transaction_id);
  addCandidate(values, data?.transaction?.id);
  addCandidate(values, payload?.transactionId);
  addCandidate(values, payload?.transaction_id);
  addCandidate(values, payload?.transaction?.id);
  addCandidate(values, data?.id);
  addCandidate(values, payload?.id);

  return values;
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
    const invoiceCandidates = collectInvoiceCandidates(payload, data);
    const status: string | undefined =
      data?.status || data?.transaction?.status || data?.invoice?.status || payload?.status;
    if (invoiceCandidates.length === 0) {
      console.error("Mayar webhook: invoice id tidak ditemukan", { event, status });
      return json({ ok: false, error: "Missing invoice id" }, { status: 400 });
    }

    const paidLike =
      (status && /paid|success|settled|completed|capture|SUCCESS/i.test(status)) ||
      (event && /payment\.(received|success|paid)|invoice\.paid|transaction\.(paid|success)/i.test(event));
    if (!paidLike) {
      console.log("Mayar webhook: event diabaikan", { event, status, invoiceCandidates });
      return json({ ok: true, ignored: true });
    }

    let updatedReg = false;
    let updatedDonation = false;
    let matchedInvoiceId = invoiceCandidates[0];

    for (const candidate of invoiceCandidates) {
      const { data: ur } = await supabaseAdmin.rpc("mark_payment_paid", { p_invoice_id: candidate });
      if (ur) {
        updatedReg = true;
        matchedInvoiceId = candidate;
        break;
      }
    }

    if (!updatedReg) {
      for (const candidate of invoiceCandidates) {
        const { data: ud } = await supabaseAdmin.rpc("mark_donation_paid", { p_invoice_id: candidate });
        if (ud) {
          updatedDonation = true;
          matchedInvoiceId = candidate;
          break;
        }
      }
    }

    if (!updatedReg && !updatedDonation) {
      console.warn("Mayar webhook: invoice tidak cocok dengan peserta manapun", { invoiceCandidates });
    } else {
      console.log("Mayar webhook: pembayaran dikonfirmasi", {
        invoiceId: matchedInvoiceId,
        type: updatedReg ? "registration" : "donation",
      });
    }

    if (updatedReg) {
      try {
        const { data: p } = await supabaseAdmin
          .from("participants")
          .select("registration_code, category")
          .eq("payment_invoice_id", matchedInvoiceId)
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
          .eq("donation_invoice_id", matchedInvoiceId)
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
