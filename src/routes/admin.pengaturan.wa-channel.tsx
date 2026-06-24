import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/pengaturan/wa-channel")({
  head: () => ({ meta: [{ title: "Link Saluran WhatsApp — Safar Iman Admin" }] }),
  component: WaChannelSetting,
});

function WaChannelSetting() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "wa_channel_url")
        .maybeSingle();
      setUrl(data?.value ?? "");
      setLoading(false);
    })();
  }, [ready]);

  const save = async () => {
    const v = url.trim();
    if (v && !/^https?:\/\//i.test(v)) {
      toast.error("URL harus diawali http(s)://");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert({
      key: "wa_channel_url",
      value: v,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Link Saluran WhatsApp disimpan");
  };

  if (!ready || loading) return <AdminLoading />;

  return (
    <AdminShell title="Link Saluran WhatsApp">
      <Link
        to="/admin/pengaturan"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground -mt-3"
      >
        <ArrowLeft className="size-4" /> Kembali ke Pengaturan
      </Link>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4 max-w-2xl">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-5 text-emerald" />
          <div className="font-display text-lg font-semibold">Link Saluran WhatsApp</div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Link ini akan ditampilkan sebagai ajakan <strong>Gabung Saluran WhatsApp</strong> di
          seluruh halaman sukses pendaftaran (Daftar Reguler, Self Funded, Fast Track,
          Konfirmasi Pembayaran, dan Status Pendaftaran).
        </p>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">URL Saluran</label>
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://whatsapp.com/channel/..."
          />
          <p className="text-[11px] text-muted-foreground">
            Contoh: <code>https://whatsapp.com/channel/0029VbCxSnICxoAwuDDdCt1Q</code>
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-5 py-2.5 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Simpan Link
        </button>
      </div>
    </AdminShell>
  );
}
