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

function parseWebhookPayload(rawBody: string) {
  let payload: any = {};
  try {
    payload = JSON.parse(rawBody || "{}");
  } catch {
    payload = {};
  }

  let embeddedPayload: any = null;
  if (typeof payload?.payload === "string") {
    try {
      embeddedPayload = JSON.parse(payload.payload);
    } catch {
      embeddedPayload = null;
    }
  }

  const sourcePayload = embeddedPayload ?? payload;
  const data = sourcePayload?.data ?? payload?.data ?? (typeof payload?.payload === "object" ? payload.payload : undefined) ?? payload;
  const event: string | undefined =
    sourcePayload?.event ||
    sourcePayload?.type ||
    sourcePayload?.eventType ||
    sourcePayload?.event_type ||
    data?.event ||
    data?.type ||
    data?.eventType ||
    data?.event_type ||
    payload?.event ||
    payload?.type ||
    payload?.eventType ||
    payload?.event_type;
  const status: string | undefined =
    data?.transactionStatus ||
    data?.transaction_status ||
    data?.status ||
    data?.transaction?.status ||
    data?.invoice?.status ||
    payload?.transactionStatus ||
    payload?.transaction_status ||
    payload?.status;
  const label = String(
    event ||
      data?.name ||
      data?.title ||
      data?.notificationType ||
      data?.notification_type ||
      payload?.name ||
      payload?.title ||
      "",
  ).toLowerCase();

  return { payload, sourcePayload, data, event, status, label };
}

function isPaidStatus(status: string | undefined): boolean {
  const normalizedStatus = (status || "").trim().toLowerCase();
  return (
    !!normalizedStatus &&
    !/^un/.test(normalizedStatus) &&
    !/pending|fail|expire|cancel|refund|void|await|process/.test(normalizedStatus) &&
    /\b(paid|success|successful|settled|completed|capture|captured)\b/.test(normalizedStatus)
  );
}

function isPaidEvent(event: string | undefined, label: string): boolean {
  return /payment\.(received|success|paid)|invoice\.paid|transaction\.(paid|success)|\b(paid|success|successful|settled|completed|capture|captured)\b/i.test(
    `${event ?? ""} ${label}`,
  );
}

function isNonPaymentEvent(event: string | undefined, status: string | undefined, label: string): boolean {
  const eventLabel = `${event ?? ""} ${label}`.toLowerCase();
  // Event yang jelas menandakan pembayaran diterima (mis. payment.received /
  // invoice.paid) TIDAK boleh dianggap non-payment walau field `status` masih
  // "created" — Mayar memakai "created" untuk transaksi baru yang sukses.
  if (isPaidEvent(event, label)) return false;
  const haystack = `${eventLabel} ${status ?? ""}`;
  return /pengingat|reminder|remind|pending|created|create|unpaid|expired|expire|cancel|failed|refund|void/.test(haystack);
}

function invoiceLooksPaid(payload: any): boolean {
  const data = payload?.data ?? payload;
  if (
    isPaidStatus(data?.status) ||
    isPaidStatus(data?.transactionStatus) ||
    isPaidStatus(data?.transaction_status) ||
    isPaidStatus(data?.invoice?.status) ||
    isPaidStatus(data?.payment?.status)
  ) {
    return true;
  }
  const transactions = Array.isArray(data?.transactions) ? data.transactions : [];
  return transactions.some((tx: any) => isPaidStatus(tx?.status) || isPaidStatus(tx?.transactionStatus) || isPaidStatus(tx?.transaction_status));
}

async function verifyPaidWithMayar(apiKey: string, invoiceCandidates: string[], codeCandidates: string[]) {
  if (!apiKey) return { verified: false, invoiceId: null as string | null, code: null as string | null, paymentType: "" };

  for (const invoiceId of invoiceCandidates) {
    try {
      const res = await fetch(`https://api.mayar.id/hl/v1/invoice/${encodeURIComponent(invoiceId)}`, {
        method: "GET",
        headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` },
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && invoiceLooksPaid(payload)) {
        const data = payload?.data ?? payload;
        const tx = Array.isArray(data?.transactions) ? data.transactions.find((item: any) => invoiceLooksPaid(item)) ?? data.transactions[0] : null;
        const extra = tx?.extraData ?? data?.extraData ?? data?.metadata ?? {};
        const code = String(extra?.registration_code || extra?.registrationCode || extra?.code || codeCandidates[0] || "").trim();
        const paymentType = String(extra?.payment_type || extra?.paymentType || "").toLowerCase();
        return { verified: true, invoiceId, code: /^HXP-/i.test(code) ? code : null, paymentType };
      }
    } catch (e) {
      console.warn("Mayar webhook: gagal verifikasi invoice ke Mayar", { invoiceId, error: (e as Error).message });
    }
  }

  try {
    const res = await fetch("https://api.mayar.id/hl/v1/transactions?page=1&pageSize=50", {
      method: "GET",
      headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` },
    });
    const payload = await res.json().catch(() => ({}));
    const list: any[] = Array.isArray(payload?.data) ? payload.data : [];
    const paidTx = list.find((tx) => {
      const txInvoiceId = String(tx?.paymentLinkId || tx?.payment_link_id || "").trim();
      const txId = String(tx?.paymentLinkTransactionId || tx?.payment_link_transaction_id || tx?.transactionId || tx?.id || "").trim();
      const txCode = String(tx?.extraData?.registration_code || tx?.extraData?.registrationCode || tx?.extraData?.code || "").trim();
      return (
        (invoiceCandidates.includes(txInvoiceId) || invoiceCandidates.includes(txId) || codeCandidates.includes(txCode)) &&
        (isPaidStatus(tx?.status) || isPaidStatus(tx?.transactionStatus) || isPaidStatus(tx?.transaction_status))
      );
    });
    if (res.ok && paidTx) {
      const invoiceId = String(paidTx?.paymentLinkId || paidTx?.payment_link_id || invoiceCandidates[0] || "").trim();
      const extra = paidTx?.extraData ?? {};
      const code = String(extra?.registration_code || extra?.registrationCode || extra?.code || codeCandidates[0] || "").trim();
      const paymentType = String(extra?.payment_type || extra?.paymentType || "").toLowerCase();
      return { verified: true, invoiceId: invoiceId || null, code: /^HXP-/i.test(code) ? code : null, paymentType };
    }
  } catch (e) {
    console.warn("Mayar webhook: gagal verifikasi transaksi ke Mayar", { error: (e as Error).message });
  }

  return { verified: false, invoiceId: null as string | null, code: null as string | null, paymentType: "" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method === "GET") return json({ ok: true, info: "Mayar webhook endpoint" });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, { status: 405 });
  try {
    const supabaseAdmin = getAdmin();
    const rawBody = await req.text();
    const signature =
      req.headers.get("x-mayar-signature") ||
      req.headers.get("x-signature") ||
      req.headers.get("mayar-signature") ||
      req.headers.get("x-hub-signature-256");

    const { payload, sourcePayload, data, event, status, label } = parseWebhookPayload(rawBody);
    const invoiceCandidates = collectInvoiceCandidates(sourcePayload, data);
    const codeCandidates = collectCodeCandidates(sourcePayload, data);
    const paidLike = isPaidStatus(status) || isPaidEvent(event, label);

    // Deteksi request TEST/PING dari dashboard Mayar (tombol "Testing URL").
    // Mayar mengirim payload kosong / event bertipe test tanpa signature.
    // Balas 200 supaya URL webhook diterima Mayar, tanpa proses apa pun.
    const looksLikeTest =
      !rawBody ||
      rawBody.trim() === "" ||
      rawBody.trim() === "{}" ||
      /test|ping|verify|verification/.test(label);
    if (looksLikeTest) {
      console.log("Mayar webhook: test/ping request, balas 200", { event, hasSignature: !!signature });
      return json({ ok: true, test: true, message: "Webhook endpoint is reachable" });
    }

    // Event non-pembayaran (mis. "Pengingat Pembayaran" / reminder) SELALU
    // dibalas 200, bahkan ketika secret belum diisi, supaya Mayar tidak retry
    // dan tidak menandai delivery FAILED.
    if (!paidLike || isNonPaymentEvent(event, status, label)) {
      console.log("Mayar webhook: non-payment event ignored", { event, status, label });
      return json({ ok: true, ignored: true, reason: "non_payment_event", event: event ?? null });
    }

    const { data: settings } = await supabaseAdmin
      .from("app_settings")
      .select("key,value")
      .in("key", ["mayar_webhook_secret", "mayar_api_key"]);
    const cfg = Object.fromEntries((settings ?? []).map((r: any) => [r.key, r.value ?? ""])) as Record<string, string>;
    const secret = (cfg.mayar_webhook_secret ?? "").trim();
    const apiKey = (cfg.mayar_api_key ?? "").trim();

    const signatureValid = !!secret && !!signature && verify(rawBody, signature, secret);
    let mayarVerified = { verified: false, invoiceId: null as string | null, code: null as string | null, paymentType: "" };

    // Bila secret belum tersimpan / signature tidak dikirim Mayar, jangan langsung
    // gagal: verifikasi balik ke API Mayar memakai API key admin sebelum update data.
    if (!signatureValid) {
      mayarVerified = await verifyPaidWithMayar(apiKey, invoiceCandidates, codeCandidates);
    }

    if (!signatureValid && !mayarVerified.verified) {
      // Bukan error fatal: Mayar tidak menyediakan webhook secret, jadi kita hanya
      // melewati event yang belum bisa diverifikasi via API. Selalu balas 200.
      console.warn("Mayar webhook: event paid belum terverifikasi (tanpa signature & gagal cek API)", { event, status });
      return json(
        { ok: true, ignored: true, reason: "paid_event_unverified", message: "Pembayaran belum terverifikasi dari Mayar" },
      );
    }

    if (mayarVerified.verified) {
      addCandidate(invoiceCandidates, mayarVerified.invoiceId);
      addCandidate(codeCandidates, mayarVerified.code);
    }

    // Log setiap request masuk supaya delivery Mayar bisa ditelusuri.
    console.log("Mayar webhook: incoming", { event, status, paidLike, signatureValid, mayarVerified: mayarVerified.verified, invoiceCandidates, codeCandidates });

    // Baru setelah event dipastikan paid-like, kita butuh invoice/kode.
    if (invoiceCandidates.length === 0 && codeCandidates.length === 0) {
      console.error("Mayar webhook: paid event tapi invoice id tidak ditemukan", { event, status });
      return json({ ok: true, ignored: true, reason: "missing_invoice_id" });
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

    if (!updatedReg && !updatedDonation && (signatureValid || mayarVerified.verified)) {
      const paymentType = String(
        data?.extraData?.payment_type ||
          data?.extraData?.paymentType ||
          payload?.extraData?.payment_type ||
          payload?.extraData?.paymentType ||
          mayarVerified.paymentType ||
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
