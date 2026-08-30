import { AI_PAUSED, AI_PAUSED_MESSAGE } from "@/lib/features";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, QrCode, Save, MessageCircle, Phone, Bot, Webhook, Copy, BookOpen, Sparkles, CheckCircle2, PowerOff, CircleDashed, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AdminShell } from "@/components/AdminShell";

const DEFAULT_AI_BEHAVIOR = `Kamu adalah asisten WhatsApp resmi Safar Iman — program Umrah Gratis untuk anak muda berprestasi.
- Selalu sapa dengan "Assalamu'alaikum" pada pesan pertama.
- Jawab singkat, hangat, sopan, dan islami (1–4 kalimat).
- Gunakan bahasa Indonesia.
- Jika pertanyaan di luar program Safar Iman, arahkan kembali ke topik program.
- Jangan mengarang fakta yang tidak ada di Knowledge. Jika tidak tahu, sarankan menghubungi admin manusia.
- Jangan janjikan kelolosan, jangan minta data sensitif (KTP, nomor rekening, kata sandi).`;

const DEFAULT_AI_KNOWLEDGE = `# Tentang Safar Iman
Safar Iman adalah program Umrah Gratis (Fully Funded) untuk anak muda Indonesia berprestasi usia 12–45 tahun. Tagline: "Hasanah × Prestasi".

# Apakah benar gratis?
Untuk jalur Fully Funded seluruh biaya ditanggung 100%: tiket pesawat PP, visa, hotel, makan, bis, muthawif, tour leader, perlengkapan, dan city tour internasional. Jalur Partial mendapat subsidi sebagian, Self Funded bersifat mandiri.

# Syarat bahasa
Tidak wajib bisa bahasa Arab. Kemampuan dasar bahasa Arab/Inggris menjadi nilai tambah.

# Siapa yang boleh daftar?
Pelajar, mahasiswa, dan profesional muda usia 12–45 tahun. Wajib Muslim, sehat jasmani/rohani, dan punya prestasi/kontribusi sosial.

# Tahapan seleksi
1) Pendaftaran online & dapat Kode Pendaftaran (HXP-xxxx)
2) Bagikan Twibbon & Poster
3) Kirim Berkas & Essay (CV, foto, 3 essay)
4) Seleksi Administrasi
5) Interview online
6) Pengumuman
7) Technical Meeting
8) Keberangkatan

# Biaya tersembunyi?
Tidak ada biaya tersembunyi. Semua transparan. Setelah lolos berkas administrasi, peserta diminta kontribusi donasi untuk mendukung operasional, kegiatan sosial, berbagi makanan, dan wakaf Al-Qur'an — bukan biaya program.

# Benefit untuk SEMUA peserta (walau belum lolos)
Setiap peserta yang menyelesaikan tahap berkas akan tetap mendapat:
- Kelas Online "Fiqh Umrah Praktis: Dari Niat hingga Tahallul" (e-sertifikat)
- Kajian Sirah "Jejak Cahaya: Makkah & Madinah dalam Lintasan Sejarah Nabi ﷺ"
- Akses komunitas alumni Safar Iman

# Cara cek status & donasi
Buka halaman /kontribusi di website, masukkan Kode Pendaftaran. Jika sudah lolos berkas, link pembayaran donasi (via Mayar) akan muncul.

# Kontak admin manusia
WhatsApp: +62 812-3456-7890 · Email: hello@safariman.id · Instagram: @safariman.id`;

export const Route = createFileRoute("/admin/wa-setup")({
  head: () => ({ meta: [{ title: "WhatsApp & AI — Safar Iman Admin" }] }),
  component: WaSetupPage,
});


const TEMPLATE_KEYS = ["wa_template_pendaftaran", "wa_template_pendaftaran_self", "wa_template_berkas", "wa_template_lolos", "wa_template_ditolak", "wa_template_custom"] as const;
type TemplateKey = (typeof TEMPLATE_KEYS)[number];

const TEMPLATE_META: Record<TemplateKey, { title: string; desc: string }> = {
  wa_template_pendaftaran: { title: "Notifikasi Pendaftaran (Reguler)", desc: "Dikirim otomatis saat peserta jalur Reguler / Fully Funded selesai mendaftar. Sertakan info tahap Berkas & Essay." },
  wa_template_pendaftaran_self: { title: "Notifikasi Pendaftaran (Self Funded)", desc: "Dikirim otomatis untuk peserta jalur Self Funded. Tidak perlu menyebut tahap Berkas / Essay — cukup info Kode Pendaftaran untuk cek status." },
  wa_template_berkas: { title: "Notifikasi Berkas Diterima", desc: "Dikirim otomatis saat peserta selesai mengirim berkas & essay." },
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
    wa_template_pendaftaran: "", wa_template_pendaftaran_self: "", wa_template_berkas: "", wa_template_lolos: "", wa_template_ditolak: "", wa_template_custom: "",
  });
  const [saving, setSaving] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [testNumber, setTestNumber] = useState("");
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);

  // AI auto-reply
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiBehavior, setAiBehavior] = useState(DEFAULT_AI_BEHAVIOR);
  const [aiKnowledge, setAiKnowledge] = useState(DEFAULT_AI_KNOWLEDGE);
  const [savingAi, setSavingAi] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate({ to: "/admin/login" }); return; }
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" });
      if (!isAdmin) { await supabase.auth.signOut(); navigate({ to: "/admin/login" }); return; }
      const { data } = await supabase.from("app_settings")
        .select("key,value")
        .in("key", ["mpwa_api_key", "mpwa_sender", "wa_ai_reply_enabled", "wa_ai_behavior", "wa_ai_knowledge", "wa_notif_enabled", ...TEMPLATE_KEYS]);
      const map = Object.fromEntries((data ?? []).map((r: { key: string; value: string | null }) => [r.key, r.value ?? ""]));
      setApiKey(map.mpwa_api_key ?? "");
      setSender(map.mpwa_sender ?? "");
      setTpl({
        wa_template_pendaftaran: map.wa_template_pendaftaran ?? "",
        wa_template_pendaftaran_self: map.wa_template_pendaftaran_self ?? "",
        wa_template_berkas: map.wa_template_berkas ?? "",
        wa_template_lolos: map.wa_template_lolos ?? "",
        wa_template_ditolak: map.wa_template_ditolak ?? "",
        wa_template_custom: map.wa_template_custom ?? "",
      });
      setAiEnabled(!AI_PAUSED && map.wa_ai_reply_enabled === "true");
      setNotifEnabled((map.wa_notif_enabled ?? "true") !== "false");
      if (map.wa_ai_behavior) setAiBehavior(map.wa_ai_behavior);
      if (map.wa_ai_knowledge) setAiKnowledge(map.wa_ai_knowledge);
      const { edgeFunctionUrl } = await import("@/lib/api");
      setWebhookUrl(edgeFunctionUrl("mpwa-webhook"));
      setLoading(false);

      // Auto-check connection status (silent). Skip if admin baru saja
      // memutuskan device — jangan panggil generate-qr karena beberapa
      // build MPWA otomatis meregistrasi ulang sesi hanya karena endpoint
      // ini dihit. Admin bisa cek manual via tombol.
      const key = map.mpwa_api_key ?? "";
      const snd = map.mpwa_sender ?? "";
      const skipKey = `wa_skip_auto_check:${snd}`;
      const skipAuto = typeof window !== "undefined" && sessionStorage.getItem(skipKey) === "1";
      if (key && snd && !skipAuto) {
        try {
          const { mpwaProxy } = await import("@/lib/api");
          const json: any = await mpwaProxy("generate-qr", { device: snd, api_key: key });
          setConnected(!json?.qrcode);
        } catch {
          setConnected(false);
        }
      } else if (skipAuto) {
        setConnected(false);
      }
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

  const saveAi = async () => {
    setSavingAi(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from("app_settings").upsert([
      { key: "wa_ai_reply_enabled", value: !AI_PAUSED && aiEnabled ? "true" : "false", updated_at: now },
      { key: "wa_ai_behavior", value: aiBehavior, updated_at: now },
      { key: "wa_ai_knowledge", value: aiKnowledge, updated_at: now },
    ]);
    setSavingAi(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Pengaturan AI tersimpan");
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin`);
  };


  const generateQr = async () => {
    if (!apiKey || !sender) { toast.error("Isi API Key & Sender dulu, lalu Simpan"); return; }
    setQrLoading(true); setQr(null);
    try { sessionStorage.removeItem(`wa_skip_auto_check:${sender}`); } catch { /* noop */ }
    try {
      const { mpwaProxy } = await import("@/lib/api");
      const json: any = await mpwaProxy("generate-qr", { device: sender, api_key: apiKey, force: true });
      if (json?.qrcode) {
        setQr(json.qrcode);
        setConnected(false);
        toast.success("Scan QR di WhatsApp > Perangkat Tertaut");
      } else {
        setConnected(true);
        toast.success(json?.msg || "Device sudah terhubung");
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal generate QR");
    } finally {
      setQrLoading(false);
    }
  };

  const disconnectDevice = async () => {
    if (!apiKey || !sender) { toast.error("Lengkapi API Key & Sender"); return; }
    if (!confirm("Putuskan koneksi WhatsApp untuk device ini?\n\nSetelah diputus, admin harus scan QR ulang untuk mengaktifkan kembali.")) return;
    setDisconnecting(true);
    try {
      const { mpwaProxy } = await import("@/lib/api");
      // Panggil delete-device 2x untuk memastikan sesi benar-benar dihapus
      // di sisi MPWA (kadang butuh 2 request supaya session store bersih).
      await mpwaProxy("delete-device", { device: sender, api_key: apiKey });
      await new Promise((r) => setTimeout(r, 400));
      const json: any = await mpwaProxy("delete-device", { device: sender, api_key: apiKey });
      setConnected(false);
      setQr(null);
      // Cegah useEffect / re-render memanggil generate-qr yang bisa
      // memicu MPWA meregistrasi ulang sesi.
      try { sessionStorage.setItem(`wa_skip_auto_check:${sender}`, "1"); } catch { /* noop */ }
      toast.success(json?.msg || "Device diputuskan. Scan QR ulang untuk konek kembali.");
    } catch (e: any) {
      toast.error(e.message || "Gagal memutuskan device");
    } finally {
      setDisconnecting(false);
    }
  };

  const toggleNotif = async (next: boolean) => {
    setSavingNotif(true);
    setNotifEnabled(next);
    const { error } = await supabase.from("app_settings").upsert([
      { key: "wa_notif_enabled", value: next ? "true" : "false", updated_at: new Date().toISOString() },
    ]);
    setSavingNotif(false);
    if (error) {
      setNotifEnabled(!next);
      toast.error(error.message);
      return;
    }
    toast.success(next ? "Notifikasi WA diaktifkan" : "Notifikasi WA dinonaktifkan");
  };

  const sendTest = async () => {
    if (!apiKey || !sender) { toast.error("Lengkapi API Key & Sender"); return; }
    if (!testNumber) { toast.error("Masukkan nomor test"); return; }
    const number = testNumber.replace(/\D/g, "").replace(/^0/, "62");
    setTesting(true);
    try {
      const { mpwaProxy } = await import("@/lib/api");
      await mpwaProxy("send-message", {
        api_key: apiKey, sender, number,
        message: "🔔 Test pesan dari Safar Iman Admin Dashboard. Jika kamu menerima ini, MPWA sudah terhubung.",
        footer: "Safar Iman",
      });
      toast.success(`Pesan test terkirim ke ${number}`);
    } catch (e: any) {
      toast.error(e.message || "Gagal kirim pesan test");
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="size-8 animate-spin text-accent" /></div>;

  return (
    <AdminShell title="WhatsApp & AI Assistant">

      <div className="space-y-6 max-w-5xl">

        {/* Credentials */}
        <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">MPWA Credentials</h2>
            <p className="text-sm text-muted-foreground">Akun MPWA dari <span className="font-mono">app.ayopintar.com</span> untuk mengirim notifikasi WhatsApp.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">API Key</Label>
              <div className="relative">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="MPWA API Key"
                  className="font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                  aria-label={showApiKey ? "Sembunyikan API Key" : "Tampilkan API Key"}
                >
                  {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-sm">Sender / Nomor Device</Label>
              <Input value={sender} onChange={(e) => setSender(e.target.value)} placeholder="6281234567890" />
            </div>
          </div>
          {/* Status indicator */}
          <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
            connected === true
              ? "border-emerald/40 bg-emerald/5"
              : connected === false
              ? "border-destructive/40 bg-destructive/5"
              : "border-border bg-secondary/40"
          }`}>
            {connected === true ? (
              <span className="relative flex size-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-emerald" />
              </span>
            ) : connected === false ? (
              <span className="inline-flex size-3 rounded-full bg-destructive" />
            ) : (
              <CircleDashed className="size-4 text-muted-foreground animate-spin [animation-duration:3s]" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold flex items-center gap-2">
                {connected === true ? (
                  <>
                    <CheckCircle2 className="size-4 text-emerald animate-pulse" />
                    Perangkat Terhubung
                  </>
                ) : connected === false ? (
                  "Perangkat Belum Terhubung"
                ) : (
                  "Status Tidak Diketahui"
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {connected === true
                  ? "MPWA siap mengirim & menerima pesan WhatsApp."
                  : connected === false
                  ? "Klik Generate QR untuk menautkan perangkat."
                  : "Klik Generate QR untuk mengecek status device."}
              </p>
            </div>
          </div>

          {/* Toggle notifikasi WhatsApp */}
          <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/30 px-4 py-3">
            <Switch checked={notifEnabled} onCheckedChange={toggleNotif} disabled={savingNotif} className="mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Kirim Notifikasi WhatsApp Otomatis</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kalau dimatikan, sistem tidak akan mengirim pesan WA otomatis (pendaftaran, berkas, essay) walaupun perangkat terhubung. Berguna saat masa maintenance atau saat kredit MPWA habis.
              </p>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shrink-0 ${notifEnabled ? "bg-emerald text-white" : "bg-muted text-muted-foreground"}`}>
              {notifEnabled ? "ON" : "OFF"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-gradient-emerald text-accent px-5 py-2.5 text-sm font-semibold shadow-emerald disabled:opacity-60">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Simpan Pengaturan
            </button>
            <button onClick={generateQr} disabled={qrLoading} className="inline-flex items-center gap-2 rounded-full bg-accent/15 text-accent px-5 py-2.5 text-sm font-semibold hover:bg-accent/25 disabled:opacity-60">
              {qrLoading ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />} {connected ? "Cek / Refresh QR" : "Generate QR"}
            </button>
            {connected === true && (
              <button onClick={disconnectDevice} disabled={disconnecting} className="inline-flex items-center gap-2 rounded-full bg-destructive/10 text-destructive px-5 py-2.5 text-sm font-semibold hover:bg-destructive/20 disabled:opacity-60 animate-fade-in">
                {disconnecting ? <Loader2 className="size-4 animate-spin" /> : <PowerOff className="size-4" />} Diskonek
              </button>
            )}
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

        {/* AI Auto-Reply */}
        <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-display text-2xl font-semibold flex items-center gap-2">
                <Bot className="size-5 text-accent" /> AI Auto-Reply WhatsApp
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Asisten AI akan menjawab pesan WhatsApp masuk secara otomatis berdasarkan Knowledge & Behavior di bawah.
                Provider AI (Lovable AI Gateway atau OpenRouter) diatur di <a className="text-accent underline" href="/admin/pengaturan/ai-provider">Pengaturan → AI Provider</a>.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-secondary/60 rounded-full px-4 py-2">
              <Sparkles className={`size-4 ${aiEnabled ? "text-accent" : "text-muted-foreground"}`} />
              <Label htmlFor="ai-toggle" className="text-sm font-medium cursor-pointer">
                {aiEnabled ? "Aktif" : "Nonaktif"}
              </Label>
              <Switch id="ai-toggle" disabled={AI_PAUSED} checked={!AI_PAUSED && aiEnabled} onCheckedChange={setAiEnabled} />
            </div>
          </div>

          {AI_PAUSED && <p className="text-sm text-amber-700">{AI_PAUSED_MESSAGE}</p>}

          {/* Webhook URL */}
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Webhook className="size-4 text-accent" /> Webhook URL (untuk MPWA)
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Salin URL ini, lalu tempelkan di dashboard <span className="font-mono">app.ayopintar.com</span> →{" "}
              <strong>Webhook / Auto Reply / Incoming Message URL</strong>. Setiap pesan WA masuk akan dijawab AI.
            </p>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="font-mono text-xs" />
              <button
                onClick={() => copyText(webhookUrl, "Webhook URL")}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald text-white px-4 py-2 text-sm font-semibold shrink-0 hover:bg-emerald-deep"
              >
                <Copy className="size-4" /> Salin
              </button>
            </div>
          </div>

          {/* AI Behavior */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Bot className="size-4 text-accent" /> AI Behavior (Karakter & Aturan)
            </Label>
            <p className="text-xs text-muted-foreground">
              Atur gaya bicara, tone, batasan, dan persona asisten. Ini menjadi <em>system prompt</em>.
            </p>
            <textarea
              value={aiBehavior}
              onChange={(e) => setAiBehavior(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-input bg-background p-3 text-sm leading-relaxed"
            />
          </div>

          {/* AI Knowledge */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="size-4 text-accent" /> AI Knowledge Base
            </Label>
            <p className="text-xs text-muted-foreground">
              Pengetahuan yang dipakai AI untuk menjawab. Tambah/ubah pertanyaan & jawaban di sini. Gunakan format Markdown sederhana.
            </p>
            <textarea
              value={aiKnowledge}
              onChange={(e) => setAiKnowledge(e.target.value)}
              rows={18}
              className="w-full rounded-xl border border-input bg-background p-3 text-sm font-mono leading-relaxed"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={saveAi}
              disabled={savingAi}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-5 py-2.5 text-sm font-bold shadow-gold disabled:opacity-60"
            >
              {savingAi ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Simpan AI Settings
            </button>
            <button
              onClick={() => { setAiBehavior(DEFAULT_AI_BEHAVIOR); setAiKnowledge(DEFAULT_AI_KNOWLEDGE); toast.info("Behavior & Knowledge direset ke default"); }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium hover:bg-secondary"
            >
              Reset ke Default
            </button>
          </div>
        </section>
      </div>
    </AdminShell>
  );

}

