import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUp, ArrowDown, CheckCircle2, HelpCircle, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";
import { DEFAULT_FAQ, FAQ_CATEGORIES, parseFaqConfig, type FaqItem } from "@/lib/faq";

export const Route = createFileRoute("/admin/pengaturan/faq")({
  head: () => ({ meta: [{ title: "Halaman FAQ — Safar Iman Admin" }] }),
  component: FaqSetting,
});

function FaqSetting() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [items, setItems] = useState<FaqItem[]>(DEFAULT_FAQ);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data } = await supabase.rpc("get_faq_config");
      const cfg = parseFaqConfig(data);
      setEnabled(cfg.enabled);
      setItems(cfg.items);
      setLoading(false);
    })();
  }, [ready]);

  const patch = (idx: number, p: Partial<FaqItem>) =>
    setItems((s) => s.map((x, i) => (i === idx ? { ...x, ...p } : x)));

  const move = (idx: number, dir: -1 | 1) =>
    setItems((s) => {
      const next = [...s];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return s;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });

  const remove = (idx: number) => setItems((s) => s.filter((_, i) => i !== idx));

  const add = () =>
    setItems((s) => [
      ...s,
      { category: "Umum", q: "Pertanyaan baru", a: "Jawaban untuk pertanyaan ini." },
    ]);

  const resetDefaults = () => {
    if (!confirm("Reset semua FAQ ke konfigurasi bawaan? Perubahan kamu akan hilang.")) return;
    setItems(DEFAULT_FAQ);
  };

  const save = async () => {
    const clean = items
      .map((s) => ({
        category: (s.category || "Umum").trim(),
        q: s.q.trim(),
        a: s.a.trim(),
      }))
      .filter((s) => s.q && s.a);
    if (clean.length === 0) {
      toast.error("Minimal harus ada 1 pertanyaan");
      return;
    }
    setSaving(true);
    const r1 = await supabase.rpc("admin_set_setting", {
      p_key: "faq_enabled",
      p_value: enabled ? "true" : "false",
    });
    const r2 = await supabase.rpc("admin_set_setting", {
      p_key: "faq_items",
      p_value: JSON.stringify(clean),
    });
    setSaving(false);
    if (r1.error || r2.error) {
      toast.error(r1.error?.message || r2.error?.message || "Gagal menyimpan");
      return;
    }
    toast.success("Pengaturan FAQ tersimpan");
  };

  if (!ready || loading) return <AdminLoading />;

  return (
    <AdminShell title="Halaman FAQ">
      <Link
        to="/admin/pengaturan"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground -mt-3"
      >
        <ArrowLeft className="size-4" /> Kembali ke Pengaturan
      </Link>

      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="size-5 text-emerald" />
          <div className="font-display text-lg font-semibold">Halaman FAQ Publik</div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Aktifkan untuk menampilkan halaman <code>/faq</code> yang berisi daftar pertanyaan & jawaban
          seputar pendaftaran, berkas, essay, timeline, benefit, dan kontribusi.
          Jika dinonaktifkan, pengunjung akan diarahkan ke beranda.
        </p>
        <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
          <div>
            <div className="text-sm font-semibold">Aktifkan halaman /faq</div>
            <div className="text-xs text-muted-foreground">Status saat ini: {enabled ? "Aktif" : "Nonaktif"}</div>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/faq"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary"
          >
            Buka halaman /faq
          </Link>
          <button
            onClick={resetDefaults}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary"
          >
            <RotateCcw className="size-3.5" /> Reset ke Bawaan
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((s, idx) => (
          <div key={idx} className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald/15 text-emerald text-[11px] font-bold">
                  {idx + 1}
                </span>
                <span className="font-medium">FAQ #{idx + 1}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => move(idx, -1)} disabled={idx === 0} className="size-8 rounded-lg border border-border hover:bg-secondary grid place-items-center disabled:opacity-40" title="Naik">
                  <ArrowUp className="size-4" />
                </button>
                <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1} className="size-8 rounded-lg border border-border hover:bg-secondary grid place-items-center disabled:opacity-40" title="Turun">
                  <ArrowDown className="size-4" />
                </button>
                <button onClick={() => remove(idx)} className="size-8 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 grid place-items-center" title="Hapus">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-[1fr_2fr] gap-3">
              <Field label="Kategori">
                <select
                  value={s.category || "Umum"}
                  onChange={(e) => patch(idx, { category: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {FAQ_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Pertanyaan">
                <Input value={s.q} onChange={(e) => patch(idx, { q: e.target.value })} placeholder="Contoh: Bagaimana cara mendaftar?" />
              </Field>
            </div>

            <Field label="Jawaban">
              <Textarea value={s.a} onChange={(e) => patch(idx, { a: e.target.value })} rows={3} placeholder="Tulis jawaban lengkap di sini" />
            </Field>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={add} className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-4 py-2 text-sm font-semibold hover:bg-secondary">
          <Plus className="size-4" /> Tambah FAQ
        </button>
      </div>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-6 py-3 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Simpan FAQ
        </button>
      </div>
    </AdminShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
