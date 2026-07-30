// deno-lint-ignore-file no-explicit-any
import { corsHeaders, json } from "../_shared/cors.ts";
import { getAdmin } from "../_shared/wa.ts";
import { requireAdmin } from "../_shared/admin-auth.ts";

const FROM_DOMAIN = "mailing.safariman.id";

function esc(s: string) {
  return (s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function sanitizeName(s: string) {
  return (s || "").replace(/[\r\n"<>,]/g, "").trim() || "Safar Iman";
}
function sanitizeLocal(s: string) {
  const c = (s || "").toLowerCase().trim().replace(/[^a-z0-9._-]/g, "");
  return c || "noreply";
}

async function loadSettings(admin: any) {
  const keys = [
    "payment_reminder_auto_enabled",
    "payment_reminder_ft_subject",
    "payment_reminder_ft_body",
    "payment_reminder_kt_subject",
    "payment_reminder_kt_body",
    "email_sender_name",
    "email_sender_local",
    "email_reply_to",
  ];
  const { data } = await admin.from("app_settings").select("key,value").in("key", keys);
  const map: Record<string,string> = Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value ?? ""]));
  return map;
}

const DEFAULT_FT_SUBJECT = "Pengingat Pembayaran Fast Track — {kode}";
const DEFAULT_FT_BODY =
  "Assalamualaikum {nama},\n\n" +
  "Ini pengingat bahwa biaya Fast Track pendaftaran Safar Iman untuk kode {kode} belum lunas.\n\n" +
  "Silakan klik tombol di bawah untuk menyelesaikan pembayaran. Jika sudah membayar, mohon abaikan email ini.\n\n" +
  "{button}\n\n" +
  "Atau buka link berikut: {payment_url}\n\n" +
  "Barakallah,\nTim Safar Iman";
const DEFAULT_KT_SUBJECT = "Pengingat Kontribusi — {kode}";
const DEFAULT_KT_BODY =
  "Assalamualaikum {nama},\n\n" +
  "Ini pengingat bahwa kontribusi kebaikan untuk program Safar Iman (kode {kode}) belum tercatat.\n\n" +
  "Silakan klik tombol di bawah untuk menyelesaikan kontribusi. Jika sudah membayar, mohon abaikan email ini.\n\n" +
  "{button}\n\n" +
  "Atau buka link berikut: {donation_url}\n\n" +
  "Barakallah,\nTim Safar Iman";

function fill(tpl: string, v: Record<string,string>) {
  return tpl.replace(/\\n/g,"\n").replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");
}

async function ensureInvoiceUrl(_admin: any, code: string, kind: "fast_track"|"kontribusi"): Promise<{ url: string; error?: string }> {
  if (!code) return { url: "", error: "kode kosong" };
  const fnName = kind === "fast_track" ? "mayar-pendaftaran-invoice" : "mayar-create-invoice";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supaUrl = Deno.env.get("SUPABASE_URL")!;
  try {
    const res = await fetch(`${supaUrl}/functions/v1/${fnName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
      body: JSON.stringify({ code }),
    });
    const text = await res.text();
    let parsed: any = {};
    try { parsed = JSON.parse(text); } catch { /* ignore */ }
    if (parsed?.url) return { url: String(parsed.url) };
    return { url: "", error: parsed?.error || `HTTP ${res.status}: ${text.slice(0, 200)}` };
  } catch (e) {
    return { url: "", error: (e as Error).message };
  }
}

async function sendReminder(admin: any, cfg: Record<string,string>, participant: any, kind: "fast_track"|"kontribusi") {
  const subjectTpl = kind === "fast_track"
    ? (cfg.payment_reminder_ft_subject || DEFAULT_FT_SUBJECT)
    : (cfg.payment_reminder_kt_subject || DEFAULT_KT_SUBJECT);
  const bodyTpl = kind === "fast_track"
    ? (cfg.payment_reminder_ft_body || DEFAULT_FT_BODY)
    : (cfg.payment_reminder_kt_body || DEFAULT_KT_BODY);

  const code = participant.registration_code ?? "";

  // Ensure we have payment/donation URLs — fetch stored URL first, then regenerate via Mayar if empty/expired.
  let payUrl = participant.payment_url ?? null;
  let donUrl = participant.donation_url ?? null;
  if (payUrl === undefined || donUrl === undefined || payUrl === null || donUrl === null) {
    const { data: full } = await admin.from("participants")
      .select("payment_url, donation_url")
      .eq("id", participant.participant_id ?? participant.id)
      .maybeSingle();
    payUrl = payUrl || full?.payment_url || "";
    donUrl = donUrl || full?.donation_url || "";
  }
  // If the URL required for this reminder kind is empty, call the invoice edge function
  // (which reuses valid URLs or regenerates if expired) so the button always points
  // to a live Mayar invoice for that specific participant code.
  let invoiceError = "";
  if (kind === "fast_track" && !payUrl) {
    const r = await ensureInvoiceUrl(admin, code, "fast_track");
    payUrl = r.url; invoiceError = r.error ?? "";
  }
  if (kind === "kontribusi" && !donUrl) {
    const r = await ensureInvoiceUrl(admin, code, "kontribusi");
    donUrl = r.url; invoiceError = r.error ?? "";
  }

  const activeUrl = kind === "fast_track" ? (payUrl || "") : (donUrl || "");
  if (!activeUrl) {
    const label = kind === "fast_track" ? "Fast Track" : "Kontribusi";
    const detail = invoiceError ? ` (${invoiceError})` : "";
    return { ok: false, error: `Link pembayaran ${label} belum tersedia untuk ${code}${detail}. Silakan generate invoice terlebih dahulu.` };
  }
  const buttonLabel = kind === "fast_track" ? "Bayar Fast Track Sekarang" : "Kontribusi Sekarang";
  const button = `<div style="margin:20px 0;text-align:center"><a href="${activeUrl}" target="_blank" rel="noopener" style="display:inline-block;padding:12px 28px;background:#059669;color:#ffffff;text-decoration:none;border-radius:9999px;font-weight:600;font-family:Arial,sans-serif">${buttonLabel}</a></div>`;

  const vars: Record<string,string> = {
    nama: participant.full_name ?? "",
    kode: participant.registration_code ?? "",
    payment_url: payUrl || "",
    donation_url: donUrl || "",
    url: activeUrl,
    button,
  };
  const subject = fill(subjectTpl, vars);
  // Detect HTML-ness on the RAW template (before {button} substitution injects HTML),
  // otherwise newlines in plain-text templates are silently dropped.
  const looksHtml = /<\/?[a-z][\s\S]*>/i.test(bodyTpl);
  let bodyHtml: string;
  if (looksHtml) {
    bodyHtml = fill(bodyTpl, vars);
  } else {
    // Escape the plain-text template first, convert newlines, then substitute
    // placeholders so button/URLs retain their raw HTML.
    const normalizedTpl = bodyTpl.replace(/\\n/g, "\n");
    const escapedTpl = esc(normalizedTpl).replace(/\n/g, "<br/>");
    bodyHtml = fill(escapedTpl, vars);
  }
  // Auto-append button if user didn't include {button}/{url}/{payment_url}/{donation_url} in template.
  const mentionsAction = /\{(button|url|payment_url|donation_url)\}/.test(bodyTpl);
  if (!mentionsAction && button) bodyHtml += button;

  const senderName = sanitizeName(cfg.email_sender_name);
  const senderLocal = sanitizeLocal(cfg.email_sender_local);
  const fromHeader = `${senderName} <${senderLocal}@${FROM_DOMAIN}>`;
  const replyToRaw = (cfg.email_reply_to || "").trim();
  const replyTo = replyToRaw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyToRaw) ? replyToRaw : undefined;

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supaUrl = Deno.env.get("SUPABASE_URL")!;
  try {
    const resp = await fetch(`${supaUrl}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
      body: JSON.stringify({
        templateName: "custom-event",
        recipientEmail: participant.email,
        idempotencyKey: `reminder-${kind}-${participant.registration_code}-${Date.now()}`,
        from: fromHeader,
        replyTo,
        templateData: {
          subject, nama: vars.nama, kode: vars.kode,
          bodyHtml, preview: subject, senderName,
        },
      }),
    });
    const text = await resp.text();
    let parsed: any = {};
    try { parsed = JSON.parse(text); } catch { /* ignore */ }
    if (!resp.ok) {
      return { ok: false, error: parsed?.error || `HTTP ${resp.status}: ${text.slice(0, 200)}` };
    }
    if (parsed?.success === false) {
      return { ok: false, error: parsed?.reason || parsed?.error || "email tidak terkirim" };
    }
    return { ok: true, data: parsed };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, { status: 405 });

  try {
    const body = await req.json().catch(() => ({}));
    const action = (body?.action ?? "") as string;
    const admin = getAdmin();

    // Cron / auto action — protected by service role bearer.
    if (action === "run-auto") {
      const auth = req.headers.get("Authorization") ?? "";
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      if (auth !== `Bearer ${serviceKey}`) {
        return json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
      const cfg = await loadSettings(admin);
      if ((cfg.payment_reminder_auto_enabled ?? "false") !== "true") {
        return json({ ok: true, skipped: true, reason: "auto disabled" });
      }
      const { data: candidates } = await admin.rpc("list_auto_reminder_candidates");
      // Throttle: batasi jumlah per run dan beri jeda antar kirim supaya
      // pembuatan invoice massal tidak menghabiskan kuota rate limit Mayar
      // (yang membuat user biasa ikut kena error 429 saat mendaftar/bayar).
      const MAX_PER_RUN = 60;
      const DELAY_MS = 1500;
      const all = candidates ?? [];
      const list = all.slice(0, MAX_PER_RUN);
      let sent = 0, failed = 0;
      for (const c of list) {
        const res = await sendReminder(admin, cfg, c, c.kind);
        await admin.from("payment_reminders").insert({
          participant_id: c.participant_id,
          kind: c.kind,
          channel: "email",
          auto: true,
          status: res.ok ? "sent" : "failed",
          note: res.ok ? null : String(res.error ?? "").slice(0, 500),
        });
        if (res.ok) sent++; else failed++;
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
      return json({ ok: true, processed: list.length, pending: all.length - list.length, sent, failed });

    }

    // Admin-only actions
    const guard = await requireAdmin(req);
    if (guard) return guard;

    if (action === "list") {
      // Paginate to bypass PostgREST default 1000 row cap
      const pageSize = 1000;
      let from = 0;
      const all: any[] = [];
      for (;;) {
        const { data, error } = await admin
          .rpc("list_unpaid_participants_with_reminders")
          .range(from, from + pageSize - 1);
        if (error) return json({ ok: false, error: error.message }, { status: 500 });
        const rows = data ?? [];
        all.push(...rows);
        if (rows.length < pageSize) break;
        from += pageSize;
        if (from > 50000) break; // safety
      }
      // has_berkas is now returned directly from the RPC.
      const cfg = await loadSettings(admin);
      return json({
        ok: true,
        items: all,
        auto_enabled: (cfg.payment_reminder_auto_enabled ?? "false") === "true",
        templates: {
          ft_subject: cfg.payment_reminder_ft_subject || DEFAULT_FT_SUBJECT,
          ft_body: cfg.payment_reminder_ft_body || DEFAULT_FT_BODY,
          kt_subject: cfg.payment_reminder_kt_subject || DEFAULT_KT_SUBJECT,
          kt_body: cfg.payment_reminder_kt_body || DEFAULT_KT_BODY,
        },
      });
    }

    if (action === "send-manual") {
      const pid = body.participant_id as string;
      const kind = body.kind as "fast_track"|"kontribusi";
      if (!pid || !["fast_track","kontribusi"].includes(kind)) {
        return json({ ok: false, error: "invalid params" }, { status: 400 });
      }
      const { data: p } = await admin.from("participants")
        .select("id, full_name, email, registration_code, category, payment_status, donation_status, payment_url, donation_url")
        .eq("id", pid).maybeSingle();
      if (!p) return json({ ok: false, error: "Peserta tidak ditemukan" }, { status: 404 });
      if (!p.email) return json({ ok: false, error: "Email peserta kosong" }, { status: 400 });
      const cfg = await loadSettings(admin);
      const res = await sendReminder(admin, cfg, p, kind);
      await admin.from("payment_reminders").insert({
        participant_id: p.id,
        kind,
        channel: "email",
        auto: false,
        status: res.ok ? "sent" : "failed",
        note: res.ok ? null : String(res.error ?? "").slice(0, 500),
      });
      if (!res.ok) return json({ ok: false, error: res.error });
      return json({ ok: true });
    }

    if (action === "save-settings") {
      const auto = body.auto_enabled ? "true" : "false";
      const t = body.templates ?? {};
      const now = new Date().toISOString();
      const rows = [
        { key: "payment_reminder_auto_enabled", value: auto, updated_at: now },
        { key: "payment_reminder_ft_subject", value: String(t.ft_subject ?? ""), updated_at: now },
        { key: "payment_reminder_ft_body", value: String(t.ft_body ?? ""), updated_at: now },
        { key: "payment_reminder_kt_subject", value: String(t.kt_subject ?? ""), updated_at: now },
        { key: "payment_reminder_kt_body", value: String(t.kt_body ?? ""), updated_at: now },
      ];
      const { error } = await admin.from("app_settings").upsert(rows);
      if (error) return json({ ok: false, error: error.message }, { status: 500 });
      return json({ ok: true });
    }

    return json({ ok: false, error: "unknown action" }, { status: 400 });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
});
