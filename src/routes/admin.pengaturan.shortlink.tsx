import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Link2, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AdminLoading, AdminShell, useAdminGuard } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { reservedSlugs, validDestination } from "@/lib/short-links";

export const Route = createFileRoute("/admin/pengaturan/shortlink")({
  head: () => ({ meta: [{ title: "Shortlink — Safar Iman Admin" }] }),
  component: ShortLinkSettings,
});

type ShortLink = {
  id: string;
  slug: string;
  title: string;
  target_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const EMPTY = { title: "", slug: "", target_url: "", is_active: true };

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function ShortLinkSettings() {
  const ready = useAdminGuard();
  const [items, setItems] = useState<ShortLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const origin = "https://safariman.id";

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
    const all: ShortLink[] = [];
    for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from("short_links")
      .select("id,slug,title,target_url,is_active,created_at,updated_at")
      .order("created_at", { ascending: false }).order("id")
      .range(offset, offset + 499);
    if (error) throw error;
    all.push(...(data ?? []));
    if ((data?.length ?? 0) < 500) break;
    }
    setItems(all);
    } catch {
      setLoadError("Gagal memuat shortlink. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  const preview = useMemo(() => `${origin}/${form.slug || "nama-link"}`, [origin, form.slug]);

  if (!ready) return <AdminLoading />;

  const reset = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  const save = async () => {
    const slug = normalizeSlug(form.slug);
    if (slug.length < 2) return toast.error("Slug minimal 2 karakter.");
    if (reservedSlugs.has(slug)) return toast.error("Nama ini digunakan halaman website. Pilih nama lain.");
    if (!validDestination(form.target_url, slug)) return toast.error("Gunakan URL lengkap http/https tanpa username atau password. Tujuan boleh ke Safar Iman, tetapi tidak boleh ke shortlink itu sendiri.");

    setSaving(true);
    try {
    const payload = {
      title: form.title.trim(),
      slug,
      target_url: new URL(form.target_url.trim()).toString(),
      is_active: form.is_active,
    };
    const result = editingId
      ? await supabase.from("short_links").update(payload).eq("id", editingId)
      : await supabase.from("short_links").insert(payload);
    setSaving(false);

    if (result.error) {
      toast.error(result.error.code === "23505" ? "Slug sudah digunakan." : result.error.code === "23514" ? "Nama link atau URL tujuan tidak diizinkan." : result.error.message);
      return;
    }
    toast.success(editingId ? "Shortlink diperbarui." : "Shortlink dibuat.");
    reset();
    await load();
    } catch {
      toast.error("Gagal menyimpan. Periksa koneksi lalu coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item: ShortLink) => {
    const { error } = await supabase.from("short_links").update({ is_active: !item.is_active }).eq("id", item.id);
    if (error) return toast.error(error.message);
    setItems((current) => current.map((row) => row.id === item.id ? { ...row, is_active: !row.is_active } : row));
  };

  const remove = async (item: ShortLink) => {
    if (!window.confirm(`Hapus shortlink /${item.slug}?`)) return;
    const { error } = await supabase.from("short_links").delete().eq("id", item.id);
    if (error) return toast.error(error.message);
    setItems((current) => current.filter((row) => row.id !== item.id));
    if (editingId === item.id) reset();
    toast.success("Shortlink dihapus.");
  };

  const copy = async (slug: string) => {
    try {
      await navigator.clipboard.writeText(`${origin}/${slug}`);
      toast.success("Shortlink disalin.");
    } catch { toast.error("Gagal menyalin. Silakan salin alamat link secara manual."); }
  };

  return (
    <AdminShell title="Shortlink">
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="h-fit rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-emerald/10 text-emerald"><Link2 className="size-5" /></div>
            <div>
              <h2 className="font-display text-xl font-semibold">{editingId ? "Edit Shortlink" : "Buat Shortlink"}</h2>
              <p className="text-xs text-muted-foreground">Arahkan ke halaman Safar Iman atau website eksternal.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="short-title">Nama link</Label>
              <Input id="short-title" value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} placeholder="Contoh: CBT Safar Iman" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="short-slug">Slug</Label>
              <Input id="short-slug" value={form.slug} onChange={(e) => setForm((v) => ({ ...v, slug: normalizeSlug(e.target.value) }))} placeholder="cbt" />
              <p className="break-all rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">{preview}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="short-target">URL tujuan (internal atau eksternal)</Label>
              <Input id="short-target" type="url" value={form.target_url} onChange={(e) => setForm((v) => ({ ...v, target_url: e.target.value }))} placeholder="https://contoh.com/halaman" />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div><p className="text-sm font-medium">Aktif</p><p className="text-xs text-muted-foreground">Link langsung dapat digunakan publik.</p></div>
              <Switch checked={form.is_active} onCheckedChange={(checked) => setForm((v) => ({ ...v, is_active: checked }))} />
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving} className="flex-1 bg-gradient-emerald text-white">
                {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : editingId ? <Check className="mr-2 size-4" /> : <Plus className="mr-2 size-4" />}
                {editingId ? "Simpan Perubahan" : "Buat Shortlink"}
              </Button>
              {editingId && <Button variant="outline" size="icon" onClick={reset} title="Batal"><X className="size-4" /></Button>}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="font-display text-xl font-semibold">Daftar Shortlink</h2><p className="text-sm text-muted-foreground">{items.length} link tersimpan</p></div>
          </div>

          <Input className="my-4" aria-label="Cari shortlink" placeholder="Cari nama, slug, atau URL tujuan…" value={search} onChange={(e) => setSearch(e.target.value)} />
          {loadError ? <div role="alert" className="text-destructive">{loadError} <Button variant="outline" onClick={() => void load()}>Coba Lagi</Button></div> : loading ? (
            <div className="grid min-h-56 place-items-center"><Loader2 className="size-7 animate-spin text-emerald" /></div>
          ) : items.length === 0 ? (
            <div className="grid min-h-56 place-items-center rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">Belum ada shortlink.</div>
          ) : (
            <div className="mt-5 space-y-3">
              {items.filter((item) => `${item.title} ${item.slug} ${item.target_url}`.toLowerCase().includes(search.toLowerCase())).map((item) => (
                <article key={item.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{item.title || item.slug}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.is_active ? "bg-emerald/10 text-emerald" : "bg-muted text-muted-foreground"}`}>{item.is_active ? "Aktif" : "Nonaktif"}</span>
                      </div>
                      <button onClick={() => copy(item.slug)} className="mt-1 flex max-w-full items-center gap-1.5 text-left text-sm font-medium text-emerald hover:underline">
                        <span className="truncate">{origin}/{item.slug}</span><Copy className="size-3.5 shrink-0" />
                      </button>
                      <p className="mt-2 truncate text-xs text-muted-foreground" title={item.target_url}>{item.target_url}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Switch checked={item.is_active} onCheckedChange={() => void toggle(item)} aria-label={`Aktifkan ${item.slug}`} />
                      <Button variant="outline" size="icon" asChild title="Buka shortlink"><a href={`${origin}/${item.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /></a></Button>
                      <Button variant="outline" size="icon" onClick={() => { setEditingId(item.id); setForm({ title: item.title, slug: item.slug, target_url: item.target_url, is_active: item.is_active }); window.scrollTo({ top: 0, behavior: "smooth" }); }} title="Edit"><Pencil className="size-4" /></Button>
                      <Button variant="outline" size="icon" onClick={() => void remove(item)} className="text-destructive hover:text-destructive" title="Hapus"><Trash2 className="size-4" /></Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
