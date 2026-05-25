import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/pengaturan/panduan")({
  head: () => ({ meta: [{ title: "Link Panduan — Safar Iman Admin" }] }),
  component: PanduanSetting,
});

function PanduanSetting() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data } = await supabase.from("app_settings").select("value").eq("key", "panduan_url").maybeSingle();
      setUrl(data?.value ?? "");
      setLoading(false);
    })();
  }, [ready]);

  const save = async () => {
    const v = url.trim();
    if (v && !/^https?:\/\//i.test(v) && !v.startsWith("#") && !v.startsWith("/")) {
      toast.error("URL harus diawali http(s)://, /, atau #");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert({
      key: "panduan_url", value: v, updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Link Panduan disimpan");
  };

  if (!ready || loading) return <AdminLoading />;

  return (
    <AdminShell title="Link Panduan">
      <Link to="/admin/pengaturan" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground -mt-3">
        <ArrowLeft className="size-4" /> Kembali ke Pengaturan
      </Link>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4 max-w-2xl">
        <div className="flex items-center gap-2">
          <BookOpen className="size-5 text-accent" />
          <div className="font-display text-lg font-semibold">Tombol "Panduan" di Landing</div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          URL tujuan ketika pengunjung menekan tombol <strong>Panduan</strong> pada hero halaman utama.
          Bisa berupa Google Drive / PDF / Notion. Kosongkan untuk default ke <code>#program</code>.
        </p>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">URL Panduan</label>
          <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://drive.google.com/..." />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-5 py-2.5 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Simpan Panduan
        </button>
      </div>
    </AdminShell>
  );
}
