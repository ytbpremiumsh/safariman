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
  "Silakan lanjutkan pembayaran melalui halaman sukses pendaftaran atau tombol Bayar Pendaftaran di aplikasi. Jika sudah membayar, mohon abaikan email ini.\n\n" +
  "Barakallah,\nTim Safar Iman";
const DEFAULT_KT_SUBJECT = "Pengingat Kontribusi — {kode}";
const DEFAULT_KT_BODY =
  "Assalamualaikum {nama},\n\n" +
  "Ini pengingat bahwa kontribusi kebaikan untuk program Safar Iman (kode {kode}) belum tercatat.\n\n" +
  "Silakan selesaikan kontribusi melalui link Mayar yang telah dikirim. Jika sudah membayar, mohon abaikan email ini.\n\n" +
  "Barakallah,\nTim Safar Iman";

function fill(tpl: string, v: Record<string,string>) {
  return tpl.replace(/\\n/g,"\n").replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");
}

async function sendReminder(admin: any, cfg: Record<string,string>, participant: any, kind: "fast_track"|"kontribusi") {
  const subjectTpl = kind === "fast_track"
    ? (cfg.payment_reminder_ft_subject || DEFAULT_FT_SUBJECT)
    : (cfg.payment_reminder_kt_subject || DEFAULT_KT_SUBJECT);
  const bodyTpl = kind === "fast_track"
    ? (cfg.payment_reminder_ft_body || DEFAULT_FT_BODY)
    : (cfg.payment_reminder_kt_body || DEFAULT_KT_BODY);

  const vars = {
    nama: participant.full_name ?? "",
    kode: participant.registration_code ?? "",
  };
  const subject = fill(subjectTpl, vars);
  const body = fill(bodyTpl, vars);
  const bodyHtml = esc(body).replace(/\n/g, "<br/>");

  const senderName = sanitizeName(cfg.email_sender_name);
  const senderLocal = sanitizeLocal(cfg.email_sender_local);
  const fromHeader = `${senderName} <${senderLocal}@${FROM_DOMAIN}>`;
  const replyToRaw = (cfg.email_reply_to || "").trim();
  const replyTo = replyToRaw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyToRaw) ? replyToRaw : undefined;

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const { data, error } = await admin.functions.invoke("send-transactional-email", {
    headers: { Authorization: `Bearer ${serviceKey}` },
    body: {
      templateName: "custom-event",
      recipientEmail: participant.email,
      idempotencyKey: `reminder-${kind}-${participant.registration_code}-${Date.now()}`,
      from: fromHeader,
      replyTo,
      templateData: {
        subject, nama: vars.nama, kode: vars.kode,
        bodyHtml, preview: subject, senderName,
      },
    },
  });
  if (error) {
    let details = error.message;
    try { const ctx = (error as any).context; if (ctx?.text) details = await ctx.text(); } catch(_) {}
    return { ok: false, error: details };
  }
  return { ok: true, data };
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
      const list = candidates ?? [];
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
      }
      return json({ ok: true, processed: list.length, sent, failed });
    }

    // Admin-only actions
    const guard = await requireAdmin(req);
    if (guard) return guard;

    if (action === "list") {
      const { data, error } = await admin.rpc("list_unpaid_participants_with_reminders");
      if (error) return json({ ok: false, error: error.message }, { status: 500 });
      const cfg = await loadSettings(admin);
      return json({
        ok: true,
        items: data ?? [],
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
        .select("id, full_name, email, registration_code, category, payment_status, donation_status")
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
      if (!res.ok) return json({ ok: false, error: res.error }, { status: 502 });
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
