import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Download, DatabaseBackup, Bell } from "lucide-react";

export const Route = createFileRoute("/admin/pengaturan/backup")({
  head: () => ({ meta: [{ title: "Backup Database — Safar Iman Admin" }] }),
  component: BackupPage,
});

function BackupPage() {
  const ready = useAdminGuard();
  const [busy, setBusy] = useState(false);
  const [lastAt, setLastAt] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [days, setDays] = useState<number>(7);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key,value")
        .in("key", ["backup_last_at", "backup_reminder_enabled", "backup_reminder_days"]);
      const m = new Map((data ?? []).map((r: any) => [r.key, r.value]));
      setLastAt(m.get("backup_last_at") ?? null);
      setEnabled((m.get("backup_reminder_enabled") ?? "true") !== "false");
      const d = parseInt(m.get("backup_reminder_days") ?? "7", 10);
      setDays(Number.isFinite(d) && d > 0 ? d : 7);
    })();
  }, [ready]);

  async function downloadBackup() {
    setBusy(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) throw new Error("Sesi admin tidak ditemukan, silakan login ulang.");
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/admin-backup-database`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error(`Backup gagal (${res.status}): ${await res.text()}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `safariman-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      const now = new Date().toISOString();
      setLastAt(now);
      try {
        localStorage.setItem("admin_backup_last_at", now);
      } catch {}
      toast.success("Backup berhasil diunduh");
    } catch (e: any) {
      toast.error(e?.message ?? "Backup gagal");
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const rows = [
        { key: "backup_reminder_enabled", value: enabled ? "true" : "false" },
        { key: "backup_reminder_days", value: String(Math.max(1, Math.min(365, days))) },
      ];
      for (const r of rows) {
        const { error } = await supabase.rpc("admin_set_setting", {
          p_key: r.key,
          p_value: r.value,
        });
        if (error) throw error;
      }
      try {
        localStorage.setItem("admin_backup_reminder_enabled", enabled ? "true" : "false");
        localStorage.setItem("admin_backup_reminder_days", String(days));
      } catch {}
      toast.success("Pengaturan pengingat backup disimpan");
    } catch (e: any) {
      toast.error(e?.message ?? "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return <AdminLoading />;

  const lastFmt = lastAt ? new Date(lastAt).toLocaleString("id-ID") : "Belum pernah";

  return (
    <AdminShell title="Backup Database">
      <p className="text-sm text-muted-foreground -mt-3">
        Ekspor seluruh isi database (peserta, pengaturan, reminder, log email, dll) ke satu file JSON. Simpan file ini di penyimpanan aman sebagai cadangan.
      </p>

      <section className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-emerald/10 text-emerald grid place-items-center">
            <DatabaseBackup className="size-5" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold">Unduh Backup Sekarang</div>
            <div className="text-sm text-muted-foreground">Backup terakhir: {lastFmt}</div>
          </div>
        </div>
        <Button onClick={downloadBackup} disabled={busy} className="gap-2">
          <Download className="size-4" />
          {busy ? "Mempersiapkan..." : "Download Backup (.json)"}
        </Button>
      </section>

      <section className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-amber-500/10 text-amber-600 grid place-items-center">
            <Bell className="size-5" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold">Pengingat Backup saat Login</div>
            <div className="text-sm text-muted-foreground">
              Tampilkan notifikasi di dashboard admin bila backup terakhir sudah melebihi jumlah hari yang ditentukan.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border border-border rounded-xl px-4 py-3">
          <Label htmlFor="reminder-enabled" className="text-sm">
            Aktifkan pengingat
          </Label>
          <Switch id="reminder-enabled" checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="grid gap-2 max-w-xs">
          <Label htmlFor="reminder-days" className="text-sm">
            Tampilkan pengingat setelah (hari)
          </Label>
          <Input
            id="reminder-days"
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value || "7", 10))}
          />
          <p className="text-xs text-muted-foreground">
            Contoh: isi <b>7</b> agar pengingat muncul bila backup terakhir lebih dari 7 hari lalu.
          </p>
        </div>

        <Button onClick={saveSettings} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </section>
    </AdminShell>
  );
}
