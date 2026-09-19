import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Loader2, PlugZap, Save, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminShell } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/pengaturan/ai-provider")({
  head: () => ({ meta: [{ title: "OpenRouter AI — Safar Iman Admin" }] }),
  component: AiProviderPage,
});

type Config = {
  provider: "openrouter";
  model: string;
  api_key_configured: boolean;
  api_key_updated_at: string | null;
};

function AiProviderPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"save" | "test" | "remove" | null>(null);
  const [model, setModel] = useState("openai/gpt-4o-mini");
  const [apiKey, setApiKey] = useState("");
  const [configured, setConfigured] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const invoke = async (body: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      navigate({ to: "/admin/login" });
      throw new Error("Sesi admin berakhir. Silakan login ulang.");
    }
    const { data, error } = await supabase.functions.invoke("admin-ai-settings", {
      body,
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) {
      let message = error.message;
      const response = (error as { context?: Response }).context;
      if (response) {
        const payload = await response.clone().json().catch(() => null) as { error?: string } | null;
        message = payload?.error || message;
      }
      throw new Error(message);
    }
    if (data?.error) throw new Error(data.error);
    return data as Config & { ok?: boolean };
  };

  const applyConfig = (config: Config) => {
    setModel(config.model || "openai/gpt-4o-mini");
    setConfigured(config.api_key_configured);
    setUpdatedAt(config.api_key_updated_at);
  };

  useEffect(() => {
    void (async () => {
      try {
        applyConfig(await invoke({ action: "get" }));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal memuat pengaturan OpenRouter");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    if (!model.trim()) return toast.error("Model OpenRouter wajib diisi");
    setBusy("save");
    try {
      const result = await invoke({ action: "save", model: model.trim(), api_key: apiKey.trim() });
      applyConfig(result);
      setApiKey("");
      toast.success("Pengaturan OpenRouter berhasil disimpan");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan pengaturan");
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    setBusy("test");
    try {
      const result = await invoke({ action: "test" });
      toast.success(`OpenRouter terhubung. Model aktif: ${result.model}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tes koneksi gagal");
    } finally {
      setBusy(null);
    }
  };

  const removeKey = async () => {
    if (!confirm("Hapus API key OpenRouter dari server? Analisis AI akan berhenti sampai key baru disimpan.")) return;
    setBusy("remove");
    try {
      const result = await invoke({ action: "remove_key" });
      applyConfig(result);
      setApiKey("");
      toast.success("API key OpenRouter telah dihapus");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus API key");
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="size-8 animate-spin text-accent" /></div>;

  return (
    <AdminShell title="OpenRouter untuk Pengoreksi Essay">
      <div className="max-w-3xl space-y-6">
        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-5">
          <div className="flex items-start gap-3">
            <div className="size-11 rounded-xl bg-accent/10 grid place-items-center"><PlugZap className="size-5 text-accent" /></div>
            <div>
              <h2 className="font-display text-xl font-semibold">Konfigurasi OpenRouter</h2>
              <p className="text-sm text-muted-foreground mt-1">Dipakai untuk memberi rekomendasi centang, skor, dan bukti pada halaman koreksi staff. Keputusan akhir tetap ditentukan staff.</p>
            </div>
          </div>

          <div className={`rounded-xl border p-4 flex gap-3 ${configured ? "border-emerald/30 bg-emerald/5" : "border-amber-300 bg-amber-50"}`}>
            {configured ? <CheckCircle2 className="size-5 text-emerald shrink-0" /> : <KeyRound className="size-5 text-amber-700 shrink-0" />}
            <div className="text-sm">
              <div className="font-semibold">{configured ? "API key sudah tersimpan aman di backend" : "API key belum disimpan"}</div>
              <div className="text-muted-foreground">
                {configured && updatedAt ? `Terakhir diperbarui ${new Date(updatedAt).toLocaleString("id-ID")}. Key tidak pernah ditampilkan kembali.` : "Masukkan API key OpenRouter untuk mengaktifkan analisis."}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="openrouter-key">API Key OpenRouter</Label>
            <Input id="openrouter-key" type="password" autoComplete="new-password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={configured ? "Kosongkan jika tidak ingin mengganti API key" : "sk-or-v1-..."} />
            <p className="text-xs text-muted-foreground">API key hanya dikirim ke fungsi backend dan disimpan pada tabel yang tidak dapat dibaca browser maupun akun staff.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="openrouter-model">ID Model OpenRouter</Label>
            <Input id="openrouter-model" className="font-mono" value={model} onChange={(event) => setModel(event.target.value)} placeholder="openai/gpt-4o-mini" />
            <p className="text-xs text-muted-foreground">Salin ID model persis dari <a href="https://openrouter.ai/models" target="_blank" rel="noreferrer" className="text-accent underline">daftar model OpenRouter</a>. Pilih model yang mendukung structured JSON.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => void save()} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-lg bg-accent text-white px-5 py-2.5 font-semibold disabled:opacity-60">
              {busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Simpan
            </button>
            <button onClick={() => void test()} disabled={!configured || busy !== null} className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 font-semibold disabled:opacity-50">
              {busy === "test" ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />} Tes Koneksi
            </button>
            {configured && <button onClick={() => void removeKey()} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-lg border border-red-300 text-red-600 px-4 py-2.5 font-semibold disabled:opacity-50">
              {busy === "remove" ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Hapus Key
            </button>}
          </div>
        </section>

        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <b>Kontrol biaya:</b> OpenRouter hanya dipanggil ketika staff menekan tombol “Analisis dengan AI”. Hasil AI tidak otomatis meluluskan peserta dan tidak menggunakan kredit Lovable.
        </section>
      </div>
    </AdminShell>
  );
}
