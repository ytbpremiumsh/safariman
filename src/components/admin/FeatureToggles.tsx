import { useEffect, useState } from "react";
import { Brain, MessageSquare, Bell, Database, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { isFeatureEnabled, toggleFeature } from "@/lib/features";
import { toast } from "sonner";

const FEATURES = [
  { key: "ai_grading_enabled", label: "AI Essay Grading", icon: Brain, desc: "Koreksi essay otomatis menggunakan AI" },
  { key: "wa_ai_reply_enabled", label: "WA AI Auto-Reply", icon: MessageSquare, desc: "Balas pesan WhatsApp otomatis dengan AI" },
  { key: "payment_reminders_enabled", label: "Pengingat Pembayaran", icon: Bell, desc: "Email pengingat pembayaran otomatis" },
  { key: "db_backup_reminder_enabled", label: "Pengingat Backup DB", icon: Database, desc: "Notifikasi pengingat backup database" },
];

export function FeatureToggles() {
  const [states, setStates] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const results = await Promise.all(
        FEATURES.map(async (f) => ({ key: f.key, enabled: await isFeatureEnabled(f.key as any) }))
      );
      const map: Record<string, boolean> = {};
      results.forEach(r => map[r.key] = r.enabled);
      setStates(map);
      setLoading(false);
    }
    init();
  }, []);

  const handleToggle = async (key: string, val: boolean) => {
    setBusy(key);
    const { error } = await toggleFeature(key, val);
    setBusy(null);
    if (error) {
      toast.error("Gagal mengubah status fitur");
      return;
    }
    setStates(prev => ({ ...prev, [key]: val }));
    toast.success(`${FEATURES.find(f => f.key === key)?.label} ${val ? 'Diaktifkan' : 'Dinonaktifkan'}`);
  };

  if (loading) return null;

  return (
    <section className="bg-card border border-border rounded-2xl p-5 mb-6">
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold">Kontrol Fitur Kredit</h2>
        <p className="text-xs text-muted-foreground">Nonaktifkan fitur yang mengonsumsi kredit Lovable saat tidak diperlukan.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          const isEnabled = states[f.key] || false;
          return (
            <div key={f.key} className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/20">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isEnabled ? 'bg-emerald/10 text-emerald' : 'bg-muted text-muted-foreground'}`}>
                  <Icon className="size-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">{f.label}</div>
                  <div className="text-[10px] text-muted-foreground line-clamp-1">{f.desc}</div>
                </div>
              </div>
              {busy === f.key ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : (
                <Switch 
                  checked={isEnabled} 
                  onCheckedChange={(val) => handleToggle(f.key, val)} 
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
