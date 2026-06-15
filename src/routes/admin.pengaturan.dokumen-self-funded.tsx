import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, Eye, FileText, Loader2, Save, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";
import { DOC_KEYS, DOC_DEFAULTS, DOC_META, downloadDoc, getDocBlobUrl, type DocKind, type DocSettings } from "@/lib/selfFundedDocs";

export const Route = createFileRoute("/admin/pengaturan/dokumen-self-funded")({
  head: () => ({ meta: [{ title: "Dokumen Self Funded — Safar Iman Admin" }] }),
  component: DokumenSelfFundedSettings,
});

function DokumenSelfFundedSettings() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<DocSettings>(DOC_DEFAULTS);
  const sigRef = useRef<HTMLInputElement>(null);
  const stampRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"sig" | "stamp" | null>(null);
  const [price, setPrice] = useState<string>("50000");
  const [paidEnabled, setPaidEnabled] = useState<boolean>(true);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key,value")
        .in("key", [...Object.values(DOC_KEYS), "self_funded_price", "self_funded_paid_enabled"]);
      const map = new Map((data ?? []).map((r) => [r.key as string, (r.value as string) ?? ""]));
      const next: DocSettings = { ...DOC_DEFAULTS };
      (Object.keys(DOC_KEYS) as Array<keyof typeof DOC_KEYS>).forEach((k) => {
        const v = map.get(DOC_KEYS[k]);
        if (v) (next as any)[k] = v;
      });
      setForm(next);
      const p = map.get("self_funded_price");
      if (p) setPrice(p);
      const pe = map.get("self_funded_paid_enabled");
      setPaidEnabled(pe !== "false");
      setLoading(false);
    })();
  }, [ready]);

  const upd = <K extends keyof DocSettings>(k: K, v: DocSettings[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const rows: Array<{ key: string; value: string; updated_at: string }> = (
        Object.keys(DOC_KEYS) as Array<keyof typeof DOC_KEYS>
      ).map((k) => ({
        key: DOC_KEYS[k],
        value: (form as any)[k] ?? "",
        updated_at: new Date().toISOString(),
      }));
      const cleanPrice = String(Math.max(0, Number(String(price).replace(/[^0-9]/g, "")) || 0));
      rows.push({ key: "self_funded_price", value: cleanPrice, updated_at: new Date().toISOString() });
      rows.push({ key: "self_funded_paid_enabled", value: paidEnabled ? "true" : "false", updated_at: new Date().toISOString() });
      const { error } = await supabase.from("app_settings").upsert(rows);
      if (error) throw error;
      toast.success("Pengaturan dokumen disimpan");
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const uploadImg = async (file: File, kind: "sig" | "stamp") => {
    if (!file.type.startsWith("image/")) {
      toast.error("File harus gambar");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Maks 4MB");
      return;
    }
    setUploading(kind);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${kind}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("document-assets")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("document-assets").getPublicUrl(path);
      const url = `${data.publicUrl}?v=${Date.now()}`;
      if (kind === "sig") upd("signatureUrl", url);
      else upd("stampUrl", url);
      toast.success("Gambar diupload — jangan lupa klik Simpan");
    } catch (e: any) {
      toast.error(e?.message || "Gagal upload");
    } finally {
      setUploading(null);
    }
  };

  if (!ready || loading) return <AdminLoading />;

  return (
    <AdminShell title="Dokumen Self Funded">
      <Link
        to="/admin/pengaturan"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground -mt-3"
      >
        <ArrowLeft className="size-4" /> Kembali ke Pengaturan
      </Link>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5 max-w-3xl">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-accent" />
          <div className="font-display text-lg font-semibold">Identitas Penandatangan</div>
        </div>
        <p className="text-sm text-muted-foreground -mt-2">
          Nama, jabatan, tanda tangan, dan stempel ini akan tampil pada keempat dokumen yang
          diunduh peserta jalur Self Funded (LOA, Panduan Pembayaran, Form Konfirmasi Kehadiran,
          dan Surat Pengantar Proposal).
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nama Penandatangan">
            <input
              value={form.signerName}
              onChange={(e) => upd("signerName", e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Jabatan">
            <input
              value={form.signerPosition}
              onChange={(e) => upd("signerPosition", e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Nama Organisasi (Kop)">
            <input
              value={form.orgName}
              onChange={(e) => upd("orgName", e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Alamat / Sekretariat (Kop)">
            <input
              value={form.orgAddress}
              onChange={(e) => upd("orgAddress", e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <div className="border-t border-border pt-5">
          <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            Biaya Pendaftaran Self Funded (Mayar)
          </div>
          <div className="flex items-center gap-2 max-w-sm">
            <span className="text-sm text-muted-foreground">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
              placeholder="50000"
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Nominal yang ditagihkan via Mayar saat peserta memilih jalur Self Funded di halaman <code>/pendaftaran</code>.
          </p>
        </div>


        <div className="grid sm:grid-cols-2 gap-4">
          <ImageUpload
            label="Tanda Tangan (PNG transparan)"
            url={form.signatureUrl}
            uploading={uploading === "sig"}
            onPick={() => sigRef.current?.click()}
            onClear={() => upd("signatureUrl", "")}
          />
          <input
            ref={sigRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadImg(f, "sig");
              if (sigRef.current) sigRef.current.value = "";
            }}
          />
          <ImageUpload
            label="Stempel (PNG transparan)"
            url={form.stampUrl}
            uploading={uploading === "stamp"}
            onPick={() => stampRef.current?.click()}
            onClear={() => upd("stampUrl", "")}
          />
          <input
            ref={stampRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadImg(f, "stamp");
              if (stampRef.current) stampRef.current.value = "";
            }}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5 max-w-3xl">
        <div className="font-display text-lg font-semibold">Isi Teks Dokumen</div>
        <BodyField
          label="Letter of Acceptance (LOA)"
          value={form.loaBody}
          onChange={(v) => upd("loaBody", v)}
        />
        <BodyField
          label="Panduan Pembayaran"
          value={form.paymentBody}
          onChange={(v) => upd("paymentBody", v)}
        />
        <BodyField
          label="Form Konfirmasi Kehadiran"
          value={form.attendanceBody}
          onChange={(v) => upd("attendanceBody", v)}
        />
        <BodyField
          label="Surat Pengantar Proposal"
          value={form.proposalBody}
          onChange={(v) => upd("proposalBody", v)}
        />
      </div>

      <PreviewPanel settings={form} />


      <div className="max-w-3xl flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-6 py-3 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Simpan Pengaturan
        </button>
      </div>
    </AdminShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
        {label}
      </div>
      {children}
    </label>
  );
}

function BodyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed"
      />
    </Field>
  );
}

function ImageUpload({
  label,
  url,
  uploading,
  onPick,
  onClear,
}: {
  label: string;
  url: string;
  uploading: boolean;
  onPick: () => void;
  onClear: () => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <div className="size-20 rounded-xl border border-border bg-secondary/50 overflow-hidden grid place-items-center shrink-0">
          {url ? (
            <img src={url} alt="" className="size-full object-contain" />
          ) : (
            <span className="text-[10px] text-muted-foreground">Belum ada</span>
          )}
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={onPick}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Upload className="size-3.5" />
            )}
            {uploading ? "Mengupload..." : "Upload"}
          </button>
          {url && (
            <button
              type="button"
              onClick={onClear}
              className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
            >
              <X className="size-3" /> Hapus
            </button>
          )}
        </div>
      </div>
    </Field>
  );
}

const SAMPLE = { fullName: "Ahmad Contoh Peserta", code: "HXP-PREVIEW1", category: "self_funded" as const };

function PreviewPanel({ settings }: { settings: DocSettings }) {
  const kinds: DocKind[] = ["loa", "payment", "attendance", "proposal"];
  const [active, setActive] = useState<DocKind>("loa");
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let prev = url;
    setLoading(true);
    getDocBlobUrl(active, SAMPLE, settings)
      .then((u) => {
        if (cancelled) return;
        setUrl(u);
        if (prev) URL.revokeObjectURL(prev);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, settings]);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-display text-lg font-semibold flex items-center gap-2">
            <Eye className="size-5 text-accent" /> Preview Dokumen
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Contoh data peserta — gunakan untuk memeriksa tampilan sebelum disimpan.
          </p>
        </div>
        <button
          onClick={() => downloadDoc(active, SAMPLE, settings)}
          className="inline-flex items-center gap-1.5 rounded-full bg-secondary border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent/10"
        >
          <Download className="size-3.5" /> Unduh PDF
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {kinds.map((k) => (
          <button
            key={k}
            onClick={() => setActive(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              active === k
                ? "bg-emerald text-white border-emerald"
                : "bg-background border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {DOC_META[k].label}
          </button>
        ))}
      </div>

      <div className="relative rounded-xl border border-border overflow-hidden bg-secondary/30" style={{ height: 600 }}>
        {loading && (
          <div className="absolute inset-0 grid place-items-center bg-background/60 z-10">
            <Loader2 className="size-6 animate-spin text-accent" />
          </div>
        )}
        {url ? (
          <iframe src={url} title="Preview" className="w-full h-full" />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            Memuat preview...
          </div>
        )}
      </div>
    </div>
  );
}
