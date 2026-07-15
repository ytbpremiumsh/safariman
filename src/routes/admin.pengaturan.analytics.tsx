import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/pengaturan/analytics")({
  head: () => ({ meta: [{ title: "Google Analytics — Safar Iman Admin" }] }),
  component: AnalyticsSetting,
});

function AnalyticsSetting() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "ga_measurement_id")
        .maybeSingle();
      setId(data?.value ?? "");
      setLoading(false);
    })();
  }, [ready]);

  const save = async () => {
    const v = id.trim();
    if (v && !/^G-[A-Z0-9]{6,}$/i.test(v) && !/^UA-\d+-\d+$/i.test(v)) {
      toast.error("Format ID tidak valid. Contoh: G-XXXXXXXXXX");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert({
      key: "ga_measurement_id",
      value: v,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("ID Google Analytics disimpan. Reload halaman publik untuk melihat efeknya.");
  };

  if (!ready || loading) return <AdminLoading />;

  return (
    <AdminShell title="Google Analytics">
      <Link
        to="/admin/pengaturan"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground -mt-3"
      >
        <ArrowLeft className="size-4" /> Kembali ke Pengaturan
      </Link>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4 max-w-2xl">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-accent" />
          <div className="font-display text-lg font-semibold">Google Analytics 4 (GA4)</div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Masukkan <strong>Measurement ID</strong> GA4 (format <code>G-XXXXXXXXXX</code>).
          Skrip pelacakan otomatis akan dipasang di seluruh halaman publik. Kosongkan untuk menonaktifkan.
        </p>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Measurement ID</label>
          <Input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="G-XXXXXXXXXX"
          />
          <p className="text-[11px] text-muted-foreground">
            Dapatkan dari Google Analytics → Admin → Aliran Data → detail aliran web Anda.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-5 py-2.5 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          Simpan
        </button>
      </div>
    </AdminShell>
  );
}
