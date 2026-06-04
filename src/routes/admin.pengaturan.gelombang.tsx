import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  parseGelombangConfig,
  formatRupiah,
  isSlotActive,
  type GelombangConfig,
  type GelombangSlot,
} from "@/lib/gelombang";

export const Route = createFileRoute("/admin/pengaturan/gelombang")({
  head: () => ({ meta: [{ title: "Pengaturan Gelombang — Safar Iman Admin" }] }),
  component: PengaturanGelombang,
});

type SlotKey = keyof GelombangConfig;

const ORDER: { key: SlotKey; tag: string }[] = [
  { key: "reguler", tag: "Jalur Gratis" },
  { key: "gelombang_1", tag: "Berbayar — Gelombang 1" },
  { key: "gelombang_2", tag: "Berbayar — Gelombang 2" },
];

function PengaturanGelombang() {
  const ready = useAdminGuard();
  const [cfg, setCfg] = useState<GelombangConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "gelombang_config")
        .maybeSingle();
      setCfg(parseGelombangConfig(data?.value));
    })();
  }, [ready]);

  if (!ready || !cfg) return <AdminLoading />;

  const updateSlot = (key: SlotKey, patch: Partial<GelombangSlot>) => {
    setCfg((c) => (c ? { ...c, [key]: { ...c[key], ...patch } } : c));
  };

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "gelombang_config", value: JSON.stringify(cfg) }, { onConflict: "key" });
      if (error) throw error;
      toast.success("Pengaturan gelombang disimpan");
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell title="Gelombang Pendaftaran">
      <div className="rounded-2xl bg-emerald/5 border border-emerald/20 p-4 text-sm text-muted-foreground -mt-2">
        Atur nama, tanggal, harga, dan keterangan untuk tiap jalur pendaftaran. Jalur akan otomatis nonaktif di
        luar rentang tanggal atau saat toggle dimatikan.
      </div>

      <div className="space-y-5">
        {ORDER.map(({ key, tag }) => {
          const slot = cfg[key];
          const active = isSlotActive(slot);
          return (
            <div key={key} className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-accent font-semibold">{tag}</div>
                  <div className="font-display text-xl font-semibold mt-1">{slot.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatRupiah(slot.price)} ·{" "}
                    <span className={active ? "text-emerald font-medium" : "text-muted-foreground"}>
                      {active ? "Aktif sekarang" : "Tidak aktif"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">Aktif</span>
                  <Switch
                    checked={slot.enabled}
                    onCheckedChange={(v) => updateSlot(key, { enabled: !!v })}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Nama Gelombang</Label>
                  <Input value={slot.name} onChange={(e) => updateSlot(key, { name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Harga (Rp) — 0 untuk gratis</Label>
                  <Input
                    type="number"
                    min={0}
                    value={slot.price}
                    onChange={(e) => updateSlot(key, { price: Math.max(0, Number(e.target.value || 0)) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Tanggal Mulai</Label>
                  <Input type="date" value={slot.start} onChange={(e) => updateSlot(key, { start: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Tanggal Selesai</Label>
                  <Input type="date" value={slot.end} onChange={(e) => updateSlot(key, { end: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Keterangan / Syarat (1 baris = 1 poin)</Label>
                <Textarea
                  rows={5}
                  value={slot.description}
                  onChange={(e) => updateSlot(key, { description: e.target.value })}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-3 z-10">
        <div className="rounded-2xl border border-accent/40 bg-card/95 backdrop-blur p-4 flex items-center justify-between shadow-soft">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Sparkles className="size-4 text-accent" />
            Perubahan langsung diterapkan di halaman <code>/pendaftaran</code>.
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-emerald text-accent px-6 py-2.5 text-sm font-bold shadow-emerald hover-lift disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </AdminShell>
  );
}
