import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Loader2, ExternalLink, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/pengaturan/hasil-seleksi")({
  head: () => ({ meta: [{ title: "Pengumuman Hasil Seleksi — Safar Iman Admin" }] }),
  component: HasilSeleksiSettings,
});

type Form = {
  enabled: boolean;
  revealAt: string; // ISO string or ""
  title: string;
  subtitle: string;
  lolos: string;
  tidakLolos: string;
  pending: string;
  disabled: string;
  autoLolos: boolean;
};

const KEYS = {
  enabled: "hasil_seleksi_enabled",
  revealAt: "hasil_reveal_at",
  title: "hasil_page_title",
  subtitle: "hasil_page_subtitle",
  lolos: "hasil_text_lolos",
  tidakLolos: "hasil_text_tidak_lolos",
  pending: "hasil_text_pending",
  disabled: "hasil_text_disabled",
  autoLolos: "auto_lolos_enabled",
} as const;


// Convert ISO ↔ datetime-local input value (local timezone).
function isoToLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function localInputToIso(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  return isNaN(d.getTime()) ? "" : d.toISOString();
}

function HasilSeleksiSettings() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>({
    enabled: false, revealAt: "", title: "", subtitle: "", lolos: "", tidakLolos: "", pending: "", disabled: "",
  });

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", Object.values(KEYS));
      const map = new Map((data ?? []).map((r) => [r.key, r.value ?? ""]));
      setForm({
        enabled: (map.get(KEYS.enabled) ?? "false") === "true",
        revealAt: map.get(KEYS.revealAt) ?? "",
        title: map.get(KEYS.title) ?? "",
        subtitle: map.get(KEYS.subtitle) ?? "",
        lolos: map.get(KEYS.lolos) ?? "",
        tidakLolos: map.get(KEYS.tidakLolos) ?? "",
        pending: map.get(KEYS.pending) ?? "",
        disabled: map.get(KEYS.disabled) ?? "",
      });
      setLoading(false);
    })();
  }, [ready]);

  const save = async () => {
    setSaving(true);
    const rows = [
      { key: KEYS.enabled, value: form.enabled ? "true" : "false" },
      { key: KEYS.revealAt, value: form.revealAt },
      { key: KEYS.title, value: form.title },
      { key: KEYS.subtitle, value: form.subtitle },
      { key: KEYS.lolos, value: form.lolos },
      { key: KEYS.tidakLolos, value: form.tidakLolos },
      { key: KEYS.pending, value: form.pending },
      { key: KEYS.disabled, value: form.disabled },
    ];
    const { error } = await supabase.from("app_settings").upsert(rows, { onConflict: "key" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Pengaturan disimpan");
  };

  if (!ready || loading) return <AdminLoading />;

  return (
    <AdminShell title="Pengumuman Hasil Seleksi">
      <Link to="/admin/pengaturan" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground -mt-2">
        <ArrowLeft className="size-3.5" /> Kembali ke Pengaturan
      </Link>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-display text-lg font-semibold">Status Halaman</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aktifkan ketika sudah siap mengumumkan. Saat nonaktif, peserta hanya melihat pesan tunggu.
            </p>
          </div>
          <button
            onClick={() => setForm((f) => ({ ...f, enabled: !f.enabled }))}
            className={
              "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition " +
              (form.enabled ? "bg-emerald text-white" : "bg-secondary text-foreground border border-border")
            }
          >
            {form.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            {form.enabled ? "Aktif" : "Nonaktif"}
          </button>
        </div>

        <div className="border-t border-border pt-4">
          <label className="block text-sm font-medium mb-1">Jadwal Otomatis Aktif (Tanggal &amp; Waktu)</label>
          <p className="text-xs text-muted-foreground mb-2">
            Halaman akan otomatis aktif pada tanggal &amp; waktu ini (zona waktu perangkat). Biarkan kosong untuk hanya menggunakan toggle manual di atas. Jika toggle sudah Aktif, halaman tetap tampil tanpa menunggu jadwal.
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <Input
              type="datetime-local"
              value={isoToLocalInput(form.revealAt)}
              onChange={(e) => setForm({ ...form, revealAt: localInputToIso(e.target.value) })}
              className="max-w-xs"
            />
            {form.revealAt && (
              <button
                type="button"
                onClick={() => setForm({ ...form, revealAt: "" })}
                className="text-xs px-3 py-2 rounded-md border border-border hover:bg-secondary"
              >
                Hapus jadwal
              </button>
            )}
          </div>
          {form.revealAt && (
            <p className="text-xs text-emerald mt-2">
              Akan aktif otomatis: <strong>{new Date(form.revealAt).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" })}</strong>
            </p>
          )}
        </div>

        <div className="text-xs bg-secondary/40 rounded-lg p-3 flex items-center justify-between gap-3">
          <span>URL Halaman Publik:</span>
          <a href="/cek-hasil" target="_blank" rel="noreferrer" className="font-mono text-accent inline-flex items-center gap-1 hover:underline">
            /cek-hasil <ExternalLink className="size-3" />
          </a>
        </div>
      </div>


      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="font-display text-lg font-semibold">Header Halaman</div>
        <Field label="Judul">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Subjudul">
          <Textarea rows={2} value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
        </Field>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="font-display text-lg font-semibold">Pesan untuk Peserta</div>
        <Field label="Pesan jika LOLOS (lanjut TPA / LDS)" hint="Tampil saat status peserta = Lanjut TPA/LDS atau Lolos.">
          <Textarea rows={5} value={form.lolos} onChange={(e) => setForm({ ...form, lolos: e.target.value })} />
        </Field>
        <Field label="Pesan jika TIDAK LOLOS" hint="Tampil saat status peserta = Belum Lolos.">
          <Textarea rows={5} value={form.tidakLolos} onChange={(e) => setForm({ ...form, tidakLolos: e.target.value })} />
        </Field>
        <Field label="Pesan jika BELUM DIPUTUSKAN" hint="Tampil saat status peserta masih Menunggu/Direview.">
          <Textarea rows={3} value={form.pending} onChange={(e) => setForm({ ...form, pending: e.target.value })} />
        </Field>
        <Field label="Pesan jika halaman NONAKTIF" hint="Tampil saat toggle di atas dimatikan.">
          <Textarea rows={3} value={form.disabled} onChange={(e) => setForm({ ...form, disabled: e.target.value })} />
        </Field>
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-gradient-emerald text-accent px-5 py-2.5 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Simpan Pengaturan
        </button>
      </div>
    </AdminShell>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {hint && <p className="text-xs text-muted-foreground mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}
