import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Link2, CheckCircle2, Loader2, BarChart3, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/pengaturan/affiliate")({
  head: () => ({ meta: [{ title: "Affiliate Button — Safar Iman Admin" }] }),
  component: AffiliatePage,
});

type Target = { selector_id: string; label: string; enabled: boolean };
type UrlEntry = { label: string; url: string; enabled: boolean };
type Config = { enabled: boolean; url: string; urls: UrlEntry[]; ratio: number; targets: Target[] };

// Preset katalog tombol yang tersedia untuk affiliate, dikelompokkan per halaman.
// Selector ID tersembunyi dari admin — cukup pilih tombol lewat checkbox.
type Preset = { selector_id: string; label: string };
type PresetGroup = { page: string; buttons: Preset[] };

const PRESET_GROUPS: PresetGroup[] = [
  {
    page: "Halaman Utama",
    buttons: [
      { selector_id: "nav_daftar", label: "Navbar — Daftar Sekarang" },
      { selector_id: "hero_daftar", label: "Hero — Daftar Sekarang" },
      { selector_id: "cta_daftar", label: "CTA Bawah — Daftar Sekarang" },
    ],
  },
  {
    page: "Halaman Twibbon & Poster",
    buttons: [
      { selector_id: "twibbon_download", label: "Download Twibbon" },
      { selector_id: "poster_download", label: "Download Poster" },
      { selector_id: "caption_copy", label: "Salin Caption" },
    ],
  },
];

const ALL_PRESETS: Preset[] = PRESET_GROUPS.flatMap((g) => g.buttons);
const PRESET_LABEL = new Map(ALL_PRESETS.map((p) => [p.selector_id, p.label]));

const DEFAULT_CFG: Config = { enabled: false, url: "", urls: [], ratio: 3, targets: [] };

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
    const rawUrls = Array.isArray((c as any)?.urls) ? (c as any).urls : [];
    const parsedUrls: UrlEntry[] = rawUrls.map((u: any) => ({
      label: String(u?.label ?? ""),
      url: String(u?.url ?? ""),
      enabled: u?.enabled !== false,
    }));
    // Migrate legacy single url into urls array if urls empty
    const legacyUrl = String((c as any)?.url ?? "");
    if (parsedUrls.length === 0 && legacyUrl) {
      parsedUrls.push({ label: "Link Utama", url: legacyUrl, enabled: true });
    }
    const parsed: Config = {
      enabled: !!(c as any)?.enabled,
      url: legacyUrl,
      urls: parsedUrls,
      ratio: Number((c as any)?.ratio ?? 3) || 3,
      targets: Array.isArray((c as any)?.targets)
        ? (c as any).targets.map((t: any) => ({
            selector_id: String(t.selector_id ?? ""),
            label: String(t.label ?? PRESET_LABEL.get(String(t.selector_id ?? "")) ?? ""),
            enabled: t.enabled !== false,
          }))
        : [],
    };
    setCfg(parsed);
    setStats(s);
    setLoading(false);
  };

  useEffect(() => {
    if (ready) loadAll();
  }, [ready]);

  const isChecked = (selId: string) => cfg.targets.some((t) => t.selector_id === selId && t.enabled);

  const toggleTarget = (preset: Preset, checked: boolean) => {
    const others = cfg.targets.filter((t) => t.selector_id !== preset.selector_id);
    setCfg({
      ...cfg,
      targets: checked
        ? [...others, { selector_id: preset.selector_id, label: preset.label, enabled: true }]
        : others,
    });
  };

  const updateUrl = (i: number, patch: Partial<UrlEntry>) => {
    const next = cfg.urls.slice();
    next[i] = { ...next[i], ...patch };
    setCfg({ ...cfg, urls: next });
  };
  const addUrl = () => setCfg({ ...cfg, urls: [...cfg.urls, { label: "", url: "", enabled: true }] });
  const removeUrl = (i: number) => setCfg({ ...cfg, urls: cfg.urls.filter((_, idx) => idx !== i) });

  const save = async () => {
    const cleaned = cfg.urls
      .map((u) => ({ ...u, label: u.label.trim(), url: u.url.trim() }))
      .filter((u) => u.url.length > 0);
    if (cfg.enabled) {
      const activeOk = cleaned.some((u) => u.enabled && /^https?:\/\//i.test(u.url));
      if (!activeOk) {
        toast.error("Minimal satu URL affiliate aktif dan diawali http(s)://");
        return;
      }
      for (const u of cleaned) {
        if (u.enabled && !/^https?:\/\//i.test(u.url)) {
          toast.error(`URL "${u.label || u.url}" harus diawali http(s)://`);
          return;
        }
      }
    }
    if (cfg.ratio < 1) {
      toast.error("Rasio minimal 1");
      return;
    }
    setSaving(true);
    const payload = {
      ...cfg,
      urls: cleaned,
      // keep legacy 'url' field for backward compat (first active url)
      url: cleaned.find((u) => u.enabled)?.url ?? cleaned[0]?.url ?? "",
    };
    const { error } = await supabase.rpc("admin_set_affiliate_config", {
      p_json: JSON.stringify(payload),
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Konfigurasi affiliate disimpan");
    await loadAll();
  };

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
          Ketika aktif, setiap kelipatan <strong>N klik</strong> pada tombol terpilih akan membuka
          link affiliate di tab baru. Klik berikutnya baru mengarahkan ke halaman tujuan asli.
          Perhitungan dilakukan di server berdasarkan total klik global lintas semua pengunjung.
        </p>

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <div className="text-sm font-medium">Aktifkan Affiliate</div>
            <div className="text-xs text-muted-foreground">Master switch untuk seluruh tombol terpilih</div>
          </div>
          <Switch checked={cfg.enabled} onCheckedChange={(v) => setCfg({ ...cfg, enabled: v })} />
        </div>

        <div className="space-y-1 max-w-[200px]">
          <label className="text-xs font-medium text-muted-foreground">Rasio (setiap N klik)</label>
          <Input type="number" min={1} value={cfg.ratio} onChange={(e) => setCfg({ ...cfg, ratio: Math.max(1, parseInt(e.target.value || "1", 10)) })} />
          <p className="text-[11px] text-muted-foreground">Contoh: 3 = setiap klik ke-3 memicu link affiliate.</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Daftar URL Affiliate</label>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Tambahkan beberapa link (Shopee, TikTok, dll). Saat terpicu, sistem akan bergiliran (round-robin) memakai link yang aktif.
              </p>
            </div>
            <button type="button" onClick={addUrl} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary">
              <Plus className="size-3.5" /> Tambah Link
            </button>
          </div>

          {cfg.urls.length === 0 && (
            <div className="text-xs text-muted-foreground italic border border-dashed border-border rounded-lg p-3 text-center">
              Belum ada link. Klik "Tambah Link" untuk mulai.
            </div>
          )}

          <div className="space-y-2">
            {cfg.urls.map((u, i) => (
              <div key={i} className="flex gap-2 items-start border border-border rounded-lg p-2.5">
                <div className="flex-1 grid sm:grid-cols-5 gap-2">
                  <Input
                    className="sm:col-span-2"
                    placeholder="Label (opsional, contoh: Shopee 1)"
                    value={u.label}
                    onChange={(e) => updateUrl(i, { label: e.target.value })}
                  />
                  <Input
                    className="sm:col-span-3"
                    type="url"
                    placeholder="https://s.shopee.co.id/..."
                    value={u.url}
                    onChange={(e) => updateUrl(i, { url: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-1.5">
                  <Switch checked={u.enabled} onCheckedChange={(v) => updateUrl(i, { enabled: v })} />
                  <button type="button" onClick={() => removeUrl(i)} className="text-muted-foreground hover:text-destructive p-1" aria-label="Hapus">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tombol Target</label>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Pilih tombol yang akan mengaktifkan link affiliate. Kelompok per halaman.
            </p>
          </div>

          <div className="space-y-4">
            {PRESET_GROUPS.map((group) => (
              <div key={group.page} className="border border-border rounded-lg p-3 space-y-2">
                <div className="text-sm font-semibold">{group.page}</div>
                <div className="space-y-1.5">
                  {group.buttons.map((btn) => (
                    <label
                      key={btn.selector_id}
                      className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-secondary/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={isChecked(btn.selector_id)}
                        onCheckedChange={(v) => toggleTarget(btn, v === true)}
                      />
                      <span className="text-sm">{btn.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
                <tr><th className="py-1">Tombol</th><th>Klik</th><th>Affiliate</th></tr>
              </thead>
              <tbody>
                {bySelector.length === 0 && <tr><td colSpan={3} className="py-2 text-xs text-muted-foreground italic">Belum ada data.</td></tr>}
                {bySelector.map((r) => (
                  <tr key={r.selector_id} className="border-t border-border">
                    <td className="py-1.5">{PRESET_LABEL.get(r.selector_id) ?? r.selector_id}</td>
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
