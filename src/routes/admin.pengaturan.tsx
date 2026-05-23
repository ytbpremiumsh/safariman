import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Clock, HeartHandshake, Loader2, CheckCircle2, Copy, Webhook, BookOpen, KeyRound, Image as ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/pengaturan")({
  head: () => ({ meta: [{ title: "Pengaturan — Safar Iman Admin" }] }),
  component: PengaturanPage,
});

function PengaturanPage() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);

  const [countdownTarget, setCountdownTarget] = useState("");
  const [savingCountdown, setSavingCountdown] = useState(false);

  const [mayarKey, setMayarKey] = useState("");
  const [mayarAmount, setMayarAmount] = useState("150000");
  const [mayarDesc, setMayarDesc] = useState("");
  const [savingMayar, setSavingMayar] = useState(false);

  const [webhookUrl, setWebhookUrl] = useState("");
  const [mpwaWebhookUrl, setMpwaWebhookUrl] = useState("");

  const [panduanUrl, setPanduanUrl] = useState("");
  const [savingPanduan, setSavingPanduan] = useState(false);

  const [mayarWebhookSecret, setMayarWebhookSecret] = useState("");
  const [mpwaWebhookSecret, setMpwaWebhookSecret] = useState("");
  const [savingSecrets, setSavingSecrets] = useState(false);

  const [twibbonFrameUrl, setTwibbonFrameUrl] = useState("");
  const [uploadingFrame, setUploadingFrame] = useState(false);
  const frameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data } = await supabase.from("app_settings").select("key,value");
      const map = Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value ?? ""]));
      const raw = map.countdown_target ?? "";
      if (raw) {
        const d = new Date(raw);
        if (!Number.isNaN(d.getTime())) {
          const pad = (n: number) => String(n).padStart(2, "0");
          setCountdownTarget(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
        }
      }
      setMayarKey(map.mayar_api_key ?? "");
      setMayarAmount(map.mayar_donation_amount ?? "150000");
      setMayarDesc(map.mayar_donation_description ?? "Kontribusi peserta untuk mendukung operasional program, kegiatan sosial, berbagi makanan, wakaf Al-Qur'an, dan keberlangsungan kegiatan Safar Iman.");
      setPanduanUrl(map.panduan_url ?? "");
      setMayarWebhookSecret(map.mayar_webhook_secret ?? "");
      setMpwaWebhookSecret(map.mpwa_webhook_secret ?? "");
      setTwibbonFrameUrl(map.twibbon_frame_url ?? "");
      if (typeof window !== "undefined") {
        setWebhookUrl(`${window.location.origin}/api/public/mayar-webhook`);
        setMpwaWebhookUrl(`${window.location.origin}/api/public/mpwa-webhook`);
      }
      setLoading(false);
    })();
  }, [ready]);

  const saveCountdown = async () => {
    if (!countdownTarget) { toast.error("Pilih tanggal & waktu"); return; }
    setSavingCountdown(true);
    const iso = new Date(countdownTarget).toISOString();
    const { error } = await supabase.from("app_settings").upsert({
      key: "countdown_target", value: iso, updated_at: new Date().toISOString(),
    });
    setSavingCountdown(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Waktu countdown disimpan");
  };

  const savePanduan = async () => {
    const v = panduanUrl.trim();
    if (v && !/^https?:\/\//i.test(v) && !v.startsWith("#") && !v.startsWith("/")) {
      toast.error("URL harus diawali http(s)://, /, atau #");
      return;
    }
    setSavingPanduan(true);
    const { error } = await supabase.from("app_settings").upsert({
      key: "panduan_url", value: v, updated_at: new Date().toISOString(),
    });
    setSavingPanduan(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Link Panduan disimpan");
  };

  const saveMayar = async () => {
    if (!mayarKey.trim()) { toast.error("API Key Mayar wajib diisi"); return; }
    setSavingMayar(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from("app_settings").upsert([
      { key: "mayar_api_key", value: mayarKey.trim(), updated_at: now },
      { key: "mayar_donation_amount", value: String(Number(mayarAmount) || 0), updated_at: now },
      { key: "mayar_donation_description", value: mayarDesc, updated_at: now },
    ]);
    setSavingMayar(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Pengaturan Mayar disimpan");
  };

  const saveSecrets = async () => {
    setSavingSecrets(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from("app_settings").upsert([
      { key: "mayar_webhook_secret", value: mayarWebhookSecret.trim(), updated_at: now },
      { key: "mpwa_webhook_secret", value: mpwaWebhookSecret.trim(), updated_at: now },
    ]);
    setSavingSecrets(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Webhook secret disimpan");
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin`);
  };

  const onPickFrame = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("File harus gambar (PNG transparan disarankan)"); return; }
    if (f.size > 8 * 1024 * 1024) { toast.error("Maks 8MB"); return; }
    setUploadingFrame(true);
    try {
      const ext = (f.name.split(".").pop() || "png").toLowerCase();
      const path = `frame-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("twibbon-assets").upload(path, f, {
        upsert: true, contentType: f.type,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("twibbon-assets").getPublicUrl(path);
      const url = `${data.publicUrl}?v=${Date.now()}`;
      const { error: sErr } = await supabase.from("app_settings").upsert({
        key: "twibbon_frame_url", value: url, updated_at: new Date().toISOString(),
      });
      if (sErr) throw sErr;
      setTwibbonFrameUrl(url);
      toast.success("Frame Twibbon berhasil diperbarui");
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal upload frame");
    } finally {
      setUploadingFrame(false);
      if (frameInputRef.current) frameInputRef.current.value = "";
    }
  };

  return (
    <AdminShell title="Pengaturan">
      {/* Countdown */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-accent" />
          <div className="font-semibold">Waktu Penutupan Pendaftaran (Countdown Landing)</div>
        </div>
        <p className="text-xs text-muted-foreground">Tanggal & waktu ini akan ditampilkan pada countdown di halaman utama.</p>
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <Input type="datetime-local" value={countdownTarget} onChange={(e) => setCountdownTarget(e.target.value)} className="max-w-xs" />
          <button onClick={saveCountdown} disabled={savingCountdown} className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-5 py-2.5 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60 w-fit">
            {savingCountdown ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Simpan Countdown
          </button>
        </div>
      </div>

      {/* Panduan URL */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-accent" />
          <div className="font-semibold">Link Panduan (Tombol "Panduan" di Landing)</div>
        </div>
        <p className="text-xs text-muted-foreground">
          URL tujuan ketika pengunjung menekan tombol <strong>Panduan</strong> pada hero halaman utama.
          Bisa berupa Google Drive / PDF / Notion. Kosongkan untuk default ke <code>#program</code>.
        </p>
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <Input
            type="url"
            value={panduanUrl}
            onChange={(e) => setPanduanUrl(e.target.value)}
            placeholder="https://drive.google.com/..."
            className="md:max-w-xl"
          />
          <button onClick={savePanduan} disabled={savingPanduan} className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-5 py-2.5 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60 w-fit">
            {savingPanduan ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Simpan Panduan
          </button>
        </div>
      </div>

      {/* Mayar settings */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <HeartHandshake className="size-4 text-accent" />
          <div className="font-semibold">Pengaturan Pembayaran Mayar (Donasi Peserta Lolos)</div>
        </div>
        <p className="text-xs text-muted-foreground">
          API Key didapat dari dashboard Mayar. Nominal & deskripsi akan tampil pada invoice peserta yang sudah dinyatakan <strong>lolos berkas administrasi</strong>.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Mayar API Key</label>
            <Input type="password" value={mayarKey} onChange={(e) => setMayarKey(e.target.value)} placeholder="Bearer key dari dashboard Mayar" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nominal Donasi (IDR)</label>
            <Input type="number" min={1000} value={mayarAmount} onChange={(e) => setMayarAmount(e.target.value)} placeholder="150000" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Deskripsi (Tampil di Invoice)</label>
          <textarea
            value={mayarDesc}
            onChange={(e) => setMayarDesc(e.target.value)}
            rows={3}
            className="w-full mt-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <button onClick={saveMayar} disabled={savingMayar} className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-5 py-2.5 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60">
          {savingMayar ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Simpan Pengaturan Mayar
        </button>
      </div>

      {/* Webhook URL */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Webhook className="size-4 text-accent" />
          <div className="font-semibold">Webhook Mayar (Notifikasi Pembayaran)</div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Salin URL di bawah ini, lalu tempelkan pada <strong>dashboard Mayar → Pengaturan → Webhook / Callback URL</strong>. 
          Setiap peserta yang menyelesaikan pembayaran akan otomatis ditandai <strong className="text-accent">Donasi Valid</strong> pada daftar peserta.
        </p>
        <div className="flex gap-2">
          <Input value={webhookUrl} readOnly className="font-mono text-xs" />
          <button
            onClick={() => copy(webhookUrl, "Webhook URL")}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald text-white px-4 py-2 text-sm font-semibold shrink-0 hover:bg-emerald-deep"
          >
            <Copy className="size-4" /> Salin
          </button>
        </div>
        <div className="text-xs text-muted-foreground bg-secondary/60 rounded-xl p-3 leading-relaxed">
          <strong className="text-foreground">Event yang ditangkap:</strong> <code>payment.received</code>, <code>invoice.paid</code>, atau status <code>paid / success / settled / completed</code>.
          Webhook mencocokkan invoice ID Mayar dengan peserta dan memperbarui status donasi.
        </div>
      </div>

      {/* Webhook Secrets */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <KeyRound className="size-4 text-accent" />
          <div className="font-semibold">Webhook Secrets (Keamanan Endpoint Publik)</div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Rahasia ini memverifikasi bahwa request webhook benar-benar berasal dari Mayar / MPWA, bukan attacker.
          Buat string acak yang panjang (minimal 32 karakter), simpan di sini, lalu daftarkan nilai yang sama pada masing-masing dashboard.
        </p>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Mayar Webhook Secret</label>
          <Input
            type="password"
            value={mayarWebhookSecret}
            onChange={(e) => setMayarWebhookSecret(e.target.value)}
            placeholder="String acak panjang untuk HMAC signature Mayar"
            className="font-mono text-xs"
          />
          <p className="text-[11px] text-muted-foreground">
            Di dashboard Mayar, set <strong>Webhook Secret</strong> dengan nilai yang sama. Mayar akan mengirim header <code>x-mayar-signature</code> berisi HMAC-SHA256 dari body.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-xs font-medium text-muted-foreground">MPWA Webhook Secret</label>
          <Input
            type="password"
            value={mpwaWebhookSecret}
            onChange={(e) => setMpwaWebhookSecret(e.target.value)}
            placeholder="String acak panjang untuk header X-MPWA-Secret"
            className="font-mono text-xs"
          />
          <p className="text-[11px] text-muted-foreground">
            URL webhook MPWA: <code className="break-all">{mpwaWebhookUrl}?secret=YOUR_SECRET</code>{" "}
            <button onClick={() => copy(`${mpwaWebhookUrl}?secret=${encodeURIComponent(mpwaWebhookSecret)}`, "URL Webhook MPWA")} className="text-accent underline ml-1">
              salin URL+secret
            </button>
          </p>
        </div>

        <button
          onClick={saveSecrets}
          disabled={savingSecrets}
          className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-5 py-2.5 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60"
        >
          {savingSecrets ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Simpan Webhook Secrets
        </button>
      </div>
    </AdminShell>
  );
}
