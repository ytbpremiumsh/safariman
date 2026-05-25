import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/pengaturan/countdown")({
  head: () => ({ meta: [{ title: "Countdown — Safar Iman Admin" }] }),
  component: CountdownSetting,
});

function CountdownSetting() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data } = await supabase.from("app_settings").select("key,value")
        .in("key", ["countdown_target", "countdown_enabled"]);
      const map = Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value ?? ""]));
      const raw = map.countdown_target ?? "";
      if (raw) {
        const d = new Date(raw);
        if (!Number.isNaN(d.getTime())) {
          const pad = (n: number) => String(n).padStart(2, "0");
          setTarget(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
        }
      }
      setEnabled((map.countdown_enabled ?? "true") !== "false");
      setLoading(false);
    })();
  }, [ready]);

  const save = async () => {
    if (!target) { toast.error("Pilih tanggal & waktu"); return; }
    setSaving(true);
    const iso = new Date(target).toISOString();
    const now = new Date().toISOString();
    const { error } = await supabase.from("app_settings").upsert([
      { key: "countdown_target", value: iso, updated_at: now },
      { key: "countdown_enabled", value: enabled ? "true" : "false", updated_at: now },
    ]);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Pengaturan countdown disimpan");
  };

  const toggle = async (next: boolean) => {
    setEnabled(next);
    const { error } = await supabase.from("app_settings").upsert({
      key: "countdown_enabled", value: next ? "true" : "false", updated_at: new Date().toISOString(),
    });
    if (error) { toast.error(error.message); setEnabled(!next); return; }
    toast.success(next ? "Countdown diaktifkan" : "Countdown dinonaktifkan");
  };

  if (!ready || loading) return <AdminLoading />;

  return (
    <AdminShell title="Countdown Landing">
      <Link to="/admin/pengaturan" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground -mt-3">
        <ArrowLeft className="size-4" /> Kembali ke Pengaturan
      </Link>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5 max-w-2xl">
        <div className="flex items-center gap-2">
          <Clock className="size-5 text-accent" />
          <div className="font-display text-lg font-semibold">Waktu Penutupan Pendaftaran</div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Tanggal & waktu ini akan ditampilkan pada countdown di halaman utama.
        </p>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3">
          <div>
            <div className="text-sm font-medium">Tampilkan Countdown di Landing</div>
            <div className="text-xs text-muted-foreground">
              {enabled ? "Aktif — section countdown ditampilkan." : "Nonaktif — section countdown disembunyikan."}
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={toggle} />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Target Tanggal & Waktu</label>
          <Input type="datetime-local" value={target} onChange={(e) => setTarget(e.target.value)} className="max-w-xs" />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-5 py-2.5 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Simpan Countdown
        </button>
      </div>
    </AdminShell>
  );
}
