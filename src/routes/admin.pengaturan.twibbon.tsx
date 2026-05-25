import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Image as ImageIcon, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/pengaturan/twibbon")({
  head: () => ({ meta: [{ title: "Frame Twibbon — Safar Iman Admin" }] }),
  component: TwibbonSetting,
});

function TwibbonSetting() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [twibbonFrameUrl, setTwibbonFrameUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data } = await supabase.from("app_settings").select("value").eq("key", "twibbon_frame_url").maybeSingle();
      setTwibbonFrameUrl(data?.value ?? "");
      setLoading(false);
    })();
  }, [ready]);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("File harus gambar (PNG transparan disarankan)"); return; }
    if (f.size > 8 * 1024 * 1024) { toast.error("Maks 8MB"); return; }
    setUploading(true);
    try {
      const ext = (f.name.split(".").pop() || "png").toLowerCase();
      const path = `frame-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("twibbon-assets").upload(path, f, { upsert: true, contentType: f.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("twibbon-assets").getPublicUrl(path);
      const url = `${data.publicUrl}?v=${Date.now()}`;
      const { error: sErr } = await supabase.from("app_settings").upsert({
        key: "twibbon_frame_url", value: url, updated_at: new Date().toISOString(),
      });
      if (sErr) throw sErr;
      setTwibbonFrameUrl(url);
      toast.success("Frame Twibbon berhasil diperbarui");
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal upload frame");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
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
          <div className="size-40 rounded-2xl overflow-hidden border border-border bg-secondary grid place-items-center shrink-0">
            {twibbonFrameUrl ? (
              <img src={twibbonFrameUrl} alt="Frame Twibbon aktif" className="size-full object-cover" />
            ) : (
              <span className="text-xs text-muted-foreground text-center px-2">Pakai frame default</span>
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
    </AdminShell>
  );
}
