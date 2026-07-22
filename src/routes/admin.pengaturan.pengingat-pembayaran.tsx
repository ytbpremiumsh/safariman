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
  has_berkas?: boolean;
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
  const [search, setSearch] = useState("");

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
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 max-w-4xl">
        <div className="flex items-center gap-2">
          <Mail className="size-5 text-accent" />
          <div className="font-display text-lg font-semibold">Template Email</div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Placeholder aktif per peserta: <code>{"{nama}"}</code>, <code>{"{kode}"}</code>, <code>{"{payment_url}"}</code> (Fast Track), <code>{"{donation_url}"}</code> (Kontribusi), <code>{"{url}"}</code> (otomatis sesuai jenis), <code>{"{button}"}</code> (tombol siap-klik hijau). Body mendukung <strong>HTML</strong>. Jika kamu tidak menaruh salah satu placeholder link/tombol, tombol otomatis ditambahkan di akhir email.
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Fast Track</div>
            <button type="button" onClick={() => setPreviewKind(previewKind === "fast_track" ? null : "fast_track")} className="text-xs text-accent hover:underline">
              {previewKind === "fast_track" ? "Tutup preview" : "Preview"}
            </button>
          </div>
          <Input value={templates.ft_subject} onChange={(e) => setTemplates(s => ({ ...s, ft_subject: e.target.value }))} placeholder="Subjek email Fast Track" />
          <textarea rows={8} value={templates.ft_body} onChange={(e) => setTemplates(s => ({ ...s, ft_body: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono" placeholder="Boleh teks biasa atau HTML" />
          {previewKind === "fast_track" && (
            <div className="rounded-xl border border-border bg-background p-4 text-sm">
              <div className="text-xs text-muted-foreground mb-2">Preview (contoh: nama = Ahmad, kode = HXP-DEMO1234)</div>
              <div dangerouslySetInnerHTML={{ __html: renderPreview(templates.ft_body, "fast_track") }} />
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Kontribusi</div>
            <button type="button" onClick={() => setPreviewKind(previewKind === "kontribusi" ? null : "kontribusi")} className="text-xs text-accent hover:underline">
              {previewKind === "kontribusi" ? "Tutup preview" : "Preview"}
            </button>
          </div>
          <Input value={templates.kt_subject} onChange={(e) => setTemplates(s => ({ ...s, kt_subject: e.target.value }))} placeholder="Subjek email Kontribusi" />
          <textarea rows={8} value={templates.kt_body} onChange={(e) => setTemplates(s => ({ ...s, kt_body: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono" placeholder="Boleh teks biasa atau HTML" />
          {previewKind === "kontribusi" && (
            <div className="rounded-xl border border-border bg-background p-4 text-sm">
              <div className="text-xs text-muted-foreground mb-2">Preview (contoh: nama = Ahmad, kode = HXP-DEMO1234)</div>
              <div dangerouslySetInnerHTML={{ __html: renderPreview(templates.kt_body, "kontribusi") }} />
            </div>
          )}
        </div>
        <button onClick={() => saveSettings(auto, templates)} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-5 py-2.5 text-sm font-semibold hover-lift disabled:opacity-60">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Simpan Template
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => { setTab("fast_track"); setPage(1); }} className={`px-4 py-1.5 rounded-full text-sm font-semibold ${tab === "fast_track" ? "bg-accent text-white" : "bg-secondary text-foreground"}`}>
            Fast Track ({items.filter(i => i.fast_track_unpaid).length})
          </button>
          <button onClick={() => { setTab("kontribusi"); setPage(1); }} className={`px-4 py-1.5 rounded-full text-sm font-semibold ${tab === "kontribusi" ? "bg-accent text-white" : "bg-secondary text-foreground"}`}>
            Kontribusi ({items.filter(i => i.kontribusi_unpaid).length})
          </button>
          <button onClick={load} className="ml-auto text-xs text-muted-foreground hover:text-foreground">Refresh</button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <div>
            Total <strong className="text-foreground">{filtered.length}</strong> peserta belum {tab === "fast_track" ? "bayar Fast Track" : "kontribusi"}.
          </div>
          <div className="flex items-center gap-2">
            <span>Per halaman:</span>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="rounded-md border border-border bg-background px-2 py-1 text-xs">
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
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
              {paged.map(item => {
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="text-muted-foreground">
              Halaman {currentPage} dari {totalPages} • Menampilkan {paged.length} dari {filtered.length}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={currentPage === 1} className="rounded-md border border-border px-2 py-1 disabled:opacity-40">« Awal</button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-md border border-border px-2 py-1 disabled:opacity-40">‹ Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-md border border-border px-2 py-1 disabled:opacity-40">Next ›</button>
              <button onClick={() => setPage(totalPages)} disabled={currentPage === totalPages} className="rounded-md border border-border px-2 py-1 disabled:opacity-40">Akhir »</button>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function looksLikeHtml(s: string) { return /<\/?[a-z][\s\S]*>/i.test(s || ""); }
function escHtml(s: string) { return (s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function renderPreview(tpl: string, kind: "fast_track" | "kontribusi") {
  const demoUrl = "https://mayar.link/payment/demo-1234";
  const label = kind === "fast_track" ? "Bayar Fast Track Sekarang" : "Kontribusi Sekarang";
  const button = `<div style="margin:20px 0;text-align:center"><a href="${demoUrl}" style="display:inline-block;padding:12px 28px;background:#059669;color:#ffffff;text-decoration:none;border-radius:9999px;font-weight:600;font-family:Arial,sans-serif">${label}</a></div>`;
  const filled = (tpl || "")
    .replace(/\{nama\}/g, "Ahmad")
    .replace(/\{kode\}/g, "HXP-DEMO1234")
    .replace(/\{payment_url\}/g, demoUrl)
    .replace(/\{donation_url\}/g, demoUrl)
    .replace(/\{url\}/g, demoUrl)
    .replace(/\{button\}/g, button);
  let html = looksLikeHtml(filled) ? filled : escHtml(filled).replace(/\n/g, "<br/>");
  // Unescape the button when template was plain text (button contains raw HTML we need to keep).
  if (!looksLikeHtml(tpl || "")) {
    html = html.replace(/&lt;div style=&quot;margin:20px[\s\S]*?&lt;\/div&gt;/g, button);
  }
  const mentionsAction = /\{(button|url|payment_url|donation_url)\}/.test(tpl || "");
  if (!mentionsAction) html += button;
  return html;
}
