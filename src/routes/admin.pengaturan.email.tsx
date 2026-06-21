import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Mail, Save, Send, AtSign, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/pengaturan/email")({
  head: () => ({ meta: [{ title: "Template Email — Safar Iman Admin" }] }),
  component: EmailSetting,
});

const FROM_DOMAIN = "safariman.id";

type EventKey = "pendaftaran" | "berkas" | "essay" | "kontribusi";

const EVENTS: { key: EventKey; title: string; desc: string }[] = [
  { key: "pendaftaran", title: "Pendaftaran Sukses", desc: "Dikirim saat peserta selesai daftar (Reguler & Gelombang)." },
  { key: "berkas", title: "Kirim Berkas Sukses", desc: "Dikirim saat peserta upload CV & foto." },
  { key: "essay", title: "Kirim Essay Sukses", desc: "Dikirim saat peserta submit essay." },
  { key: "kontribusi", title: "Kontribusi Sukses", desc: "Dikirim saat pembayaran kontribusi/donasi tercatat." },
];

const DEFAULTS: Record<EventKey, { subject: string; body: string; isHtml: boolean }> = {
  pendaftaran: {
    subject: "Pendaftaran Safar Iman Berhasil — {kode}",
    body:
      "Assalamualaikum {nama},\n\n" +
      "Alhamdulillah, pendaftaranmu untuk program Safar Iman ({kategori}) sudah tercatat.\n\n" +
      "Kode Pendaftaran: {kode}\n\n" +
      "Simpan kode ini untuk mengunggah berkas, essay, dan memantau status seleksi.\n\n" +
      "Barakallah,\nTim Safar Iman",
    isHtml: false,
  },
  berkas: {
    subject: "Berkas Pendaftaran Diterima — {kode}",
    body:
      "Assalamualaikum {nama},\n\nBerkas pendaftaranmu (CV & foto) sudah kami terima dengan kode {kode}.\nSelanjutnya silakan lanjutkan ke tahap Kontribusi dan pengisian Essay.\n\nBarakallah,\nTim Safar Iman",
    isHtml: false,
  },
  essay: {
    subject: "Essay Pendaftaran Diterima — {kode}",
    body:
      "Assalamualaikum {nama},\n\nEssay-mu sudah kami terima dengan kode {kode}.\nTim seleksi akan meninjau dan pengumuman akan diumumkan melalui halaman resmi.\n\nBarakallah,\nTim Safar Iman",
    isHtml: false,
  },
  kontribusi: {
    subject: "Kontribusi Diterima — Barakallah {nama}",
    body:
      "Assalamualaikum {nama},\n\nAlhamdulillah, kontribusi kebaikanmu untuk program Safar Iman sudah tercatat dengan kode {kode}.\nSemoga Allah membalas dengan kebaikan berlipat.\n\nSelanjutnya, silakan lengkapi Essay seleksi.\n\nBarakallah,\nTim Safar Iman",
    isHtml: false,
  },
};

function fill(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function sanitizeLocal(s: string) {
  return (s || "").toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

function EmailSetting() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);

  const [senderName, setSenderName] = useState("Safar Iman");
  const [senderLocal, setSenderLocal] = useState("noreply");
  const [replyTo, setReplyTo] = useState("");
  const [savingSender, setSavingSender] = useState(false);

  const [tpls, setTpls] = useState<Record<EventKey, { subject: string; body: string; isHtml: boolean }>>({
    pendaftaran: { subject: "", body: "", isHtml: false },
    berkas: { subject: "", body: "", isHtml: false },
    essay: { subject: "", body: "", isHtml: false },
    kontribusi: { subject: "", body: "", isHtml: false },
  });
  const [saving, setSaving] = useState<EventKey | null>(null);
  const [testCode, setTestCode] = useState("");
  const [testing, setTesting] = useState<EventKey | null>(null);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const tplKeys = EVENTS.flatMap((e) => [
        `email_template_${e.key}_subject`,
        `email_template_${e.key}_body`,
        `email_template_${e.key}_is_html`,
      ]);
      const senderKeys = ["email_sender_name", "email_sender_local", "email_reply_to"];
      const { data } = await supabase.from("app_settings").select("key,value").in("key", [...tplKeys, ...senderKeys]);
      const map = Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value ?? ""]));

      setSenderName(map.email_sender_name || "Safar Iman");
      setSenderLocal(map.email_sender_local || "noreply");
      setReplyTo(map.email_reply_to || "");

      const next: typeof tpls = { ...tpls };
      for (const e of EVENTS) {
        next[e.key] = {
          subject: map[`email_template_${e.key}_subject`] || DEFAULTS[e.key].subject,
          body: map[`email_template_${e.key}_body`] || DEFAULTS[e.key].body,
          isHtml: map[`email_template_${e.key}_is_html`] === "true",
        };
      }
      setTpls(next);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const saveSender = async () => {
    const cleanLocal = sanitizeLocal(senderLocal);
    if (!cleanLocal) { toast.error("Email pengirim (sebelum @) wajib diisi"); return; }
    if (replyTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) { toast.error("Reply-to tidak valid"); return; }
    setSenderLocal(cleanLocal);
    setSavingSender(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from("app_settings").upsert([
      { key: "email_sender_name", value: senderName.trim() || "Safar Iman", updated_at: now },
      { key: "email_sender_local", value: cleanLocal, updated_at: now },
      { key: "email_reply_to", value: replyTo.trim(), updated_at: now },
    ]);
    setSavingSender(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profil pengirim disimpan");
  };

  const save = async (k: EventKey) => {
    setSaving(k);
    const now = new Date().toISOString();
    const { error } = await supabase.from("app_settings").upsert([
      { key: `email_template_${k}_subject`, value: tpls[k].subject, updated_at: now },
      { key: `email_template_${k}_body`, value: tpls[k].body, updated_at: now },
      { key: `email_template_${k}_is_html`, value: tpls[k].isHtml ? "true" : "false", updated_at: now },
    ]);
    setSaving(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Template email disimpan");
  };

  const resetDefault = (k: EventKey) => setTpls((s) => ({ ...s, [k]: { ...DEFAULTS[k] } }));

  const sendTest = async (k: EventKey) => {
    const c = testCode.trim().toUpperCase();
    if (c.length < 4) { toast.error("Isi kode pendaftaran peserta untuk test kirim"); return; }
    setTesting(k);
    try {
      const { data, error } = await supabase.functions.invoke("email-notify", { body: { event: k, code: c } });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Gagal kirim");
      toast.success("Email test terkirim");
    } catch (e: any) {
      toast.error(e?.message || "Gagal kirim email");
    } finally {
      setTesting(null);
    }
  };

  if (!ready) return <AdminLoading />;

  return (
    <AdminShell title="Template Email">
      <p className="text-sm text-muted-foreground -mt-3">
        Custom profil pengirim & isi email otomatis ke peserta. Placeholder yang tersedia di subjek/isi:
        <code className="mx-1 px-1.5 py-0.5 rounded bg-muted text-xs">{"{nama}"}</code>
        <code className="mx-1 px-1.5 py-0.5 rounded bg-muted text-xs">{"{kode}"}</code>
        <code className="mx-1 px-1.5 py-0.5 rounded bg-muted text-xs">{"{kategori}"}</code>.
      </p>

      {/* Profil pengirim */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-emerald/10 text-emerald grid place-items-center"><User className="size-4" /></div>
          <div>
            <div className="font-display text-lg font-semibold">Profil Pengirim</div>
            <div className="text-xs text-muted-foreground">Nama tampilan & alamat email yang muncul di inbox peserta.</div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nama Pengirim</label>
            <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Safar Iman" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Alamat Email (sebelum @)</label>
            <div className="flex items-center gap-1.5">
              <Input value={senderLocal} onChange={(e) => setSenderLocal(e.target.value)} placeholder="noreply" className="flex-1" />
              <span className="text-sm text-muted-foreground">@{FROM_DOMAIN}</span>
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1"><AtSign className="size-3.5" /> Reply-To (opsional)</label>
            <Input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="cs@safariman.id" type="email" />
            <p className="text-[11px] text-muted-foreground">Jika peserta klik “Reply”, balasan akan masuk ke alamat ini.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Preview pengirim di inbox</div>
          <div className="mt-1 font-medium">{senderName.trim() || "Safar Iman"} <span className="text-muted-foreground font-normal">&lt;{sanitizeLocal(senderLocal) || "noreply"}@{FROM_DOMAIN}&gt;</span></div>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <strong>Catatan foto profil:</strong> avatar bulat di Gmail/Inbox ditentukan oleh provider penerima (BIMI/Gravatar), bukan oleh pengirim. Untuk menampilkan logo brand otomatis di semua provider, dibutuhkan setup BIMI + sertifikat VMC yang berbayar dan terpisah.
        </p>

        <button onClick={saveSender} disabled={savingSender} className="inline-flex items-center gap-1.5 rounded-full bg-emerald text-emerald-foreground px-4 py-2 text-sm font-semibold disabled:opacity-60">
          {savingSender ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Simpan Profil
        </button>
      </div>

      {/* Test kirim */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <Mail className="size-4 text-emerald" />
        <span className="text-sm font-medium">Kode peserta untuk uji kirim:</span>
        <Input value={testCode} onChange={(e) => setTestCode(e.target.value.toUpperCase())} placeholder="HXP-XXXXXXXX" className="max-w-xs" />
        <span className="text-xs text-muted-foreground">Email akan dikirim ke email peserta tersebut.</span>
      </div>

      {loading ? (
        <div className="text-center py-10"><Loader2 className="size-6 animate-spin mx-auto text-accent" /></div>
      ) : (
        <div className="space-y-6">
          {EVENTS.map((e) => (
            <EventCard
              key={e.key}
              title={e.title}
              desc={e.desc}
              value={tpls[e.key]}
              onChange={(v) => setTpls((s) => ({ ...s, [e.key]: v }))}
              onSave={() => save(e.key)}
              onReset={() => resetDefault(e.key)}
              onTest={() => sendTest(e.key)}
              saving={saving === e.key}
              testing={testing === e.key}
            />
          ))}
        </div>
      )}
    </AdminShell>
  );
}

function EventCard({
  title, desc, value, onChange, onSave, onReset, onTest, saving, testing,
}: {
  title: string; desc: string;
  value: { subject: string; body: string; isHtml: boolean };
  onChange: (v: { subject: string; body: string; isHtml: boolean }) => void;
  onSave: () => void; onReset: () => void; onTest: () => void;
  saving: boolean; testing: boolean;
}) {
  const preview = useMemo(() => {
    const vars = { nama: "Ahmad", kode: "HXP-DEMO1234", kategori: "Reguler (Fully Funded)" };
    const filledBody = fill(value.body, vars);
    return {
      subject: fill(value.subject, vars),
      bodyHtml: value.isHtml ? filledBody : escapeHtml(filledBody).replace(/\n/g, "<br/>"),
    };
  }, [value]);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-lg font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
        <label className="flex items-center gap-2 text-sm shrink-0">
          <Switch checked={value.isHtml} onCheckedChange={(c) => onChange({ ...value, isHtml: c })} />
          <span className="font-medium">HTML</span>
        </label>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subjek Email</label>
        <Input value={value.subject} onChange={(e) => onChange({ ...value, subject: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Isi Email {value.isHtml ? "(HTML)" : "(teks biasa, baris baru otomatis jadi <br>)"}
        </label>
        <Textarea
          rows={10}
          value={value.body}
          onChange={(e) => onChange({ ...value, body: e.target.value })}
          className="font-mono text-sm"
          placeholder={value.isHtml ? "<p>Halo {nama}, …</p>" : "Halo {nama}, …"}
        />
        {value.isHtml && (
          <p className="text-[11px] text-muted-foreground">
            Gunakan HTML inline (tag <code>&lt;p&gt;</code>, <code>&lt;a&gt;</code>, <code>&lt;strong&gt;</code>, <code>&lt;img&gt;</code>, inline <code>style="…"</code>). Hindari <code>&lt;script&gt;</code> / <code>&lt;style&gt;</code> blok karena banyak inbox memblokirnya.
          </p>
        )}
      </div>
      <details className="rounded-lg bg-secondary/50 border border-border p-3 text-sm" open>
        <summary className="cursor-pointer font-medium">Preview (data contoh)</summary>
        <div className="mt-2 text-xs text-muted-foreground"><strong>Subjek:</strong> {preview.subject}</div>
        <div
          className="mt-2 bg-white text-foreground rounded-md border border-border p-3 text-sm"
          dangerouslySetInnerHTML={{ __html: preview.bodyHtml }}
        />
      </details>
      <div className="flex flex-wrap gap-2 pt-1">
        <button onClick={onSave} disabled={saving} className="inline-flex items-center gap-1.5 rounded-full bg-emerald text-emerald-foreground px-4 py-2 text-sm font-semibold disabled:opacity-60">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Simpan
        </button>
        <button onClick={onTest} disabled={testing} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-60">
          {testing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Test Kirim
        </button>
        <button onClick={onReset} className="text-xs text-muted-foreground hover:text-foreground ml-auto">
          Reset ke default
        </button>
      </div>
    </div>
  );
}
