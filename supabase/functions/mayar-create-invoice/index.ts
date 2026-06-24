// deno-lint-ignore-file no-explicit-any
import { corsHeaders, json } from "../_shared/cors.ts";
import { getAdmin } from "../_shared/wa.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, { status: 405 });
  try {
    const supabaseAdmin = getAdmin();
    const { code, force } = (await req.json()) as { code?: string; force?: boolean };
    if (!code || code.length < 4) return json({ ok: false, error: "Kode tidak valid" }, { status: 400 });

    const { data: settings } = await supabaseAdmin
      .from("app_settings")
      .select("key,value")
      .in("key", ["mayar_api_key", "mayar_donation_amount", "mayar_donation_description", "mayar_redirect_url"]);
    const cfg = Object.fromEntries((settings ?? []).map((r: any) => [r.key, r.value ?? ""])) as Record<string, string>;
    const apiKey = cfg.mayar_api_key;
    if (!apiKey) return json({ ok: false, error: "Pembayaran belum dikonfigurasi admin" }, { status: 503 });

    const amount = Number(cfg.mayar_donation_amount || "150000");
    const description =
      cfg.mayar_donation_description ||
      "Kontribusi peserta untuk mendukung operasional program, kegiatan sosial, berbagi makanan, wakaf Al-Qur'an, dan keberlangsungan kegiatan Safar Iman.";
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    const redirectUrl =
      cfg.mayar_redirect_url || `${origin.replace(/\/$/, "")}/donasi?code=${encodeURIComponent(code)}`;

    const { data: p } = await supabaseAdmin
      .from("participants")
      .select("full_name, email, whatsapp, status, donation_status, donation_url, registration_code, category")
      .ilike("registration_code", code)
      .maybeSingle();
    if (!p) return json({ ok: false, error: "Peserta tidak ditemukan" }, { status: 404 });
    if (p.category === "self_funded")
      return json({ ok: false, error: "Peserta Self Funded tidak diwajibkan donasi" }, { status: 403 });
    const isFastTrack = p.category === "gelombang_1" || p.category === "gelombang_2";
    if (!isFastTrack && p.status !== "accepted")
      return json({ ok: false, error: "Peserta belum dinyatakan lolos berkas administrasi" }, { status: 403 });
    if (p.donation_status === "paid") return json({ ok: true, alreadyPaid: true });
    if (!force && p.donation_url && p.donation_status === "pending")
      return json({ ok: true, url: p.donation_url, reused: true });

    const body = {
      name: p.full_name,
      email: p.email,
      mobile: p.whatsapp,
      redirectUrl,
      description,
      items: [{ description, quantity: 1, rate: amount }],
      extraData: {
        code: p.registration_code,
        registration_code: p.registration_code,
        payment_type: "donation",
        category: p.category,
      },
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
    if (!res.ok || j?.statusCode >= 400) {
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
