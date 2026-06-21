import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Mail, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/pengaturan/email")({
  head: () => ({ meta: [{ title: "Template Email — Safar Iman Admin" }] }),
  component: EmailSetting,
});

type EventKey = "pendaftaran" | "berkas" | "essay" | "kontribusi";

const EVENTS: { key: EventKey; title: string; desc: string }[] = [
  { key: "pendaftaran", title: "Pendaftaran Sukses", desc: "Dikirim saat peserta selesai daftar (Reguler & Gelombang)." },
  { key: "berkas", title: "Kirim Berkas Sukses", desc: "Dikirim saat peserta upload CV & foto." },
  { key: "essay", title: "Kirim Essay Sukses", desc: "Dikirim saat peserta submit essay." },
  { key: "kontribusi", title: "Kontribusi Sukses", desc: "Dikirim saat pembayaran kontribusi/donasi tercatat." },
];

const DEFAULTS: Record<EventKey, { subject: string; body: string }> = {
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

function fill(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

function EmailSetting() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [tpls, setTpls] = useState<Record<EventKey, { subject: string; body: string }>>({
    pendaftaran: { subject: "", body: "" },
    berkas: { subject: "", body: "" },
    essay: { subject: "", body: "" },
    kontribusi: { subject: "", body: "" },
  });
  const [saving, setSaving] = useState<EventKey | null>(null);
  const [testCode, setTestCode] = useState("");
  const [testing, setTesting] = useState<EventKey | null>(null);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const keys = EVENTS.flatMap((e) => [`email_template_${e.key}_subject`, `email_template_${e.key}_body`]);
      const { data } = await supabase.from("app_settings").select("key,value").in("key", keys);
      const map = Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value ?? ""]));
      const next: typeof tpls = { ...tpls };
      for (const e of EVENTS) {
        next[e.key] = {
          subject: map[`email_template_${e.key}_subject`] || DEFAULTS[e.key].subject,
          body: map[`email_template_${e.key}_body`] || DEFAULTS[e.key].body,
        };
      }
      setTpls(next);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const save = async (k: EventKey) => {
    setSaving(k);
    const now = new Date().toISOString();
    const { error } = await supabase.from("app_settings").upsert([
      { key: `email_template_${k}_subject`, value: tpls[k].subject, updated_at: now },
      { key: `email_template_${k}_body`, value: tpls[k].body, updated_at: now },
    ]);
    setSaving(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Template email disimpan");
  };

  const resetDefault = (k: EventKey) => {
    setTpls((s) => ({ ...s, [k]: { ...DEFAULTS[k] } }));
  };

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
        Custom subjek & isi email yang dikirim otomatis ke peserta. Placeholder yang tersedia:
        <code className="mx-1 px-1.5 py-0.5 rounded bg-muted text-xs">{"{nama}"}</code>
        <code className="mx-1 px-1.5 py-0.5 rounded bg-muted text-xs">{"{kode}"}</code>
        <code className="mx-1 px-1.5 py-0.5 rounded bg-muted text-xs">{"{kategori}"}</code>
        . Gunakan baris baru biasa untuk paragraf.
      </p>

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
  value: { subject: string; body: string };
  onChange: (v: { subject: string; body: string }) => void;
  onSave: () => void; onReset: () => void; onTest: () => void;
  saving: boolean; testing: boolean;
}) {
  const preview = useMemo(() => {
    const vars = { nama: "Ahmad", kode: "HXP-DEMO1234", kategori: "Reguler (Fully Funded)" };
    return { subject: fill(value.subject, vars), body: fill(value.body, vars) };
  }, [value]);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
      <div>
        <div className="font-display text-lg font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subjek Email</label>
        <Input value={value.subject} onChange={(e) => onChange({ ...value, subject: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Isi Email</label>
        <Textarea rows={8} value={value.body} onChange={(e) => onChange({ ...value, body: e.target.value })} className="font-mono text-sm" />
      </div>
      <details className="rounded-lg bg-secondary/50 border border-border p-3 text-sm">
        <summary className="cursor-pointer font-medium">Preview (data contoh)</summary>
        <div className="mt-2 text-xs text-muted-foreground"><strong>Subjek:</strong> {preview.subject}</div>
        <pre className="mt-2 whitespace-pre-wrap text-xs">{preview.body}</pre>
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
