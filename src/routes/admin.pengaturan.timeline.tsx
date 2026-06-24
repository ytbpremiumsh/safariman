import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUp, ArrowDown, CheckCircle2, Loader2, Plus, Trash2, ListOrdered, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";
import {
  DEFAULT_TIMELINE,
  TIMELINE_ICONS,
  type TimelineIconName,
  type TimelineStep,
  parseTimeline,
} from "@/lib/timeline";

export const Route = createFileRoute("/admin/pengaturan/timeline")({
  head: () => ({ meta: [{ title: "Timeline Program — Safar Iman Admin" }] }),
  component: TimelineSetting,
});

const ICON_OPTIONS = Object.keys(TIMELINE_ICONS) as TimelineIconName[];
const CTA_OPTIONS = ["", "/pendaftaran", "/twibbon", "/berkas", "/essay", "/kontribusi", "/sukses"];

function TimelineSetting() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<TimelineStep[]>(DEFAULT_TIMELINE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "timeline_config")
        .maybeSingle();
      setSteps(parseTimeline(data?.value));
      setLoading(false);
    })();
  }, [ready]);

  const patch = (idx: number, p: Partial<TimelineStep>) => {
    setSteps((s) => s.map((x, i) => (i === idx ? { ...x, ...p } : x)));
  };

  const move = (idx: number, dir: -1 | 1) => {
    setSteps((s) => {
      const next = [...s];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return s;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const remove = (idx: number) => setSteps((s) => s.filter((_, i) => i !== idx));

  const add = () =>
    setSteps((s) => [
      ...s,
      {
        icon: "ClipboardList",
        title: "Tahap Baru",
        desc: "Deskripsi singkat tahap ini",
        date: "Tanggal / Rentang",
      },
    ]);

  const resetDefaults = () => {
    if (!confirm("Yakin ingin mereset timeline ke konfigurasi bawaan?")) return;
    setSteps(DEFAULT_TIMELINE);
  };

  const save = async () => {
    const clean = steps
      .map((s) => ({
        icon: s.icon,
        title: s.title.trim(),
        desc: s.desc.trim(),
        date: s.date.trim(),
        ctaLabel: s.ctaLabel?.trim() || undefined,
        ctaTo: s.ctaTo?.trim() || undefined,
      }))
      .filter((s) => s.title);
    if (clean.length === 0) {
      toast.error("Minimal harus ada 1 tahap");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert({
      key: "timeline_config",
      value: JSON.stringify(clean),
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Timeline tersimpan");
  };

  if (!ready || loading) return <AdminLoading />;

  return (
    <AdminShell title="Timeline Program">
      <Link
        to="/admin/pengaturan"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground -mt-3"
      >
        <ArrowLeft className="size-4" /> Kembali ke Pengaturan
      </Link>

      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-2">
        <div className="flex items-center gap-2">
          <ListOrdered className="size-5 text-accent" />
          <div className="font-display text-lg font-semibold">Tahapan & Tanggal Timeline</div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Edit judul, deskripsi, dan tanggal/durasi tiap tahap timeline yang tampil di halaman utama.
          Tombol panah untuk mengubah urutan. Tombol <strong>+ Tambah Tahap</strong> di bawah untuk menambahkan tahap baru.
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((s, idx) => (
          <div
            key={idx}
            className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald/15 text-emerald text-[11px] font-bold">
                  {idx + 1}
                </span>
                <span className="font-medium">Tahap #{idx + 1}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="size-8 rounded-lg border border-border hover:bg-secondary grid place-items-center disabled:opacity-40"
                  title="Naik"
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  onClick={() => move(idx, 1)}
                  disabled={idx === steps.length - 1}
                  className="size-8 rounded-lg border border-border hover:bg-secondary grid place-items-center disabled:opacity-40"
                  title="Turun"
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  onClick={() => remove(idx)}
                  className="size-8 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 grid place-items-center"
                  title="Hapus"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Judul Tahap">
                <Input
                  value={s.title}
                  onChange={(e) => patch(idx, { title: e.target.value })}
                  placeholder="Pendaftaran Dibuka"
                />
              </Field>
              <Field label="Tanggal / Durasi">
                <Input
                  value={s.date}
                  onChange={(e) => patch(idx, { date: e.target.value })}
                  placeholder="25 Juni – 31 Agustus 2026"
                />
              </Field>
            </div>

            <Field label="Deskripsi">
              <Textarea
                value={s.desc}
                onChange={(e) => patch(idx, { desc: e.target.value })}
                rows={2}
                placeholder="Penjelasan singkat tahap ini"
              />
            </Field>

            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Ikon">
                <select
                  value={s.icon}
                  onChange={(e) => patch(idx, { icon: e.target.value as TimelineIconName })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </Field>
              <Field label="Label Tombol (opsional)">
                <Input
                  value={s.ctaLabel ?? ""}
                  onChange={(e) => patch(idx, { ctaLabel: e.target.value })}
                  placeholder="Daftar Sekarang"
                />
              </Field>
              <Field label="Link Tombol (opsional)">
                <select
                  value={s.ctaTo ?? ""}
                  onChange={(e) => patch(idx, { ctaTo: e.target.value || undefined })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {CTA_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt || "— tidak ada —"}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={add}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-4 py-2 text-sm font-semibold hover:bg-secondary"
        >
          <Plus className="size-4" /> Tambah Tahap
        </button>
        <button
          onClick={resetDefaults}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
        >
          <RotateCcw className="size-4" /> Reset ke Bawaan
        </button>
      </div>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-6 py-3 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Simpan Timeline
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
