import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Image as ImageIcon, Loader2, Upload, Download, TrendingUp, Calendar, Instagram, Music2, Plus, Trash2, Save, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/pengaturan/twibbon")({
  head: () => ({ meta: [{ title: "Frame Twibbon — Safar Iman Admin" }] }),
  component: TwibbonSetting,
});

type DayStat = { day: string; count: number };
type SocialAccount = { handle: string; url: string; label: string };


function TwibbonSetting() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [twibbonFrameUrl, setTwibbonFrameUrl] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [shareCaption, setShareCaption] = useState("");

  const [savingCaptions, setSavingCaptions] = useState(false);
  const [stats, setStats] = useState<DayStat[]>([]);
  const [rangeDays, setRangeDays] = useState(30);
  const [igAccounts, setIgAccounts] = useState<SocialAccount[]>([]);
  const [tiktokAccounts, setTiktokAccounts] = useState<SocialAccount[]>([]);
  const [savingSocial, setSavingSocial] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);

  const loadStats = async (days: number) => {
    const { data } = await supabase.rpc("get_twibbon_download_stats", { p_days: days });
    if (Array.isArray(data)) {
      setStats(data.map((r: any) => ({ day: r.day as string, count: Number(r.count) })));
    }
  };

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const [{ data: rows }] = await Promise.all([
        supabase.from("app_settings").select("key,value").in("key", [
          "twibbon_frame_url", "poster_url", "social_ig_accounts", "social_tiktok_accounts",
          "twibbon_caption",
        ]),
        loadStats(rangeDays),
      ]);
      const map = new Map((rows ?? []).map((r: any) => [r.key, r.value]));
      setTwibbonFrameUrl((map.get("twibbon_frame_url") as string) ?? "");
      setPosterUrl((map.get("poster_url") as string) ?? "");
      setShareCaption((map.get("twibbon_caption") as string) ?? "");

      const parse = (raw: unknown): SocialAccount[] => {
        try {
          const v = typeof raw === "string" ? JSON.parse(raw) : raw;
          return Array.isArray(v) ? v.map((x: any) => ({
            handle: String(x.handle ?? ""), url: String(x.url ?? ""), label: String(x.label ?? ""),
          })) : [];
        } catch { return []; }
      };
      setIgAccounts(parse(map.get("social_ig_accounts")));
      setTiktokAccounts(parse(map.get("social_tiktok_accounts")));
      setLoading(false);
    })();
     
  }, [ready]);

  const saveSocial = async () => {
    setSavingSocial(true);
    try {
      const clean = (list: SocialAccount[]) =>
        list.map((a) => ({ handle: a.handle.trim(), url: a.url.trim(), label: a.label.trim() }))
          .filter((a) => a.handle && a.url);
      const now = new Date().toISOString();
      const { error } = await supabase.from("app_settings").upsert([
        { key: "social_ig_accounts", value: JSON.stringify(clean(igAccounts)), updated_at: now },
        { key: "social_tiktok_accounts", value: JSON.stringify(clean(tiktokAccounts)), updated_at: now },
      ]);
      if (error) throw error;
      toast.success("Akun sosial media tersimpan");
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal menyimpan");
    } finally {
      setSavingSocial(false);
    }
  };

  const saveCaptions = async () => {
    setSavingCaptions(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase.from("app_settings").upsert([
        { key: "twibbon_caption", value: shareCaption, updated_at: now },
        { key: "poster_caption", value: shareCaption, updated_at: now },
      ]);

      if (error) throw error;
      toast.success("Caption tersimpan");
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal menyimpan");
    } finally {
      setSavingCaptions(false);
    }
  };


  useEffect(() => {
    if (ready && !loading) loadStats(rangeDays);
     
  }, [rangeDays]);

  const totalAll = useMemo(() => stats.reduce((a, b) => a + b.count, 0), [stats]);
  const today = stats[0]?.count ?? 0;
  const yesterday = stats[1]?.count ?? 0;
  const maxCount = useMemo(() => Math.max(1, ...stats.map((s) => s.count)), [stats]);


  const compressImage = async (
    f: File,
    prefix: string
  ): Promise<File> => {
    // Frame: keep PNG transparency, resize to max 1080x1080
    // Poster: convert to JPEG quality 0.85, resize to max 1440px longest side
    const isFrame = prefix === "frame";
    const maxDim = isFrame ? 1080 : 1440;
    const outputType = isFrame ? "image/png" : "image/jpeg";
    const quality = isFrame ? undefined : 0.85;
    const outputExt = isFrame ? "png" : "jpg";

    const bitmap = await createImageBitmap(f).catch(() => null);
    if (!bitmap) return f;

    let { width, height } = bitmap;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    width = Math.round(width * scale);
    height = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return f;
    if (!isFrame) {
      // white background for JPEG (avoids black bg from transparent source)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, outputType, quality)
    );
    if (!blob) return f;
    // If compression makes it larger (rare), keep original
    if (blob.size >= f.size && f.type === outputType) return f;
    return new File([blob], `${prefix}.${outputExt}`, { type: outputType });
  };

  const uploadAsset = async (
    f: File,
    key: "twibbon_frame_url" | "poster_url",
    prefix: string,
    setUrl: (u: string) => void,
    setBusy: (b: boolean) => void,
    ref: React.RefObject<HTMLInputElement | null>
  ) => {
    if (!f.type.startsWith("image/")) { toast.error("File harus gambar"); return; }
    if (f.size > 20 * 1024 * 1024) { toast.error("Maks 20MB"); return; }
    setBusy(true);
    try {
      const compressed = await compressImage(f, prefix);
      if (compressed.size > 8 * 1024 * 1024) {
        throw new Error("Gambar masih terlalu besar setelah kompresi (maks 8MB)");
      }
      const form = new FormData();
      form.append("file", compressed);
      form.append("key", key);
      form.append("prefix", prefix);

      const { data, error: fnErr } = await supabase.functions.invoke("admin-upload-twibbon-asset", {
        body: form,
      });
      if (fnErr) throw fnErr;
      const url = typeof data?.url === "string" ? data.url : "";
      if (!url) throw new Error("Upload berhasil, tapi URL file tidak diterima");
      setUrl(url);
      const savedKb = Math.max(0, Math.round((f.size - compressed.size) / 1024));
      toast.success(
        savedKb > 0
          ? `Berhasil diperbarui (hemat ${savedKb} KB)`
          : "Berhasil diperbarui"
      );
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal upload");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    await uploadAsset(f, "twibbon_frame_url", "frame", setTwibbonFrameUrl, setUploading, inputRef);
  };

  const onPickPoster = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    await uploadAsset(f, "poster_url", "poster", setPosterUrl, setUploadingPoster, posterInputRef);
  };

  if (!ready || loading) return <AdminLoading />;

  return (
    <AdminShell title="Frame Twibbon">
      <Link to="/admin/pengaturan" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground -mt-3">
        <ArrowLeft className="size-4" /> Kembali ke Pengaturan
      </Link>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4 max-w-3xl">
        <div className="flex items-center gap-2">
          <ImageIcon className="size-5 text-accent" />
          <div className="font-display text-lg font-semibold">Frame Twibbon Aktif</div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Gambar frame yang dipasang di atas foto peserta pada halaman Twibbon.
          Gunakan <strong>PNG transparan ukuran 1080×1080</strong> agar hasilnya pas.
          Setelah upload, frame baru langsung berlaku untuk semua pengunjung.
        </p>
        <div className="flex items-start gap-5 flex-wrap pt-2">
          <div className="w-40 rounded-2xl overflow-hidden border border-border bg-secondary shrink-0">
            {twibbonFrameUrl ? (
              <img src={twibbonFrameUrl} alt="Frame Twibbon aktif" className="w-full h-auto block" />
            ) : (
              <div className="aspect-square grid place-items-center">
                <span className="text-xs text-muted-foreground text-center px-2">Pakai frame default</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-[220px] space-y-3">
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onPick} className="hidden" />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-5 py-2.5 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60"
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {uploading ? "Mengupload..." : "Upload Frame Baru"}
            </button>
            {twibbonFrameUrl && (
              <div className="text-xs text-muted-foreground break-all">
                URL: <a href={twibbonFrameUrl} target="_blank" rel="noreferrer" className="text-accent underline">{twibbonFrameUrl}</a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Poster Setting */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4 max-w-3xl">
        <div className="flex items-center gap-2">
          <ImageIcon className="size-5 text-accent" />
          <div className="font-display text-lg font-semibold">Poster Aktif</div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Poster ini ditampilkan di halaman Twibbon (Tahap 3) untuk diunduh peserta dan dibagikan ke 5 grup WhatsApp.
          Disarankan rasio <strong>1:1 atau 4:5</strong> (JPG/PNG, maks 8MB).
        </p>
        <div className="flex items-start gap-5 flex-wrap pt-2">
          <div className="w-40 rounded-2xl overflow-hidden border border-border bg-secondary shrink-0">
            {posterUrl ? (
              <img src={posterUrl} alt="Poster aktif" className="w-full h-auto block" />
            ) : (
              <div className="aspect-square grid place-items-center">
                <span className="text-xs text-muted-foreground text-center px-2">Pakai poster default</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-[220px] space-y-3">
            <input ref={posterInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onPickPoster} className="hidden" />
            <button
              onClick={() => posterInputRef.current?.click()}
              disabled={uploadingPoster}
              className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-5 py-2.5 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60"
            >
              {uploadingPoster ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {uploadingPoster ? "Mengupload..." : "Upload Poster Baru"}
            </button>
            {posterUrl && (
              <div className="text-xs text-muted-foreground break-all">
                URL: <a href={posterUrl} target="_blank" rel="noreferrer" className="text-accent underline">{posterUrl}</a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Caption Editor */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5 max-w-3xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-accent" />
            <div className="font-display text-lg font-semibold">Caption Twibbon & Poster</div>
          </div>
          <button
            onClick={saveCaptions}
            disabled={savingCaptions}
            className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-4 py-2 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60"
          >
            {savingCaptions ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {savingCaptions ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Caption ini dipakai untuk <strong>Twibbon (Instagram)</strong> dan <strong>Poster (WhatsApp)</strong>. Kosongkan untuk memakai caption default.
        </p>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Caption Twibbon & Poster
          </label>
          <textarea
            value={shareCaption}
            onChange={(e) => setShareCaption(e.target.value)}
            rows={14}
            placeholder="Tulis caption untuk dibagikan di Instagram & WhatsApp..."
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono leading-relaxed"
          />
          <div className="text-[11px] text-muted-foreground text-right">{shareCaption.length} karakter</div>
        </div>
      </div>


      {/* Social Accounts Editor */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5 max-w-3xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Instagram className="size-5 text-accent" />
            <div className="font-display text-lg font-semibold">Akun Sosial Media (Tahap 1 Twibbon)</div>
          </div>
          <button
            onClick={saveSocial}
            disabled={savingSocial}
            className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-4 py-2 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60"
          >
            {savingSocial ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {savingSocial ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Atur daftar akun Instagram & TikTok yang wajib di-follow peserta pada halaman Twibbon.
        </p>

        <SocialEditor
          title="Instagram"
          icon={<Instagram className="size-4" />}
          accounts={igAccounts}
          onChange={setIgAccounts}
          urlPlaceholder="https://instagram.com/akun"
        />

        <SocialEditor
          title="TikTok"
          icon={<Music2 className="size-4" />}
          accounts={tiktokAccounts}
          onChange={setTiktokAccounts}
          urlPlaceholder="https://tiktok.com/@akun"
        />
      </div>

      {/* Download Statistics */}

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5 max-w-3xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-5 text-accent" />
            <div className="font-display text-lg font-semibold">Statistik Download Twibbon</div>
          </div>
          <select
            value={rangeDays}
            onChange={(e) => setRangeDays(Number(e.target.value))}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium"
          >
            <option value={7}>7 hari terakhir</option>
            <option value={14}>14 hari terakhir</option>
            <option value={30}>30 hari terakhir</option>
            <option value={90}>90 hari terakhir</option>
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={<Download className="size-4" />} label="Total" value={totalAll} />
          <StatCard icon={<Calendar className="size-4" />} label="Hari ini" value={today} />
          <StatCard icon={<Calendar className="size-4" />} label="Kemarin" value={yesterday} />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Per Hari</div>
          {stats.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">Belum ada data download.</div>
          ) : (
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-2">
              {stats.map((s) => (
                <div key={s.day} className="flex items-center gap-3 text-sm">
                  <div className="w-24 shrink-0 text-xs text-muted-foreground tabular-nums">
                    {formatDay(s.day)}
                  </div>
                  <div className="flex-1 h-6 bg-secondary rounded-md overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-emerald transition-all"
                      style={{ width: `${(s.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <div className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums">
                    {s.count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1.5 text-2xl font-bold font-display tabular-nums">{value}</div>
    </div>
  );
}

function formatDay(day: string) {
  const d = new Date(day + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

function SocialEditor({
  title, icon, accounts, onChange, urlPlaceholder,
}: {
  title: string;
  icon: React.ReactNode;
  accounts: SocialAccount[];
  onChange: (next: SocialAccount[]) => void;
  urlPlaceholder: string;
}) {
  const update = (i: number, patch: Partial<SocialAccount>) =>
    onChange(accounts.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  const remove = (i: number) => onChange(accounts.filter((_, idx) => idx !== i));
  const add = () => onChange([...accounts, { handle: "", url: "", label: "" }]);

  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="size-7 rounded-lg bg-card border border-border grid place-items-center text-accent">
          {icon}
        </div>
        <h3 className="font-display text-base font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">({accounts.length} akun)</span>
      </div>

      {accounts.length === 0 && (
        <p className="text-xs text-muted-foreground italic">Belum ada akun — tambahkan di bawah.</p>
      )}

      <div className="space-y-2">
        {accounts.map((acc, i) => (
          <div key={i} className="grid sm:grid-cols-[1fr_1fr_1.5fr_auto] gap-2 items-center">
            <input
              value={acc.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="Label (mis. Safar Iman)"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              value={acc.handle}
              onChange={(e) => update(i, { handle: e.target.value })}
              placeholder="handle (tanpa @)"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              value={acc.url}
              onChange={(e) => update(i, { url: e.target.value })}
              placeholder={urlPlaceholder}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              onClick={() => remove(i)}
              className="inline-flex items-center justify-center size-9 rounded-lg border border-border bg-background hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 transition-colors"
              title="Hapus akun"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={add}
        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border bg-background hover:bg-secondary px-3 py-1.5 text-xs font-medium"
      >
        <Plus className="size-3.5" /> Tambah Akun {title}
      </button>
    </div>
  );
}
