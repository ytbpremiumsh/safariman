import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Upload, Loader2, Copy, Download, Trash2, FileIcon, RefreshCw, Search, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/pengaturan/media")({
  head: () => ({ meta: [{ title: "Media Library — Safar Iman Admin" }] }),
  component: MediaPage,
});

const BUCKET = "media-library";
// 10 years in seconds — effectively permanent link
const SIGNED_TTL = 60 * 60 * 24 * 365 * 10;
const DOMAIN_KEY = "media_public_base_url";

type MediaItem = {
  name: string;
  path: string;
  size: number;
  updated_at: string | null;
  mime: string | null;
  url: string;
};

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function rewriteHost(url: string, base: string): string {
  if (!url) return url;
  if (!base) return url;
  try {
    const u = new URL(url);
    const b = new URL(base);
    u.protocol = b.protocol;
    u.host = b.host;
    // Shorten path: strip Supabase storage prefix so path becomes just /<filename>
    // e.g. /storage/v1/object/sign/media-library/foo.png -> /foo.png
    u.pathname = u.pathname.replace(
      /^\/storage\/v1\/object\/(?:sign|public|authenticated)\/[^/]+\//,
      "/",
    );
    return u.toString();
  } catch {
    return url;
  }
}

function MediaPage() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [savedBase, setSavedBase] = useState("");
  const [savingBase, setSavingBase] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadBase = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", DOMAIN_KEY)
      .maybeSingle();
    const v = (data?.value as string) ?? "";
    setBaseUrl(v);
    setSavedBase(v);
    return v;
  };

  const load = async () => {
    setLoading(true);
    try {
      const base = await loadBase();
      const { data, error } = await supabase.storage.from(BUCKET).list("", {
        limit: 500,
        sortBy: { column: "updated_at", order: "desc" },
      });
      if (error) throw error;
      const files = (data ?? []).filter((f) => f.name && f.name !== ".emptyFolderPlaceholder");
      if (files.length === 0) {
        setItems([]);
        return;
      }
      const paths = files.map((f) => f.name);
      const { data: signed, error: signErr } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(paths, SIGNED_TTL);
      if (signErr) throw signErr;
      const urlMap = new Map(signed?.map((s) => [s.path!, s.signedUrl]) ?? []);
      setItems(
        files.map((f) => ({
          name: f.name,
          path: f.name,
          size: (f.metadata as any)?.size ?? 0,
          updated_at: f.updated_at ?? null,
          mime: (f.metadata as any)?.mimetype ?? null,
          url: rewriteHost(urlMap.get(f.name) ?? "", base),
        })),
      );
    } catch (e: any) {
      toast.error(e.message ?? "Gagal memuat media");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready) load();
  }, [ready]);

  const saveBase = async () => {
    const trimmed = baseUrl.trim().replace(/\/+$/, "");
    if (trimmed && !/^https?:\/\//i.test(trimmed)) {
      toast.error("URL harus diawali http:// atau https://");
      return;
    }
    setSavingBase(true);
    try {
      const { error } = await supabase.rpc("admin_set_setting", {
        p_key: DOMAIN_KEY,
        p_value: trimmed,
      });
      if (error) throw error;
      setSavedBase(trimmed);
      setBaseUrl(trimmed);
      toast.success("Domain disimpan");
      // Rewrite existing URLs in place
      setItems((prev) =>
        prev.map((i) => ({ ...i, url: rewriteHost(i.url, trimmed) })),
      );
    } catch (e: any) {
      toast.error(e.message ?? "Gagal menyimpan");
    } finally {
      setSavingBase(false);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const cleanName = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${Date.now()}_${cleanName}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
          contentType: file.type || undefined,
          upsert: false,
        });
        if (error) throw error;
      }
      toast.success(`${files.length} file diunggah`);
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Gagal upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = async (path: string) => {
    if (!confirm(`Hapus file "${path}"?`)) return;
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) return toast.error(error.message);
    toast.success("File dihapus");
    setItems((prev) => prev.filter((i) => i.path !== path));
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL disalin");
    } catch {
      toast.error("Gagal menyalin");
    }
  };

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  if (!ready) return <AdminLoading />;

  const dirty = baseUrl.trim().replace(/\/+$/, "") !== savedBase;

  return (
    <AdminShell title="Media Library">
      <p className="text-sm text-muted-foreground -mt-3">
        Unggah gambar, dokumen, atau file lain. Setiap file mendapat link URL yang bisa
        disalin dan digunakan di mana saja (link berlaku 10 tahun).
      </p>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
        <label className="text-sm font-medium">Domain Storage (VPS)</label>
        <p className="text-xs text-muted-foreground">
          Isi dengan domain VPS/self-host Anda (mis. <code>https://storage.domain-anda.com</code>).
          Kosongkan untuk memakai domain default. Domain wajib melayani path yang sama
          (<code>/storage/v1/object/...</code>).
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://storage.domain-anda.com"
            className="flex-1 min-w-[260px] h-10 px-3 rounded-lg border border-border bg-background text-sm"
          />
          <button
            onClick={saveBase}
            disabled={savingBase || !dirty}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 h-10 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60"
          >
            {savingBase ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Simpan
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 bg-gradient-emerald text-white px-4 h-10 rounded-lg font-medium hover:opacity-90 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {uploading ? "Mengunggah..." : "Upload File"}
          </button>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 border border-border px-3 h-10 rounded-lg text-sm hover:bg-secondary"
          >
            <RefreshCw className="size-4" /> Refresh
          </button>
          <div className="ml-auto relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari file..."
              className="pl-9 pr-3 h-10 rounded-lg border border-border bg-background text-sm min-w-[220px]"
            />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 grid place-items-center text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {items.length === 0 ? "Belum ada file. Klik Upload untuk memulai." : "Tidak ada hasil."}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((it) => {
              const isImg = (it.mime ?? "").startsWith("image/");
              return (
                <div key={it.path} className="p-4 flex items-center gap-4">
                  <div className="size-14 rounded-lg bg-secondary grid place-items-center overflow-hidden shrink-0">
                    {isImg && it.url ? (
                      <img src={it.url} alt={it.name} className="size-full object-cover" />
                    ) : (
                      <FileIcon className="size-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{it.name}</div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>{formatBytes(it.size)}</span>
                      {it.mime && <span>{it.mime}</span>}
                      {it.updated_at && (
                        <span>{new Date(it.updated_at).toLocaleString("id-ID")}</span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        readOnly
                        value={it.url}
                        onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
                        className="flex-1 min-w-0 text-xs px-2 h-8 rounded border border-border bg-background text-muted-foreground"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => copyUrl(it.url)}
                      title="Salin URL"
                      className="size-9 grid place-items-center rounded-lg border border-border hover:bg-secondary"
                    >
                      <Copy className="size-4" />
                    </button>
                    <a
                      href={it.url}
                      download={it.name}
                      target="_blank"
                      rel="noreferrer"
                      title="Download"
                      className="size-9 grid place-items-center rounded-lg border border-border hover:bg-secondary"
                    >
                      <Download className="size-4" />
                    </a>
                    <button
                      onClick={() => remove(it.path)}
                      title="Hapus"
                      className="size-9 grid place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
