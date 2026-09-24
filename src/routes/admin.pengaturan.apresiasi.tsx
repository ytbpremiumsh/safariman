import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/pengaturan/apresiasi")({
  head: () => ({ meta: [{ title: "Apresiasi Peserta — Safar Iman Admin" }] }),
  component: ApresiasiSetting,
});

const KEYS = [
  "apresiasi_heading",
  "apresiasi_description",
  "apresiasi_kelas_link",
  "apresiasi_kelas_tanggal",
  "apresiasi_kelas_title",
  "apresiasi_kelas_speaker",
  "apresiasi_kelas_speaker_desc",
  "apresiasi_kajian_link",
  "apresiasi_kajian_tanggal",
  "apresiasi_kajian_title",
  "apresiasi_kajian_speaker",
  "apresiasi_kajian_speaker_desc",
  "apresiasi_sertifikat_link",
  "apresiasi_sertifikat_title",
  "apresiasi_sertifikat_desc",
  "apresiasi_rekaman_link",
  "apresiasi_rekaman_title",
  "apresiasi_rekaman_desc",
];

const DEFAULTS: Record<string, string> = {
  apresiasi_heading: "Apresiasi & Benefit untuk Peserta",
  apresiasi_description:
    "Tidak ada proses yang sia-sia. Walaupun belum lolos ke tahap berikutnya, Anda tetap mendapatkan kelas online, kajian, akses rekaman, dan E-Sertifikat sebagai bentuk apresiasi atas usaha yang telah diberikan.",
  apresiasi_kelas_title: "Sekolah Tamu Allah: Bedah Persiapan Umrohmu, Kembali dengan Mabrur",
  apresiasi_kelas_speaker: "Ustadz Ahmad Fauzan, Lc.",
  apresiasi_kelas_speaker_desc: "Pembimbing Manasik & Praktisi Umrah",
  apresiasi_kajian_title: "Mengenal Sirah Haramain: Bekal Sebelum ke Baitullah",
  apresiasi_kajian_speaker: "Ustadz Hilman Al Hazmi, Lc.",
  apresiasi_kajian_speaker_desc: "Alumni Syariah Islamiyyah Al Azhar University",
  apresiasi_sertifikat_title: "E-Sertifikat Resmi",
  apresiasi_sertifikat_desc: "Sertifikat digital setelah menyelesaikan kelas",
  apresiasi_rekaman_title: "Akses Rekaman",
  apresiasi_rekaman_desc: "Tonton ulang kapan saja.",
};

function ApresiasiSetting() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [v, setV] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data } = await supabase.from("app_settings").select("key,value").in("key", KEYS);
      const map = Object.fromEntries(
        (data ?? []).map((r: { key: string; value: string | null }) => [r.key, r.value ?? ""]),
      );
      setV(Object.fromEntries(KEYS.map((k) => [k, map[k] ?? DEFAULTS[k] ?? ""])));
      setLoading(false);
    })();
  }, [ready]);

  const save = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    const rows = KEYS.map((k) => ({ key: k, value: v[k] ?? "", updated_at: now }));
    const { error } = await supabase.from("app_settings").upsert(rows);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Pengaturan apresiasi disimpan");
  };

  const upd = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));
  const updText = (k: string) => (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  if (!ready || loading) return <AdminLoading />;

  return (
    <AdminShell title="Apresiasi Peserta">
      <Link
        to="/admin/pengaturan"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground -mt-3"
      >
        <ArrowLeft className="size-4" /> Kembali ke Pengaturan
      </Link>

      <div className="rounded-xl bg-emerald/5 border border-emerald/20 p-4 text-sm text-muted-foreground leading-relaxed max-w-3xl">
        Atur tanggal pelaksanaan &amp; link untuk{" "}
        <strong className="text-foreground">Kelas Online</strong>,{" "}
        <strong className="text-foreground">Kajian Sirah</strong>,{" "}
        <strong className="text-foreground">E-Sertifikat</strong>, dan{" "}
        <strong className="text-foreground">Akses Rekaman</strong>. Bila link dikosongkan, akan
        tampil sebagai <em>Coming Soon</em> di halaman Kontribusi &amp; Cek Tahapan.
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5 max-w-3xl">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-accent" />
          <div className="font-display text-lg font-semibold">Judul Benefit Peserta</div>
        </div>
        <Field label="Judul" value={v.apresiasi_heading} onChange={upd("apresiasi_heading")} />
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Keterangan</label>
          <Textarea
            rows={4}
            value={v.apresiasi_description ?? ""}
            onChange={updText("apresiasi_description")}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5 max-w-3xl">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-accent" />
          <div className="font-display text-lg font-semibold">
            Kelas Online — Sekolah Tamu Allah
          </div>
        </div>
        <Field
          label="Judul Kelas"
          value={v.apresiasi_kelas_title}
          onChange={upd("apresiasi_kelas_title")}
        />
        <Field
          label="Nama Pemateri"
          value={v.apresiasi_kelas_speaker}
          onChange={upd("apresiasi_kelas_speaker")}
        />
        <Field
          label="Keterangan Pemateri"
          value={v.apresiasi_kelas_speaker_desc}
          onChange={upd("apresiasi_kelas_speaker_desc")}
        />
        <Field
          label="Tanggal Pelaksanaan"
          type="datetime-local"
          value={v.apresiasi_kelas_tanggal}
          onChange={upd("apresiasi_kelas_tanggal")}
        />
        <Field
          label="Link Acara (Zoom / YouTube / dll)"
          value={v.apresiasi_kelas_link}
          onChange={upd("apresiasi_kelas_link")}
          placeholder="https://..."
        />
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5 max-w-3xl">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-accent" />
          <div className="font-display text-lg font-semibold">Kajian — Mengenal Sirah Haramain</div>
        </div>
        <Field
          label="Judul Kajian"
          value={v.apresiasi_kajian_title}
          onChange={upd("apresiasi_kajian_title")}
        />
        <Field
          label="Nama Pemateri"
          value={v.apresiasi_kajian_speaker}
          onChange={upd("apresiasi_kajian_speaker")}
        />
        <Field
          label="Keterangan Pemateri"
          value={v.apresiasi_kajian_speaker_desc}
          onChange={upd("apresiasi_kajian_speaker_desc")}
        />
        <Field
          label="Tanggal Pelaksanaan"
          type="datetime-local"
          value={v.apresiasi_kajian_tanggal}
          onChange={upd("apresiasi_kajian_tanggal")}
        />
        <Field
          label="Link Acara"
          value={v.apresiasi_kajian_link}
          onChange={upd("apresiasi_kajian_link")}
          placeholder="https://..."
        />
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5 max-w-3xl">
        <div className="font-display text-lg font-semibold">Benefit Tambahan</div>
        <Field
          label="Judul Sertifikat"
          value={v.apresiasi_sertifikat_title}
          onChange={upd("apresiasi_sertifikat_title")}
        />
        <Field
          label="Keterangan Sertifikat"
          value={v.apresiasi_sertifikat_desc}
          onChange={upd("apresiasi_sertifikat_desc")}
        />
        <Field
          label="Link E-Sertifikat"
          value={v.apresiasi_sertifikat_link}
          onChange={upd("apresiasi_sertifikat_link")}
          placeholder="Kosongkan untuk Coming Soon"
        />
        <Field
          label="Judul Rekaman"
          value={v.apresiasi_rekaman_title}
          onChange={upd("apresiasi_rekaman_title")}
        />
        <Field
          label="Keterangan Rekaman"
          value={v.apresiasi_rekaman_desc}
          onChange={upd("apresiasi_rekaman_desc")}
        />
        <Field
          label="Link Akses Rekaman"
          value={v.apresiasi_rekaman_link}
          onChange={upd("apresiasi_rekaman_link")}
          placeholder="Kosongkan untuk Coming Soon"
        />
      </div>

      <div className="max-w-3xl">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-5 py-2.5 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}{" "}
          Simpan Pengaturan
        </button>
      </div>
    </AdminShell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input type={type} value={value ?? ""} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}
