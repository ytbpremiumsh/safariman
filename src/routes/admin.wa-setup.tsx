import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, QrCode, Save, Sparkles, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/wa-setup")({
  head: () => ({ meta: [{ title: "WA Setup — Safar Iman Admin" }] }),
  component: WaSetupPage,
});

const TEMPLATE_KEYS = ["wa_template_pendaftaran", "wa_template_lolos", "wa_template_ditolak", "wa_template_custom"] as const;
type TemplateKey = (typeof TEMPLATE_KEYS)[number];

const TEMPLATE_META: Record<TemplateKey, { title: string; desc: string }> = {
  wa_template_pendaftaran: { title: "Notifikasi Pendaftaran", desc: "Dikirim saat peserta baru mendaftar." },
  wa_template_lolos: { title: "Notifikasi Lolos", desc: "Dikirim saat peserta dinyatakan diterima." },
  wa_template_ditolak: { title: "Notifikasi Ditolak", desc: "Dikirim saat peserta tidak lolos." },
  wa_template_custom: { title: "Template Custom", desc: "Template bebas yang bisa dipakai admin sewaktu-waktu." },
};

function WaSetupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [sender, setSender] = useState("");
  const [tpl, setTpl] = useState<Record<TemplateKey, string>>({
    wa_template_pendaftaran: "", wa_template_lolos: "", wa_template_ditolak: "", wa_template_custom: "",
  });
  const [saving, setSaving] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [testNumber, setTestNumber] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate({ to: "/admin/login" }); return; }
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" });
      if (!isAdmin) { await supabase.auth.signOut(); navigate({ to: "/admin/login" }); return; }
      const { data } = await supabase.from("app_settings")
        .select("key,value")
        .in("key", ["mpwa_api_key", "mpwa_sender", ...TEMPLATE_KEYS]);
      const map = Object.fromEntries((data ?? []).map((r: { key: string; value: string | null }) => [r.key, r.value ?? ""]));
      setApiKey(map.mpwa_api_key ?? "");
      setSender(map.mpwa_sender ?? "");
      setTpl({
        wa_template_pendaftaran: map.wa_template_pendaftaran ?? "",
        wa_template_lolos: map.wa_template_lolos ?? "",
        wa_template_ditolak: map.wa_template_ditolak ?? "",
        wa_template_custom: map.wa_template_custom ?? "",
      });
      setLoading(false);
    })();
  }, [navigate]);

  const save = async () => {
    setSaving(true);
    const rows = [
      { key: "mpwa_api_key", value: apiKey },
      { key: "mpwa_sender", value: sender },
      ...TEMPLATE_KEYS.map((k) => ({ key: k, value: tpl[k] })),
    ].map((r) => ({ ...r, updated_at: new Date().toISOString() }));
    const { error } = await supabase.from("app_settings").upsert(rows);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Pengaturan tersimpan");
  };

  const generateQr = async () => {
    if (!apiKey || !sender) { toast.error("Isi API Key & Sender dulu, lalu Simpan"); return; }
    setQrLoading(true); setQr(null);
    try {
      const res = await fetch("/api/public/mpwa/generate-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device: sender, api_key: apiKey, force: true }),
      });
      const json = await res.json();
      if (json.qrcode) { setQr(json.qrcode); toast.success("Scan QR di WhatsApp > Perangkat Tertaut"); }
      else toast.success(json.msg || "Device sudah terhubung");
    } catch (e) {
      console.error(e);
      toast.error("Gagal generate QR");
    } finally {
      setQrLoading(false);
    }
  };

  const sendTest = async () => {
    if (!apiKey || !sender) { toast.error("Lengkapi API Key & Sender"); return; }
    if (!testNumber) { toast.error("Masukkan nomor test"); return; }
    const number = testNumber.replace(/\D/g, "").replace(/^0/, "62");
    setTesting(true);
    try {
      const res = await fetch("/api/public/mpwa/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey, sender, number,
          message: "🔔 Test pesan dari Safar Iman Admin Dashboard. Jika kamu menerima ini, MPWA sudah terhubung.",
          footer: "Safar Iman",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Gagal kirim");
      toast.success(`Pesan test terkirim ke ${number}`);
    } catch (e: any) {
      toast.error(e.message || "Gagal kirim pesan test");
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="size-8 animate-spin text-accent" /></div>;

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-emerald-deep text-white sticky top-0 z-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-gradient-gold grid place-items-center">
              <Sparkles className="size-4 text-emerald-deep" />
            </div>
            <div>
              <div className="font-display text-lg font-semibold leading-none">Safar Iman</div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-accent">WA Setup</div>
            </div>
          </Link>
          <Link to="/admin" className="text-sm text-white/80 hover:text-white inline-flex items-center gap-1.5 px-3 py-2">
            <ArrowLeft className="size-4" /> Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
        {/* Credentials */}
        <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">MPWA Credentials</h2>
            <p className="text-sm text-muted-foreground">Akun MPWA dari <span className="font-mono">app.ayopintar.com</span> untuk mengirim notifikasi WhatsApp.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">API Key</Label>
              <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="MPWA API Key" className="font-mono" />
            </div>
            <div>
              <Label className="text-sm">Sender / Nomor Device</Label>
              <Input value={sender} onChange={(e) => setSender(e.target.value)} placeholder="6281234567890" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-gradient-emerald text-accent px-5 py-2.5 text-sm font-semibold shadow-emerald disabled:opacity-60">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Simpan Pengaturan
            </button>
            <button onClick={generateQr} disabled={qrLoading} className="inline-flex items-center gap-2 rounded-full bg-accent/15 text-accent px-5 py-2.5 text-sm font-semibold hover:bg-accent/25 disabled:opacity-60">
              {qrLoading ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />} Generate QR
            </button>
          </div>
          {qr && (
            <div className="rounded-2xl border border-border p-5 bg-secondary/30 grid place-items-center">
              <img src={qr} alt="QR Code" className="size-64" />
              <p className="text-xs text-muted-foreground mt-2 text-center max-w-sm">Buka WhatsApp di HP &gt; Setting &gt; Perangkat Tertaut &gt; Tautkan Perangkat. Scan QR di atas.</p>
            </div>
          )}
        </section>

        {/* Test send */}
        <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">Test Pengiriman</h2>
            <p className="text-sm text-muted-foreground">Kirim pesan tes ke nomor WA untuk memastikan koneksi MPWA aktif.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input value={testNumber} onChange={(e) => setTestNumber(e.target.value)} placeholder="08xxxxxxxxxx" className="sm:max-w-xs" />
            <button onClick={sendTest} disabled={testing} className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald text-white px-5 py-2.5 text-sm font-semibold hover:bg-emerald-deep disabled:opacity-60">
              {testing ? <Loader2 className="size-4 animate-spin" /> : <Phone className="size-4" />} Kirim Test
            </button>
          </div>
        </section>

        {/* Templates */}
        <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="font-display text-2xl font-semibold flex items-center gap-2"><MessageCircle className="size-5 text-accent" /> Template Pesan</h2>
            <p className="text-sm text-muted-foreground">
              Variabel yang bisa dipakai: <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">{"{nama}"}</code>{" "}
              <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">{"{kode}"}</code>{" "}
              <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">{"{kategori}"}</code>{" "}
              <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">{"{status}"}</code>
            </p>
          </div>
          <div className="grid gap-5">
            {TEMPLATE_KEYS.map((k) => (
              <div key={k} className="space-y-1.5">
                <Label className="text-sm font-semibold">{TEMPLATE_META[k].title}</Label>
                <p className="text-xs text-muted-foreground">{TEMPLATE_META[k].desc}</p>
                <textarea
                  value={tpl[k]}
                  onChange={(e) => setTpl((p) => ({ ...p, [k]: e.target.value }))}
                  rows={6}
                  className="w-full rounded-md border border-input bg-background p-3 text-sm font-mono"
                />
              </div>
            ))}
          </div>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-5 py-2.5 text-sm font-bold shadow-gold disabled:opacity-60">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Simpan Template
          </button>
        </section>
      </main>
    </div>
  );
}
