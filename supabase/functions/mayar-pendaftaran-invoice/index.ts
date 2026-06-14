// deno-lint-ignore-file no-explicit-any
import { corsHeaders, json } from "../_shared/cors.ts";
import { getAdmin } from "../_shared/wa.ts";

type GelombangCfg = { name: string; start: string; end: string; price: number; enabled: boolean; description: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, { status: 405 });
  try {
    const supabaseAdmin = getAdmin();
    const { code } = (await req.json()) as { code?: string };
    if (!code || code.length < 4) return json({ ok: false, error: "Kode tidak valid" }, { status: 400 });

    const { data: p } = await supabaseAdmin
      .from("participants")
      .select("full_name, email, whatsapp, payment_status, payment_url, registration_code, category")
      .ilike("registration_code", code)
      .maybeSingle();
    if (!p) return json({ ok: false, error: "Peserta tidak ditemukan" }, { status: 404 });
    const paidCategories = ["gelombang_1", "gelombang_2", "self_funded"];
    if (!paidCategories.includes(p.category as string))
      return json({ ok: false, error: "Kategori ini tidak memerlukan biaya pendaftaran" }, { status: 400 });
    if (p.payment_status === "paid") return json({ ok: true, alreadyPaid: true });

    const { data: settings } = await supabaseAdmin
      .from("app_settings")
      .select("key,value")
      .in("key", ["mayar_api_key", "gelombang_config", "self_funded_price"]);
    const cfg = Object.fromEntries((settings ?? []).map((r: any) => [r.key, r.value ?? ""])) as Record<string, string>;
    const apiKey = cfg.mayar_api_key;
    if (!apiKey) return json({ ok: false, error: "Pembayaran belum dikonfigurasi admin" }, { status: 503 });

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

    const description = `Biaya pendaftaran ${slotName} — Safar Iman`;
    const origin = (req.headers.get("origin") || req.headers.get("referer") || "").replace(/\/$/, "");
    const redirectUrl = `${origin}/pendaftaran-sukses?code=${encodeURIComponent(p.registration_code)}`;

    if (p.payment_url && p.payment_status === "pending")
      return json({ ok: true, url: p.payment_url, reused: true });

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
    const j: any = await res.json().catch(() => ({}));
    if (!res.ok || j?.statusCode >= 400)
      return json({ ok: false, error: j?.messages || j?.message || "Gagal membuat invoice", raw: j }, { status: 502 });
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
