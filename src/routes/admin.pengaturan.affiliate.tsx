import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Link2, CheckCircle2, Loader2, Plus, Trash2, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/pengaturan/affiliate")({
  head: () => ({ meta: [{ title: "Affiliate Button — Safar Iman Admin" }] }),
  component: AffiliatePage,
});

type Target = { selector_id: string; label: string; enabled: boolean };
type Config = { enabled: boolean; url: string; ratio: number; targets: Target[] };

const DEFAULT_CFG: Config = { enabled: false, url: "", ratio: 3, targets: [] };

function AffiliatePage() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState<Config>(DEFAULT_CFG);
  const [stats, setStats] = useState<any>(null);

  const loadAll = async () => {
    const [{ data: c }, { data: s }] = await Promise.all([
      supabase.rpc("get_affiliate_config"),
      supabase.rpc("get_affiliate_stats", { p_days: 7 }),
    ]);
    const parsed: Config = {
      enabled: !!(c as any)?.enabled,
      url: String((c as any)?.url ?? ""),
      ratio: Number((c as any)?.ratio ?? 3) || 3,
      targets: Array.isArray((c as any)?.targets) ? (c as any).targets.map((t: any) => ({
        selector_id: String(t.selector_id ?? ""),
        label: String(t.label ?? ""),
        enabled: t.enabled !== false,
      })) : [],
    };
    setCfg(parsed);
    setStats(s);
    setLoading(false);
  };

  useEffect(() => { if (ready) loadAll(); }, [ready]);

  const save = async () => {
    if (cfg.enabled && !/^https?:\/\//i.test(cfg.url.trim())) {
      toast.error("URL affiliate harus diawali http(s)://");
      return;
    }
    if (cfg.ratio < 1) {
      toast.error("Rasio minimal 1");
      return;
    }
    const ids = cfg.targets.map((t) => t.selector_id.trim());
    if (ids.some((s) => !s)) {
      toast.error("Selector ID tombol tidak boleh kosong");
      return;
    }
    if (new Set(ids).size !== ids.length) {
      toast.error("Selector ID harus unik");
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc("admin_set_affiliate_config", {
      p_json: JSON.stringify({ ...cfg, url: cfg.url.trim(), targets: cfg.targets.map((t) => ({ ...t, selector_id: t.selector_id.trim() })) }),
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Konfigurasi affiliate disimpan");
    await loadAll();
  };

  const addTarget = () => setCfg({ ...cfg, targets: [...cfg.targets, { selector_id: "", label: "", enabled: true }] });
  const removeTarget = (i: number) => setCfg({ ...cfg, targets: cfg.targets.filter((_, idx) => idx !== i) });
  const updateTarget = (i: number, patch: Partial<Target>) =>
    setCfg({ ...cfg, targets: cfg.targets.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) });

  if (!ready || loading) return <AdminLoading />;

  const bySelector: Array<{ selector_id: string; clicks: number; triggered: number }> = stats?.by_selector ?? [];
  const byDay: Array<{ day: string; clicks: number; triggered: number }> = stats?.by_day ?? [];

  return (
    <AdminShell title="Affiliate Button">
      <Link to="/admin/pengaturan" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground -mt-3">
        <ArrowLeft className="size-4" /> Kembali ke Pengaturan
      </Link>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5 max-w-3xl">
        <div className="flex items-center gap-2">
          <Link2 className="size-5 text-emerald" />
          <div className="font-display text-lg font-semibold">Sistem Tombol Affiliate</div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Ketika aktif, setiap kelipatan <strong>N klik</strong> pada tombol terdaftar akan membuka
          link affiliate di tab baru. Klik berikutnya baru mengarahkan ke halaman tujuan asli.
          Perhitungan dilakukan di server berdasarkan total klik global lintas semua pengunjung.
        </p>

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <div className="text-sm font-medium">Aktifkan Affiliate</div>
            <div className="text-xs text-muted-foreground">Master switch untuk seluruh tombol terdaftar</div>
          </div>
          <Switch checked={cfg.enabled} onCheckedChange={(v) => setCfg({ ...cfg, enabled: v })} />
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">URL Affiliate (Shopee, dll)</label>
            <Input type="url" value={cfg.url} onChange={(e) => setCfg({ ...cfg, url: e.target.value })} placeholder="https://s.shopee.co.id/..." />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Rasio (setiap N klik)</label>
            <Input type="number" min={1} value={cfg.ratio} onChange={(e) => setCfg({ ...cfg, ratio: Math.max(1, parseInt(e.target.value || "1", 10)) })} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Daftar Tombol Target</label>
            <button onClick={addTarget} className="inline-flex items-center gap-1 text-xs text-emerald hover:underline">
              <Plus className="size-3.5" /> Tambah Tombol
            </button>
          </div>
          <div className="space-y-2">
            {cfg.targets.length === 0 && (
              <div className="text-xs text-muted-foreground italic">Belum ada tombol terdaftar.</div>
            )}
            {cfg.targets.map((t, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2 items-center border border-border rounded-lg p-2">
                <Input value={t.selector_id} onChange={(e) => updateTarget(i, { selector_id: e.target.value })} placeholder="selector_id (mis. hero_daftar)" />
                <Input value={t.label} onChange={(e) => updateTarget(i, { label: e.target.value })} placeholder="Label untuk admin" />
                <Switch checked={t.enabled} onCheckedChange={(v) => updateTarget(i, { enabled: v })} />
                <button onClick={() => removeTarget(i)} className="text-red-500 hover:text-red-600 p-2" aria-label="Hapus">
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Selector ID yang saat ini digunakan di halaman utama: <code>nav_daftar</code>, <code>hero_daftar</code>, <code>cta_daftar</code>.
          </p>
        </div>

        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-5 py-2.5 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Simpan Konfigurasi
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4 max-w-3xl">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-emerald" />
          <div className="font-display text-lg font-semibold">Statistik Klik</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-secondary/50 p-4">
            <div className="text-xs text-muted-foreground">Total Klik</div>
            <div className="text-2xl font-bold">{stats?.total_clicks ?? 0}</div>
          </div>
          <div className="rounded-lg bg-secondary/50 p-4">
            <div className="text-xs text-muted-foreground">Affiliate Terpicu</div>
            <div className="text-2xl font-bold">{stats?.total_triggered ?? 0}</div>
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">Per Tombol</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr><th className="py-1">Selector</th><th>Klik</th><th>Affiliate</th></tr>
              </thead>
              <tbody>
                {bySelector.length === 0 && <tr><td colSpan={3} className="py-2 text-xs text-muted-foreground italic">Belum ada data.</td></tr>}
                {bySelector.map((r) => (
                  <tr key={r.selector_id} className="border-t border-border">
                    <td className="py-1.5 font-mono text-xs">{r.selector_id}</td>
                    <td>{r.clicks}</td>
                    <td>{r.triggered}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">7 Hari Terakhir</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr><th className="py-1">Tanggal</th><th>Klik</th><th>Affiliate</th></tr>
              </thead>
              <tbody>
                {byDay.length === 0 && <tr><td colSpan={3} className="py-2 text-xs text-muted-foreground italic">Belum ada data.</td></tr>}
                {byDay.map((r) => (
                  <tr key={r.day} className="border-t border-border">
                    <td className="py-1.5">{r.day}</td>
                    <td>{r.clicks}</td>
                    <td>{r.triggered}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
