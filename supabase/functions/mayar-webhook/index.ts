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
  addCandidate(values, data?.paymentLinkId);
  addCandidate(values, data?.payment_link_id);
  addCandidate(values, data?.paymentLink?.id);
  addCandidate(values, data?.productId);
  addCandidate(values, data?.product_id);
  addCandidate(values, payload?.invoiceId);
  addCandidate(values, payload?.invoice_id);
  addCandidate(values, payload?.invoice?.id);
  addCandidate(values, payload?.invoice?.invoiceId);
  addCandidate(values, payload?.invoice?.invoice_id);
  addCandidate(values, payload?.transaction?.invoiceId);
  addCandidate(values, payload?.transaction?.invoice_id);
  addCandidate(values, payload?.paymentLinkId);
  addCandidate(values, payload?.payment_link_id);
  addCandidate(values, payload?.paymentLink?.id);
  addCandidate(values, payload?.productId);
  addCandidate(values, payload?.product_id);
  addCandidate(values, data?.extraData?.invoiceId);
  addCandidate(values, data?.extraData?.payment_invoice_id);
  addCandidate(values, data?.extraData?.donation_invoice_id);
  addCandidate(values, payload?.extraData?.invoiceId);
  addCandidate(values, payload?.extraData?.payment_invoice_id);
  addCandidate(values, payload?.extraData?.donation_invoice_id);
  addCandidate(values, data?.transactionId);
  addCandidate(values, data?.transaction_id);
  addCandidate(values, data?.transaction?.id);
  addCandidate(values, payload?.transactionId);
  addCandidate(values, payload?.transaction_id);
  addCandidate(values, payload?.transaction?.id);
  addCandidate(values, payload?.paymentLinkTransactionId);
  addCandidate(values, payload?.payment_link_transaction_id);
  addCandidate(values, data?.id);
  addCandidate(values, payload?.id);

  return values;
}

function collectCodeCandidates(payload: any, data: any): string[] {
  const values: string[] = [];
  addCandidate(values, data?.extraData?.registration_code);
  addCandidate(values, data?.extraData?.registrationCode);
  addCandidate(values, data?.extraData?.code);
  addCandidate(values, data?.extraData?.noCustomer);
  addCandidate(values, data?.metadata?.registration_code);
  addCandidate(values, data?.metadata?.registrationCode);
  addCandidate(values, data?.metadata?.code);
  addCandidate(values, payload?.extraData?.registration_code);
  addCandidate(values, payload?.extraData?.registrationCode);
  addCandidate(values, payload?.extraData?.code);
  addCandidate(values, payload?.extraData?.noCustomer);
  addCandidate(values, payload?.metadata?.registration_code);
  addCandidate(values, payload?.metadata?.registrationCode);
  addCandidate(values, payload?.metadata?.code);
  addCandidate(values, data?.registration_code);
  addCandidate(values, data?.registrationCode);
  addCandidate(values, data?.code);
  addCandidate(values, payload?.registration_code);
  addCandidate(values, payload?.registrationCode);
  addCandidate(values, payload?.code);
  return values.filter((value) => /^HXP-/i.test(value));
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
    // Webhook secret WAJIB dikonfigurasi. Tanpa secret, siapa pun bisa
    // memalsukan payload "paid" dan menandai peserta lunas. Tolak request
    // kalau secret atau signature belum ada.
    if (!secret) {
      console.error("Mayar webhook: mayar_webhook_secret belum diisi");
      return json(
        { ok: false, error: "Webhook secret not configured" },
        { status: 503 },
      );
    }
    if (!signature) {
      console.error("Mayar webhook: signature header tidak ada");
      return json({ ok: false, error: "Missing signature" }, { status: 401 });
    }
    const signatureValid = verify(rawBody, signature, secret);
    if (!signatureValid) {
      console.error("Mayar webhook: invalid signature");
      return json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }


    const payload: any = JSON.parse(rawBody || "{}");
    let embeddedPayload: any = null;
    if (typeof payload?.payload === "string") {
      try {
        embeddedPayload = JSON.parse(payload.payload);
      } catch {
        embeddedPayload = null;
      }
    }
    const sourcePayload = embeddedPayload ?? payload;
    const event: string | undefined = sourcePayload?.event || payload?.event || payload?.type || payload?.eventType;
    const data = sourcePayload?.data ?? payload?.data ?? (typeof payload?.payload === "object" ? payload.payload : undefined) ?? payload;
    const invoiceCandidates = collectInvoiceCandidates(sourcePayload, data);
    const codeCandidates = collectCodeCandidates(sourcePayload, data);
    const status: string | undefined =
      data?.transactionStatus ||
      data?.transaction_status ||
      data?.status ||
      data?.transaction?.status ||
      data?.invoice?.status ||
      payload?.transactionStatus ||
      payload?.transaction_status ||
      payload?.status;
    if (invoiceCandidates.length === 0 && codeCandidates.length === 0) {
      console.error("Mayar webhook: invoice id tidak ditemukan", { event, status });
      return json({ ok: false, error: "Missing invoice id" }, { status: 400 });
    }

    const paidLike =
      (status && /paid|success|settled|completed|capture|SUCCESS/i.test(status)) ||
      (event && /payment\.(received|success|paid)|invoice\.paid|transaction\.(paid|success)/i.test(event));
    if (!paidLike) {
      console.log("Mayar webhook: event diabaikan", { event, status, invoiceCandidates, codeCandidates });
      return json({ ok: true, ignored: true });
    }

    let updatedReg = false;
    let updatedDonation = false;
    let matchedInvoiceId = invoiceCandidates[0];
    let matchedCode: string | null = null;

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

    if (!updatedReg && !updatedDonation && signatureValid) {
      const paymentType = String(
        data?.extraData?.payment_type ||
          data?.extraData?.paymentType ||
          payload?.extraData?.payment_type ||
          payload?.extraData?.paymentType ||
          "",
      ).toLowerCase();

      for (const code of codeCandidates) {
        const { data: participant } = await supabaseAdmin
          .from("participants")
          .select("registration_code, category")
          .ilike("registration_code", code)
          .maybeSingle();
        if (!participant?.registration_code) continue;

        if (paymentType === "donation") {
          const { data: rows } = await supabaseAdmin
            .from("participants")
            .update({ donation_status: "paid", donation_paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .ilike("registration_code", code)
            .select("registration_code");
          if (rows?.length) {
            updatedDonation = true;
            matchedCode = participant.registration_code;
            break;
          }
        } else {
          const { data: rows } = await supabaseAdmin
            .from("participants")
            .update({
              payment_status: "paid",
              paid_at: new Date().toISOString(),
              status: "accepted",
              updated_at: new Date().toISOString(),
            })
            .ilike("registration_code", code)
            .in("category", ["gelombang_1", "gelombang_2", "self_funded"])
            .select("registration_code");
          if (rows?.length) {
            updatedReg = true;
            matchedCode = participant.registration_code;
            break;
          }
        }
      }
    } else if (!updatedReg && !updatedDonation && codeCandidates.length > 0) {
      console.warn("Mayar webhook: fallback kode dilewati karena signature belum terverifikasi", { codeCandidates });
    }

    if (!updatedReg && !updatedDonation) {
      console.warn("Mayar webhook: invoice/kode tidak cocok dengan peserta manapun", { invoiceCandidates, codeCandidates });
    } else {
      console.log("Mayar webhook: pembayaran dikonfirmasi", {
        invoiceId: matchedInvoiceId,
        code: matchedCode,
        type: updatedReg ? "registration" : "donation",
      });
    }

    if (updatedReg) {
      try {
        const { data: p } = await supabaseAdmin
          .from("participants")
          .select("registration_code, category")
          .or(matchedCode ? `payment_invoice_id.eq.${matchedInvoiceId},registration_code.eq.${matchedCode}` : `payment_invoice_id.eq.${matchedInvoiceId}`)
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
          .or(matchedCode ? `donation_invoice_id.eq.${matchedInvoiceId},registration_code.eq.${matchedCode}` : `donation_invoice_id.eq.${matchedInvoiceId}`)
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
