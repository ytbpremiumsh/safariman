import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BellRing, CheckCircle2, Loader2, Send, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/pengaturan/pengingat-pembayaran")({
  head: () => ({ meta: [{ title: "Pengingat Pembayaran — Safar Iman Admin" }] }),
  component: PengingatPembayaran,
});

type Item = {
  id: string;
  registration_code: string;
  full_name: string;
  email: string | null;
  whatsapp: string | null;
  category: string | null;
  created_at: string;
  fast_track_unpaid: boolean;
  kontribusi_unpaid: boolean;
  fast_track_reminder_count: number;
  kontribusi_reminder_count: number;
  last_fast_track_reminder_at: string | null;
  last_kontribusi_reminder_at: string | null;
};

type Templates = { ft_subject: string; ft_body: string; kt_subject: string; kt_body: string };

function PengingatPembayaran() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [auto, setAuto] = useState(false);
  const [templates, setTemplates] = useState<Templates>({ ft_subject: "", ft_body: "", kt_subject: "", kt_body: "" });
  const [sendingId, setSendingId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"fast_track" | "kontribusi">("fast_track");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [previewKind, setPreviewKind] = useState<"fast_track" | "kontribusi" | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("payment-reminder", { body: { action: "list" } });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (!data?.ok) { toast.error(data?.error ?? "Gagal memuat"); return; }
    setItems(data.items ?? []);
    setAuto(!!data.auto_enabled);
    setTemplates(data.templates);
  }

  useEffect(() => { if (ready) load(); }, [ready]);

  const saveSettings = async (nextAuto = auto, nextTemplates = templates) => {
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("payment-reminder", {
      body: { action: "save-settings", auto_enabled: nextAuto, templates: nextTemplates },
    });
    setSaving(false);
    if (error || !data?.ok) { toast.error(error?.message ?? data?.error ?? "Gagal menyimpan"); return; }
    toast.success("Pengaturan disimpan");
  };

  const toggleAuto = async (v: boolean) => {
    setAuto(v);
    await saveSettings(v, templates);
  };

  const sendManual = async (item: Item, kind: "fast_track" | "kontribusi") => {
    setSendingId(`${item.id}-${kind}`);
    const { data, error } = await supabase.functions.invoke("payment-reminder", {
      body: { action: "send-manual", participant_id: item.id, kind },
    });
    setSendingId("");
    if (error || !data?.ok) { toast.error(error?.message ?? data?.error ?? "Gagal kirim"); return; }
    toast.success(`Pengingat ${kind === "fast_track" ? "Fast Track" : "Kontribusi"} terkirim`);
    load();
  };

  if (!ready || loading) return <AdminLoading />;

  const filtered = items.filter(i => tab === "fast_track" ? i.fast_track_unpaid : i.kontribusi_unpaid);

  return (
    <AdminShell title="Pengingat Pembayaran">
      <Link to="/admin/pengaturan" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground -mt-3">
        <ArrowLeft className="size-4" /> Kembali ke Pengaturan
      </Link>

      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 max-w-3xl">
        <div className="flex items-start gap-3">
          <BellRing className="size-5 text-accent mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="font-display text-lg font-semibold">Pengingat Otomatis</div>
            <p className="text-sm text-muted-foreground leading-relaxed mt-1">
              Jika aktif, sistem mengirim pengingat email bertahap pada <strong>H+1, H+3, dan H+7</strong> sejak pendaftaran ke peserta yang belum bayar Fast Track / belum kontribusi. Maksimal <strong>3x</strong> per peserta, lalu berhenti otomatis.
            </p>
          </div>
          <Switch checked={auto} onCheckedChange={toggleAuto} disabled={saving} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 max-w-3xl">
        <div className="flex items-center gap-2">
          <Mail className="size-5 text-accent" />
          <div className="font-display text-lg font-semibold">Template Email</div>
        </div>
        <p className="text-xs text-muted-foreground">Placeholder: <code>{"{nama}"}</code>, <code>{"{kode}"}</code></p>
        <div className="space-y-3">
          <div className="text-sm font-semibold">Fast Track</div>
          <Input value={templates.ft_subject} onChange={(e) => setTemplates(s => ({ ...s, ft_subject: e.target.value }))} placeholder="Subjek email Fast Track" />
          <textarea rows={5} value={templates.ft_body} onChange={(e) => setTemplates(s => ({ ...s, ft_body: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono" />
        </div>
        <div className="space-y-3">
          <div className="text-sm font-semibold">Kontribusi</div>
          <Input value={templates.kt_subject} onChange={(e) => setTemplates(s => ({ ...s, kt_subject: e.target.value }))} placeholder="Subjek email Kontribusi" />
          <textarea rows={5} value={templates.kt_body} onChange={(e) => setTemplates(s => ({ ...s, kt_body: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono" />
        </div>
        <button onClick={() => saveSettings(auto, templates)} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-5 py-2.5 text-sm font-semibold hover-lift disabled:opacity-60">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Simpan Template
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setTab("fast_track")} className={`px-4 py-1.5 rounded-full text-sm font-semibold ${tab === "fast_track" ? "bg-accent text-white" : "bg-secondary text-foreground"}`}>
            Fast Track ({items.filter(i => i.fast_track_unpaid).length})
          </button>
          <button onClick={() => setTab("kontribusi")} className={`px-4 py-1.5 rounded-full text-sm font-semibold ${tab === "kontribusi" ? "bg-accent text-white" : "bg-secondary text-foreground"}`}>
            Kontribusi ({items.filter(i => i.kontribusi_unpaid).length})
          </button>
          <button onClick={load} className="ml-auto text-xs text-muted-foreground hover:text-foreground">Refresh</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground border-b border-border">
              <tr>
                <th className="py-2 pr-3">Peserta</th>
                <th className="py-2 pr-3">Kategori</th>
                <th className="py-2 pr-3">Daftar</th>
                <th className="py-2 pr-3">Reminder Terkirim</th>
                <th className="py-2 pr-3">Terakhir</th>
                <th className="py-2 pr-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Tidak ada peserta yang perlu diingatkan.</td></tr>
              )}
              {filtered.map(item => {
                const count = tab === "fast_track" ? item.fast_track_reminder_count : item.kontribusi_reminder_count;
                const last = tab === "fast_track" ? item.last_fast_track_reminder_at : item.last_kontribusi_reminder_at;
                const busy = sendingId === `${item.id}-${tab}`;
                return (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="py-2 pr-3">
                      <div className="font-semibold">{item.full_name}</div>
                      <div className="text-xs text-muted-foreground">{item.registration_code} • {item.email}</div>
                    </td>
                    <td className="py-2 pr-3 text-xs">{item.category ?? "-"}</td>
                    <td className="py-2 pr-3 text-xs">{new Date(item.created_at).toLocaleDateString("id-ID")}</td>
                    <td className="py-2 pr-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${count > 0 ? "bg-emerald/10 text-emerald" : "bg-secondary text-muted-foreground"}`}>
                        {count}/3
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">{last ? new Date(last).toLocaleString("id-ID") : "—"}</td>
                    <td className="py-2 pr-3 text-right">
                      <button onClick={() => sendManual(item, tab)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full bg-accent text-white px-3 py-1.5 text-xs font-semibold hover-lift disabled:opacity-60">
                        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />} Kirim
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
