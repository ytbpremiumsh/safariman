// deno-lint-ignore-file no-explicit-any
import { corsHeaders, json } from "../_shared/cors.ts";
import { getAdmin } from "../_shared/wa.ts";
import { resolveMayarEmail, upsertMayarCustomer } from "../_shared/mayar-customer.ts";
import {
  cachedInvoiceStillValid,
  fallbackExpiry,
  invoiceLooksExpired,
  parseInvoiceExpiry,
} from "../_shared/mayar-invoice.ts";


function isPaidLike(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const v = value.trim().toLowerCase();
  if (!v) return false;
  // Hindari false positive: "unpaid" mengandung substring "paid".
  if (/^un/.test(v) || /pending|fail|expire|cancel|refund|void|await|process/.test(v)) return false;
  return /\b(paid|success|successful|settled|completed|capture|captured|success_paid)\b/.test(v);
}

function invoiceLooksPaid(payload: any): boolean {
  const data = payload?.data ?? payload;
  const statusPaid =
    isPaidLike(data?.status) ||
    isPaidLike(data?.transactionStatus) ||
    isPaidLike(data?.transaction_status) ||
    isPaidLike(data?.invoice?.status) ||
    isPaidLike(data?.payment?.status);
  const transactions = Array.isArray(data?.transactions) ? data.transactions : [];
  const txPaid = transactions.some((tx: any) =>
    isPaidLike(tx?.status) || isPaidLike(tx?.transactionStatus) || isPaidLike(tx?.transaction_status)
  );
  // Mayar's invoice detail endpoint kadang mengembalikan status "paid"
  // meski peserta hanya membuka halaman pembayaran tanpa menyelesaikan
  // transaksi. Untuk memastikan pembayaran benar-benar sukses, wajibkan
  // bukti transaksi nyata: minimal ada satu transaksi dengan extraData
  // yang ter-isi (menandakan payment method dipilih & transaksi selesai)
  // ATAU salah satu transaksi status-nya paid/settled secara eksplisit.
  const hasRealTx = transactions.some((tx: any) => {
    const extra = tx?.extraData;
    if (!extra) return false;
    if (typeof extra === "object" && Object.keys(extra).length === 0) return false;
    return true;
  });
  if (txPaid) return true;
  return statusPaid && hasRealTx;
}

async function verifyPaidViaTransactions(
  apiKey: string,
  invoiceId: string,
  transactionIds: string[],
): Promise<boolean> {
  // Cross-verify: cari di list transaksi apakah paymentLinkId == invoiceId
  // dengan status paid/settled. Jika tidak ketemu → JANGAN tandai paid.
  try {
    const res = await fetch("https://api.mayar.id/hl/v1/transactions?page=1&pageSize=50", {
      method: "GET",
      headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return false;
    const payload = await res.json().catch(() => ({}));
    const list: any[] = Array.isArray(payload?.data) ? payload.data : [];
    return list.some((tx) => {
      if (tx?.paymentLinkId !== invoiceId) return false;
      if (transactionIds.length > 0 && !transactionIds.includes(tx?.paymentLinkTransactionId)) return false;
      return isPaidLike(tx?.status);
    });
  } catch (e) {
    console.warn("verifyPaidViaTransactions error", e);
    return false;
  }
}




async function fetchDonationInvoiceState(
  apiKey: string,
  invoiceId?: string | null,
): Promise<{ state: "paid" | "expired" | "active" | "unknown"; payload?: any }> {
  if (!invoiceId) return { state: "unknown" };
  try {
    const res = await fetch(`https://api.mayar.id/hl/v1/invoice/${encodeURIComponent(invoiceId)}`, {
      method: "GET",
      headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` },
    });
    const payload = await res.json().catch(() => ({}));
    if (res.status === 404) return { state: "expired", payload };
    if (!res.ok) return { state: "unknown", payload };
    if (invoiceLooksPaid(payload)) return { state: "paid", payload };
    if (invoiceLooksExpired(payload)) return { state: "expired", payload };
    return { state: "active", payload };
  } catch (e) {
    console.warn("fetchDonationInvoiceState error", e);
    return { state: "unknown" };
  }
}

async function syncDonationStatus(supabaseAdmin: any, apiKey: string, invoiceId?: string | null) {
  const { state, payload } = await fetchDonationInvoiceState(apiKey, invoiceId);
  if (state !== "paid" || !invoiceId) return false;
  const data = payload?.data ?? payload;
  const txIds = Array.isArray(data?.transactions)
    ? data.transactions.map((t: any) => t?.id).filter(Boolean)
    : [];
  if (data?.transactionId) txIds.push(data.transactionId);
  const verified = await verifyPaidViaTransactions(apiKey, invoiceId, txIds);
  if (!verified) return false;
  const { data: updated } = await supabaseAdmin.rpc("mark_donation_paid", { p_invoice_id: invoiceId });
  return Boolean(updated);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, { status: 405 });
  try {
    const supabaseAdmin = getAdmin();
    const { code, syncOnly } = (await req.json()) as { code?: string; force?: boolean; syncOnly?: boolean };
    if (!code || code.length < 4) return json({ ok: false, error: "Kode tidak valid" }, { status: 400 });

    const { data: settings } = await supabaseAdmin
      .from("app_settings")
      .select("key,value")
      .in("key", ["mayar_api_key", "mayar_donation_amount", "mayar_donation_description", "mayar_redirect_url"]);
    const cfg = Object.fromEntries((settings ?? []).map((r: any) => [r.key, r.value ?? ""])) as Record<string, string>;
    const apiKey = cfg.mayar_api_key;
    if (!apiKey) return json({ ok: false, error: "Pembayaran belum dikonfigurasi admin" }, { status: 503 });

    const amount = Number(cfg.mayar_donation_amount || "150000");

    const { data: p } = await supabaseAdmin
      .from("participants")
      .select(
        "full_name, email, whatsapp, status, donation_status, donation_url, donation_invoice_id, donation_invoice_expires_at, registration_code, category",
      )
      .ilike("registration_code", code)
      .maybeSingle();
    if (!p) return json({ ok: false, error: "Peserta tidak ditemukan" }, { status: 404 });

    // FAST PATH: link kontribusi lama masih berlaku (cache DB) & bukan permintaan sync
    // → langsung pakai, tanpa memanggil API Mayar. Validasi lunas tetap jalan lewat
    // webhook dan lewat pemanggilan syncOnly dari halaman status.
    if (
      !syncOnly &&
      p.donation_status === "pending" &&
      p.donation_url &&
      cachedInvoiceStillValid(p.donation_invoice_expires_at as string | null)
    ) {
      return json({ ok: true, url: p.donation_url, reused: true, cached: true });
    }

    // Sinkronisasi otomatis: kalau sudah ada invoice pending, cek ke Mayar dulu.
    if (p.donation_status === "pending" && p.donation_invoice_id) {
      const { state, payload } = await fetchDonationInvoiceState(apiKey, p.donation_invoice_id);
      if (state === "paid") {
        const data = payload?.data ?? payload;
        const txIds = Array.isArray(data?.transactions)
          ? data.transactions.map((t: any) => t?.id).filter(Boolean)
          : [];
        if (data?.transactionId) txIds.push(data.transactionId);
        const verified = await verifyPaidViaTransactions(apiKey, p.donation_invoice_id, txIds);
        if (verified) {
          const { data: updated } = await supabaseAdmin.rpc("mark_donation_paid", { p_invoice_id: p.donation_invoice_id });
          if (updated) return json({ ok: true, alreadyPaid: true, synced: true });
        }
      }
      // Reuse hanya kalau invoice masih aktif; expired/closed → buat baru otomatis.
      if ((state === "active" || state === "unknown") && p.donation_url && !syncOnly) {
        if (state === "active") {
          await supabaseAdmin
            .from("participants")
            .update({
              donation_invoice_expires_at: (parseInvoiceExpiry(payload) ?? fallbackExpiry(6)).toISOString(),
            })
            .eq("registration_code", p.registration_code);
        }
        return json({ ok: true, url: p.donation_url, reused: true });
      }

      if (state === "expired") {
        console.log("Invoice donasi expired/closed, membuat invoice baru", { invoiceId: p.donation_invoice_id, code });
      }
    }
    if (p.donation_status === "paid") return json({ ok: true, alreadyPaid: true });

    // Mode sinkron saja — jangan buat invoice baru.
    if (syncOnly) return json({ ok: true, alreadyPaid: false, synced: false });

    if (p.category === "self_funded")
      return json({ ok: false, error: "Peserta Self Funded tidak diwajibkan donasi" }, { status: 403 });
    const isFastTrack = p.category === "gelombang_1" || p.category === "gelombang_2";
    if (!isFastTrack && p.status !== "accepted")
      return json({ ok: false, error: "Peserta belum dinyatakan lolos berkas administrasi" }, { status: 403 });

    const baseDescription =
      cfg.mayar_donation_description ||
      "Kontribusi peserta untuk mendukung operasional program, kegiatan sosial, berbagi makanan, wakaf Al-Qur'an, dan keberlangsungan kegiatan Safar Iman.";
    const description = `Kontribusi Donasi Safar Iman | Peserta: ${p.full_name} (${p.email}) | Kode: ${p.registration_code} — ${baseDescription}`;
    const itemDescription = `Donasi Kontribusi a/n ${p.full_name} — Kode ${p.registration_code}`;
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    const redirectUrl = `${origin.replace(/\/$/, "")}/kontribusi-sukses?code=${encodeURIComponent(code)}`;

    // Pastikan nama "Kepada" di invoice Mayar sesuai nama peserta.
    const { email: mayarEmail } = await resolveMayarEmail(
      supabaseAdmin,
      p.full_name,
      p.email,
      p.registration_code,
    );
    await upsertMayarCustomer(apiKey, { name: p.full_name, email: mayarEmail, mobile: p.whatsapp });

    const body = {
      name: p.full_name,
      email: mayarEmail,
      mobile: p.whatsapp,
      redirectUrl,
      description,
      items: [{ description: itemDescription, quantity: 1, rate: amount }],
      extraData: {
        code: p.registration_code,
        registration_code: p.registration_code,
        payment_type: "donation",
        category: p.category,
        participant_name: p.full_name,
        participant_email: p.email,
      },
    };

    // Retry-with-backoff untuk mengatasi 429 "Too many requests" dari Mayar.
    let res!: Response;
    let j: any = {};
    const delays = [0, 800, 1800, 3500, 6000];
    for (let i = 0; i < delays.length; i++) {
      if (delays[i]) await new Promise((r) => setTimeout(r, delays[i] + Math.floor(Math.random() * 250)));
      res = await fetch("https://api.mayar.id/hl/v1/invoice/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });
      j = await res.json().catch(() => ({}));
      const status = res.status || j?.statusCode || 0;
      if (status !== 429) break;
    }
    if (!res.ok || j?.statusCode >= 400) {
      const isRate = res.status === 429 || j?.statusCode === 429 ||
        /too many requests/i.test(String(j?.messages || j?.message || ""));
      if (isRate) {
        return json(
          { ok: false, error: "Mayar sedang membatasi permintaan (rate limit). Coba lagi 10-30 detik.", transient: true },
          { status: 503 },
        );
      }
      return json(
        { ok: false, error: j?.messages || j?.message || "Gagal membuat invoice", raw: j },
        { status: 502 },
      );
    }
    const url: string | undefined = j?.data?.link || j?.data?.url || j?.link;
    const invoiceId: string | undefined = j?.data?.id || j?.data?.transactionId || j?.id;
    if (!url || !invoiceId) return json({ ok: false, error: "Respon Mayar tidak lengkap", raw: j }, { status: 502 });

    await supabaseAdmin.rpc("save_donation_invoice", { p_code: code, p_invoice_id: invoiceId, p_url: url });
    return json({ ok: true, url, invoiceId });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
});
