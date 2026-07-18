// deno-lint-ignore-file no-explicit-any
import { corsHeaders, json } from "../_shared/cors.ts";
import { getAdmin } from "../_shared/wa.ts";
import { resolveMayarEmail, upsertMayarCustomer } from "../_shared/mayar-customer.ts";

type GelombangCfg = { name: string; start: string; end: string; price: number; enabled: boolean; description: string };

function isPaidLike(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const v = value.trim().toLowerCase();
  if (!v) return false;
  if (/^un/.test(v) || /pending|fail|expire|cancel|refund|void|await|process/.test(v)) return false;
  return /\b(paid|success|successful|settled|completed|capture|captured|success_paid)\b/.test(v);
}

function invoiceLooksPaid(payload: any): boolean {
  const data = payload?.data ?? payload;
  if (
    isPaidLike(data?.status) ||
    isPaidLike(data?.transactionStatus) ||
    isPaidLike(data?.transaction_status) ||
    isPaidLike(data?.invoice?.status) ||
    isPaidLike(data?.payment?.status)
  ) {
    return true;
  }
  const transactions = Array.isArray(data?.transactions) ? data.transactions : [];
  return transactions.some((tx: any) =>
    isPaidLike(tx?.status) || isPaidLike(tx?.transactionStatus) || isPaidLike(tx?.transaction_status)
  );
}

function invoiceLooksExpired(payload: any): boolean {
  const data = payload?.data ?? payload;
  const statusStr = String(
    data?.status || data?.invoice?.status || data?.transactionStatus || data?.transaction_status || "",
  ).toLowerCase();
  if (/expire|expired|closed|cancel|canceled|cancelled|void/.test(statusStr)) return true;
  const expiredAt = data?.expiredAt || data?.expired_at || data?.expiryDate || data?.expiry_date || data?.dueDate;
  if (expiredAt) {
    const t = new Date(expiredAt).getTime();
    if (!Number.isNaN(t) && t > 0 && t < Date.now()) return true;
  }
  return false;
}

async function fetchInvoiceState(apiKey: string, invoiceId?: string | null): Promise<"paid" | "expired" | "active" | "unknown"> {
  if (!invoiceId) return "unknown";
  try {
    const res = await fetch(`https://api.mayar.id/hl/v1/invoice/${encodeURIComponent(invoiceId)}`, {
      method: "GET",
      headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` },
    });
    const payload = await res.json().catch(() => ({}));
    if (res.status === 404) return "expired";
    if (!res.ok) return "unknown";
    if (invoiceLooksPaid(payload)) return "paid";
    if (invoiceLooksExpired(payload)) return "expired";
    return "active";
  } catch (e) {
    console.warn("fetchInvoiceState error", e);
    return "unknown";
  }
}

async function syncInvoiceStatus(supabaseAdmin: any, apiKey: string, invoiceId?: string | null) {
  const state = await fetchInvoiceState(apiKey, invoiceId);
  if (state !== "paid" || !invoiceId) return false;
  const { data: updated } = await supabaseAdmin.rpc("mark_payment_paid", { p_invoice_id: invoiceId });
  return Boolean(updated);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, { status: 405 });
  try {
    const supabaseAdmin = getAdmin();
    const { code } = (await req.json()) as { code?: string };
    if (!code || code.length < 4) return json({ ok: false, error: "Kode tidak valid" }, { status: 400 });

    const { data: p, error: pErr } = await supabaseAdmin
      .from("participants")
      .select("full_name, email, whatsapp, payment_status, payment_url, payment_invoice_id, registration_code, category")
      .ilike("registration_code", code)
      .maybeSingle();
    if (pErr) {
      // DB unavailable (Cloud timeout) — return 200 soft-fail so background sync doesn't spam error monitors.
      return json({ ok: false, error: "Database sementara tidak tersedia, coba lagi", transient: true });
    }
    if (!p) return json({ ok: false, error: "Peserta tidak ditemukan" }, { status: 404 });
    const paidCategories = ["gelombang_1", "gelombang_2", "self_funded"];
    if (!paidCategories.includes(p.category as string))
      return json({ ok: false, error: "Kategori ini tidak memerlukan biaya pendaftaran" }, { status: 400 });
    if (p.payment_status === "paid") return json({ ok: true, alreadyPaid: true });

    const { data: settings, error: sErr } = await supabaseAdmin
      .from("app_settings")
      .select("key,value")
      .in("key", ["mayar_api_key", "gelombang_config", "self_funded_price", "self_funded_paid_enabled"]);
    if (sErr) {
      return json({ ok: false, error: "Konfigurasi tidak dapat dimuat, coba lagi", transient: true });
    }
    const cfg = Object.fromEntries((settings ?? []).map((r: any) => [r.key, r.value ?? ""])) as Record<string, string>;
    const apiKey = cfg.mayar_api_key;
    if (!apiKey) return json({ ok: false, error: "Pembayaran belum dikonfigurasi admin" }, { status: 503 });


    if (p.payment_status === "pending" && p.payment_invoice_id) {
      const synced = await syncInvoiceStatus(supabaseAdmin, apiKey, p.payment_invoice_id);
      if (synced) return json({ ok: true, alreadyPaid: true, synced: true });
      // Reuse invoice pending yang sudah ada — JANGAN buat baru,
      // supaya Mayar tidak trigger 429 "Duplicate request" dan
      // tidak muncul banyak invoice/notif untuk peserta yang sama.
      if (p.payment_url) {
        return json({ ok: true, url: p.payment_url, reused: true });
      }
    }

    if (p.category === "self_funded" && cfg.self_funded_paid_enabled === "false") {
      return json({ ok: false, error: "Pendaftaran Self Funded saat ini GRATIS — tidak perlu pembayaran" }, { status: 400 });
    }

    let amount = 0;
    let slotName = "";
    if (p.category === "self_funded") {
      amount = Number(cfg.self_funded_price || "50000");
      slotName = "Self Funded";
    } else {
      let gelombangCfg: Record<string, GelombangCfg> = {};
      try {
        gelombangCfg = JSON.parse(cfg.gelombang_config || "{}");
      } catch {
        return json({ ok: false, error: "Konfigurasi gelombang rusak" }, { status: 500 });
      }
      const slot = gelombangCfg[p.category as string];
      if (!slot) return json({ ok: false, error: "Gelombang belum dikonfigurasi" }, { status: 500 });
      amount = Number(slot.price || 0);
      slotName = slot.name;
    }
    if (!amount || amount < 1000) return json({ ok: false, error: "Nominal pendaftaran tidak valid" }, { status: 500 });

    const description = `Biaya Pendaftaran ${slotName} — Safar Iman | Peserta: ${p.full_name} (${p.email}) | Kode: ${p.registration_code}`;
    const itemDescription = `Pendaftaran ${slotName} a/n ${p.full_name} — Kode ${p.registration_code}`;
    const rawOrigin = (req.headers.get("origin") || req.headers.get("referer") || "").replace(/\/$/, "");
    // Fallback ke domain publik jika origin/referer tidak ada (mis. panggilan server-to-server).
    // Mayar mewajibkan `redirectUrl` berupa URL absolut valid.
    const origin = /^https?:\/\//i.test(rawOrigin) ? rawOrigin : "https://safariman.my.id";
    const redirectUrl = `${origin}/pendaftaran-sukses?code=${encodeURIComponent(p.registration_code)}`;

    // Pastikan nama "Kepada" di invoice Mayar sesuai nama peserta.
    // Kalau email pernah dipakai peserta lain, pakai plus-alias supaya
    // Mayar membuat customer baru (bukan reuse nama customer lama).
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
        payment_type: "registration",
        category: p.category,
        participant_name: p.full_name,
        participant_email: p.email,
      },
    };
    // Retry-with-backoff untuk mengatasi 429 "Too many requests" dari Mayar
    // (rate-limit per API key). Tanpa retry, user stuck karena payment_url
    // tidak pernah tersimpan.
    let res!: Response;
    let j: any = {};
    const delays = [0, 800, 1800, 3500];
    for (let i = 0; i < delays.length; i++) {
      if (delays[i]) await new Promise((r) => setTimeout(r, delays[i]));
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
      return json({ ok: false, error: j?.messages || j?.message || "Gagal membuat invoice", raw: j }, { status: 502 });
    }
    const url: string | undefined = j?.data?.link || j?.data?.url || j?.link;
    const invoiceId: string | undefined = j?.data?.id || j?.data?.transactionId || j?.id;
    if (!url || !invoiceId) return json({ ok: false, error: "Respon Mayar tidak lengkap", raw: j }, { status: 502 });

    await supabaseAdmin.rpc("save_payment_invoice", {
      p_code: p.registration_code,
      p_invoice_id: invoiceId,
      p_url: url,
    });
    return json({ ok: true, url, invoiceId });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
});
