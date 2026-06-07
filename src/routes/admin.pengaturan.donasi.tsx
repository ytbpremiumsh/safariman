import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Copy, HeartHandshake, KeyRound, Loader2, Webhook } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/pengaturan/donasi")({
  head: () => ({ meta: [{ title: "Donasi & Pembayaran — Safar Iman Admin" }] }),
  component: DonasiSetting,
});

function DonasiSetting() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);

  const [mayarKey, setMayarKey] = useState("");
  const [mayarAmount, setMayarAmount] = useState("150000");
  const [mayarDesc, setMayarDesc] = useState("");
  const [savingMayar, setSavingMayar] = useState(false);

  const [webhookUrl, setWebhookUrl] = useState("");
  const [mayarWebhookSecret, setMayarWebhookSecret] = useState("");
  const [savingSecret, setSavingSecret] = useState(false);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data } = await supabase.from("app_settings").select("key,value")
        .in("key", ["mayar_api_key", "mayar_donation_amount", "mayar_donation_description", "mayar_webhook_secret"]);
      const map = Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value ?? ""]));
      setMayarKey(map.mayar_api_key ?? "");
      setMayarAmount(map.mayar_donation_amount ?? "150000");
      setMayarDesc(map.mayar_donation_description ?? "Kontribusi peserta untuk mendukung operasional program, kegiatan sosial, berbagi makanan, wakaf Al-Qur'an, dan keberlangsungan kegiatan Safar Iman.");
      setMayarWebhookSecret(map.mayar_webhook_secret ?? "");
      const { edgeFunctionUrl } = await import("@/lib/api");
      setWebhookUrl(edgeFunctionUrl("mayar-webhook"));
      setLoading(false);
    })();
  }, [ready]);

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

  const saveSecret = async () => {
    setSavingSecret(true);
    const { error } = await supabase.from("app_settings").upsert({
      key: "mayar_webhook_secret", value: mayarWebhookSecret.trim(), updated_at: new Date().toISOString(),
    });
    setSavingSecret(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Webhook secret disimpan");
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin`);
  };

  if (!ready || loading) return <AdminLoading />;

  return (
    <AdminShell title="Donasi & Pembayaran Mayar">
      <Link to="/admin/pengaturan" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground -mt-3">
        <ArrowLeft className="size-4" /> Kembali ke Pengaturan
      </Link>

      <div className="rounded-xl bg-emerald/5 border border-emerald/20 p-4 text-sm text-muted-foreground leading-relaxed max-w-3xl">
        <strong className="text-foreground">Catatan:</strong> Selain melalui Mayar, admin juga bisa <strong>menerima donasi secara manual</strong> per peserta
        dari halaman <Link to="/admin/peserta" className="text-accent underline">Daftar Peserta</Link> → klik <em>Detail</em> → tombol <em>Tandai Donasi Valid</em>.
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4 max-w-3xl">
        <div className="flex items-center gap-2">
          <HeartHandshake className="size-5 text-accent" />
          <div className="font-display text-lg font-semibold">Pengaturan Pembayaran Mayar</div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          API Key didapat dari dashboard Mayar. Nominal & deskripsi akan tampil pada invoice peserta yang sudah dinyatakan <strong>lolos berkas administrasi</strong>.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Mayar API Key</label>
            <Input type="password" value={mayarKey} onChange={(e) => setMayarKey(e.target.value)} placeholder="Bearer key dari dashboard Mayar" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Nominal Donasi (IDR)</label>
            <Input type="number" min={1000} value={mayarAmount} onChange={(e) => setMayarAmount(e.target.value)} placeholder="150000" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Deskripsi (Tampil di Invoice)</label>
          <textarea
            value={mayarDesc}
            onChange={(e) => setMayarDesc(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={saveMayar}
          disabled={savingMayar}
          className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-5 py-2.5 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60"
        >
          {savingMayar ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Simpan Pengaturan Mayar
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4 max-w-3xl">
        <div className="flex items-center gap-2">
          <Webhook className="size-5 text-accent" />
          <div className="font-display text-lg font-semibold">Webhook Mayar (Notifikasi Pembayaran)</div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Salin URL di bawah ini, lalu tempelkan pada <strong>dashboard Mayar → Pengaturan → Webhook / Callback URL</strong>.
          Setiap peserta yang menyelesaikan pembayaran akan otomatis ditandai <strong className="text-accent">Donasi Valid</strong>.
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
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4 max-w-3xl">
        <div className="flex items-center gap-2">
          <KeyRound className="size-5 text-accent" />
          <div className="font-display text-lg font-semibold">Mayar Webhook Secret</div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Rahasia ini memverifikasi bahwa request webhook benar-benar dari Mayar, bukan attacker.
          Buat string acak panjang (min 32 karakter), simpan di sini, lalu daftarkan nilai yang sama di dashboard Mayar.
        </p>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Webhook Secret</label>
          <Input
            type="password"
            value={mayarWebhookSecret}
            onChange={(e) => setMayarWebhookSecret(e.target.value)}
            placeholder="String acak panjang untuk HMAC signature Mayar"
            className="font-mono text-xs"
          />
          <p className="text-[11px] text-muted-foreground">
            Mayar akan mengirim header <code>x-mayar-signature</code> berisi HMAC-SHA256 dari body.
          </p>
        </div>
        <button
          onClick={saveSecret}
          disabled={savingSecret}
          className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-5 py-2.5 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60"
        >
          {savingSecret ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Simpan Webhook Secret
        </button>
      </div>
    </AdminShell>
  );
}
