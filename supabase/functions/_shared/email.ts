// deno-lint-ignore-file no-explicit-any
import { getAdmin } from "./wa.ts";

export type EmailEvent = "pendaftaran" | "berkas" | "essay" | "kontribusi";

const SUBJECT_KEY: Record<EmailEvent, string> = {
  pendaftaran: "email_template_pendaftaran_subject",
  berkas: "email_template_berkas_subject",
  essay: "email_template_essay_subject",
  kontribusi: "email_template_kontribusi_subject",
};
const BODY_KEY: Record<EmailEvent, string> = {
  pendaftaran: "email_template_pendaftaran_body",
  berkas: "email_template_berkas_body",
  essay: "email_template_essay_body",
  kontribusi: "email_template_kontribusi_body",
};
const HTML_KEY: Record<EmailEvent, string> = {
  pendaftaran: "email_template_pendaftaran_is_html",
  berkas: "email_template_berkas_is_html",
  essay: "email_template_essay_is_html",
  kontribusi: "email_template_kontribusi_is_html",
};

export const SENDER_SETTING_KEYS = [
  "email_sender_name",
  "email_sender_local",
  "email_reply_to",
] as const;

export const DEFAULT_EMAIL_TEMPLATES: Record<EmailEvent, { subject: string; body: string }> = {
  pendaftaran: {
    subject: "Pendaftaran Safar Iman Berhasil — {kode}",
    body:
      "Assalamualaikum {nama},\n\n" +
      "Alhamdulillah, pendaftaranmu untuk program Safar Iman ({kategori}) sudah tercatat.\n\n" +
      "Kode Pendaftaran: {kode}\n\n" +
      "Simpan kode ini untuk mengunggah berkas, essay, dan memantau status seleksi.\n\n" +
      "Barakallah,\nTim Safar Iman",
  },
  berkas: {
    subject: "Berkas Pendaftaran Diterima — {kode}",
    body:
      "Assalamualaikum {nama},\n\nBerkas pendaftaranmu (CV & foto) sudah kami terima dengan kode {kode}.\nSelanjutnya silakan lanjutkan ke tahap Kontribusi dan pengisian Essay.\n\nBarakallah,\nTim Safar Iman",
  },
  essay: {
    subject: "Essay Pendaftaran Diterima — {kode}",
    body:
      "Assalamualaikum {nama},\n\nEssay-mu sudah kami terima dengan kode {kode}.\nTim seleksi akan meninjau dan pengumuman akan diumumkan melalui halaman resmi.\n\nBarakallah,\nTim Safar Iman",
  },
  kontribusi: {
    subject: "Kontribusi Diterima — Barakallah {nama}",
    body:
      "Assalamualaikum {nama},\n\nAlhamdulillah, kontribusi kebaikanmu untuk program Safar Iman sudah tercatat dengan kode {kode}.\nSemoga Allah membalas dengan kebaikan berlipat.\n\nSelanjutnya, silakan lengkapi Essay seleksi.\n\nBarakallah,\nTim Safar Iman",
  },
};

const KATEGORI_LABEL: Record<string, string> = {
  fully_funded: "Reguler (Fully Funded)",
  self_funded: "Self Funded",
  partial_funded: "Partial Funded",
  gelombang_1: "Fast Track Gelombang 1",
  gelombang_2: "Fast Track Gelombang 2",
};

const FROM_DOMAIN = "mailing.safariman.id";
const DEFAULT_SENDER_NAME = "Safar Iman";
const DEFAULT_SENDER_LOCAL = "noreply";

function fill(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\\n/g, "\n").replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Sanitize a local-part for the From email address. Only allow [a-z0-9._-].
function sanitizeLocal(s: string) {
  const clean = (s || "").toLowerCase().trim().replace(/[^a-z0-9._-]/g, "");
  return clean || DEFAULT_SENDER_LOCAL;
}

// Sanitize a display name for use in a header. Strip any chars that would
// break the From header (CR/LF, quotes, angle brackets, commas).
function sanitizeName(s: string) {
  return (s || "").replace(/[\r\n"<>,]/g, "").trim() || DEFAULT_SENDER_NAME;
}

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function sendEmailForEvent(event: EmailEvent, code: string) {
  const admin = getAdmin();
  const { data: p } = await admin
    .from("participants")
    .select("full_name, email, registration_code, category")
    .ilike("registration_code", code)
    .maybeSingle();
  if (!p) return { ok: false, error: "Peserta tidak ditemukan" };
  if (!p.email) return { ok: false, error: "Email peserta kosong" };

  const sKey = SUBJECT_KEY[event];
  const bKey = BODY_KEY[event];
  const hKey = HTML_KEY[event];
  const { data: settings } = await admin
    .from("app_settings")
    .select("key,value")
    .in("key", [sKey, bKey, hKey, ...SENDER_SETTING_KEYS]);
  const cfg = Object.fromEntries((settings ?? []).map((r: any) => [r.key, r.value ?? ""])) as Record<string, string>;

  const def = DEFAULT_EMAIL_TEMPLATES[event];
  const subjectTpl = cfg[sKey] || def.subject;
  const bodyTpl = cfg[bKey] || def.body;
  const isHtml = cfg[hKey] === "true";

  const vars = {
    nama: p.full_name ?? "",
    kode: p.registration_code ?? "",
    kategori: KATEGORI_LABEL[p.category ?? ""] ?? (p.category ?? "-"),
  };
  const subject = fill(subjectTpl, vars);
  const filledBody = fill(bodyTpl, vars);
  // When isHtml=true the admin wrote raw HTML — pass through as-is.
  // When false, escape and convert newlines to <br/> so plain text still renders.
  const bodyHtml = isHtml ? filledBody : escapeHtml(filledBody).replace(/\n/g, "<br/>");

  const senderName = sanitizeName(cfg.email_sender_name);
  const senderLocal = sanitizeLocal(cfg.email_sender_local);
  const fromHeader = `${senderName} <${senderLocal}@${FROM_DOMAIN}>`;
  const replyToRaw = (cfg.email_reply_to || "").trim();
  const replyTo = replyToRaw && isValidEmail(replyToRaw) ? replyToRaw : undefined;

  const { data, error } = await admin.functions.invoke("send-transactional-email", {
    body: {
      templateName: "custom-event",
      recipientEmail: p.email,
      idempotencyKey: `${event}-${p.registration_code}-${Date.now()}`,
      from: fromHeader,
      replyTo,
      templateData: {
        subject,
        nama: vars.nama,
        kode: vars.kode,
        kategori: vars.kategori,
        bodyHtml,
        preview: subject,
        senderName,
      },
    },
  });
  if (error) {
    let details = error.message;
    try {
      // deno-lint-ignore no-explicit-any
      const ctx = (error as any).context;
      if (ctx && typeof ctx.text === "function") details = await ctx.text();
    } catch (_) { /* ignore */ }
    console.error("send-transactional-email failed", { details, event, to: p.email });
    return { ok: false, error: details };
  }
  return { ok: true, data };
}
