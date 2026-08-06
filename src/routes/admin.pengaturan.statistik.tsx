import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3, CheckCircle2, Copy, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/pengaturan/statistik")({
  head: () => ({ meta: [{ title: "Halaman Statistik — Safar Iman Admin" }] }),
  component: StatistikSetting,
});

function StatistikSetting() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [pw, setPw] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "stats_password")
        .maybeSingle();
      setPw(data?.value ?? "");
      setLoading(false);
    })();
  }, [ready]);

  const save = async () => {
    const v = pw.trim();
    if (v && v.length < 4) {
      toast.error("Password minimal 4 karakter");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert({
      key: "stats_password",
      value: v,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(v ? "Password statistik disimpan" : "Halaman statistik dinonaktifkan");
  };

  const url = `${window.location.origin}/statistik`;

  if (!ready || loading) return <AdminLoading />;

  return (
    <AdminShell title="Halaman Statistik">
      <Link
        to="/admin/pengaturan"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground -mt-3"
      >
        <ArrowLeft className="size-4" /> Kembali ke Pengaturan
      </Link>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4 max-w-2xl">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-accent" />
          <div className="font-display text-lg font-semibold">Statistik Berpassword</div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Halaman <code>/statistik</code> menampilkan angka statistik pendaftaran & kontribusi secara
          realtime. Siapa pun yang punya password bisa membukanya tanpa akun admin. Kosongkan
          password untuk menonaktifkan halaman.
        </p>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Password Halaman Statistik</label>
          <Input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="mis. safar2026" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-5 py-2.5 text-sm font-semibold hover-lift disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Simpan Password
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(url);
              toast.success("Link disalin");
            }}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm hover:border-accent/50 transition"
          >
            <Copy className="size-4" /> Salin Link
          </button>
          <a
            href="/statistik"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm hover:border-accent/50 transition"
          >
            <ExternalLink className="size-4" /> Buka Halaman
          </a>
        </div>
      </div>
    </AdminShell>
  );
}
