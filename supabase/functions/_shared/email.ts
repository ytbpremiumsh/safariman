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
      "Assalamualaikum {nama},\n\n" +
      "Berkas pendaftaranmu (CV & foto) sudah kami terima dengan kode {kode}.\n" +
      "Selanjutnya silakan lanjutkan ke tahap Kontribusi dan pengisian Essay.\n\n" +
      "Barakallah,\nTim Safar Iman",
  },
  essay: {
    subject: "Essay Pendaftaran Diterima — {kode}",
    body:
      "Assalamualaikum {nama},\n\n" +
      "Essay-mu sudah kami terima dengan kode {kode}.\n" +
      "Tim seleksi akan meninjau dan pengumuman akan diumumkan melalui halaman resmi.\n\n" +
      "Barakallah,\nTim Safar Iman",
  },
  kontribusi: {
    subject: "Kontribusi Diterima — Barakallah {nama}",
    body:
      "Assalamualaikum {nama},\n\n" +
      "Alhamdulillah, kontribusi kebaikanmu untuk program Safar Iman sudah tercatat dengan kode {kode}.\n" +
      "Semoga Allah membalas dengan kebaikan berlipat.\n\n" +
      "Selanjutnya, silakan lengkapi Essay seleksi.\n\n" +
      "Barakallah,\nTim Safar Iman",
  },
};

const KATEGORI_LABEL: Record<string, string> = {
  fully_funded: "Reguler (Fully Funded)",
  self_funded: "Self Funded",
  partial_funded: "Partial Funded",
  gelombang_1: "Fast Track Gelombang 1",
  gelombang_2: "Fast Track Gelombang 2",
};

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
  const { data: settings } = await admin
    .from("app_settings")
    .select("key,value")
    .in("key", [sKey, bKey]);
  const cfg = Object.fromEntries((settings ?? []).map((r: any) => [r.key, r.value ?? ""])) as Record<string, string>;

  const def = DEFAULT_EMAIL_TEMPLATES[event];
  const subjectTpl = cfg[sKey] || def.subject;
  const bodyTpl = cfg[bKey] || def.body;

  const vars = {
    nama: p.full_name ?? "",
    kode: p.registration_code ?? "",
    kategori: KATEGORI_LABEL[p.category ?? ""] ?? (p.category ?? "-"),
  };
  const subject = fill(subjectTpl, vars);
  const bodyText = fill(bodyTpl, vars);
  const bodyHtml = escapeHtml(bodyText).replace(/\n/g, "<br/>");

  const { error } = await admin.functions.invoke("send-transactional-email", {
    body: {
      templateName: "custom-event",
      recipientEmail: p.email,
      idempotencyKey: `${event}-${p.registration_code}`,
      templateData: {
        subject,
        nama: vars.nama,
        kode: vars.kode,
        kategori: vars.kategori,
        bodyHtml,
        preview: subject,
      },
    },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
