import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, History, KeyRound, Loader2, PlugZap, RefreshCw, Save, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminShell } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/pengaturan/ai-provider")({
  head: () => ({ meta: [{ title: "OpenRouter AI — Safar Iman Admin" }] }),
  component: AiProviderPage,
});

type ConfigHistory = {
  id: number;
  model: string;
  action: "saved" | "key_removed" | "existing";
  api_key_changed: boolean;
  created_at: string;
};

type Config = {
  provider: "openrouter";
  model: string;
  api_key_configured: boolean;
  api_key_updated_at: string | null;
  history?: ConfigHistory[];
};

function friendlyFunctionError(message: string) {
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return "Backend OpenRouter belum dapat dijangkau. Pastikan Edge Function admin-ai-settings sudah di-deploy, lalu coba lagi.";
  }
  if (/not found|requested function was not found|404/i.test(message)) {
    return "Edge Function admin-ai-settings belum terpasang pada Supabase Safar Iman.";
  }
  return message;
}

async function readFunctionError(error: unknown) {
  const fallback = friendlyFunctionError(error instanceof Error ? error.message : "Permintaan ke server gagal");
  if (!error || typeof error !== "object") return fallback;
  const context = (error as { context?: unknown }).context;
  if (!context || typeof context !== "object") return fallback;
  const jsonReader = (context as { json?: unknown }).json;
  if (typeof jsonReader !== "function") {
    const contextMessage = (context as { message?: unknown }).message;
    return typeof contextMessage === "string" ? friendlyFunctionError(contextMessage) : fallback;
  }
  try {
    const payload = await jsonReader.call(context) as { error?: unknown; message?: unknown; code?: unknown };
    const detail = typeof payload?.error === "string" ? payload.error : typeof payload?.message === "string" ? payload.message : "";
    return detail ? friendlyFunctionError(detail) : fallback;
  } catch {
    return fallback;
  }
}

function AiProviderPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"save" | "test" | "remove" | null>(null);
  const [model, setModel] = useState("openai/gpt-4o-mini");
  const [apiKey, setApiKey] = useState("");
  const [configured, setConfigured] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [history, setHistory] = useState<ConfigHistory[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

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
    if (error) throw new Error(await readFunctionError(error));
    if (data?.error) throw new Error(data.error);
    return data as Config & { ok?: boolean };
  };

  const applyConfig = (config: Config) => {
    setModel(config.model || "openai/gpt-4o-mini");
    setConfigured(Boolean(config.api_key_configured));
    setUpdatedAt(config.api_key_updated_at || null);
    setHistory(Array.isArray(config.history) ? config.history : []);
    setLoadError(null);
  };

  const loadConfig = async () => {
    setLoading(true);
    try {
      applyConfig(await invoke({ action: "get" }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat pengaturan OpenRouter";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadConfig(); }, []);

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
        {loadError && <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3"><AlertCircle className="size-5 mt-0.5 shrink-0" /><div><div className="font-semibold">Layanan konfigurasi belum terhubung</div><p className="text-sm mt-0.5">{loadError}</p></div></div>
          <button type="button" onClick={() => void loadConfig()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Coba Lagi
          </button>
        </section>}
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
            <p className="text-xs text-muted-foreground">API key hanya dikirim ke fungsi backend. Demi keamanan, isi key tidak pernah ditampilkan kembali atau disimpan dalam riwayat.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="openrouter-model">ID Model OpenRouter</Label>
            <Input id="openrouter-model" className="font-mono" value={model} onChange={(event) => setModel(event.target.value)} placeholder="inception/mercury-2.5" />
            <p className="text-xs text-muted-foreground">Salin ID model persis dari <a href="https://openrouter.ai/models" target="_blank" rel="noreferrer" className="text-accent underline">daftar model OpenRouter</a>. Pilih model yang mendukung structured JSON.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => void save()} disabled={busy !== null || Boolean(loadError)} className="inline-flex items-center gap-2 rounded-lg bg-accent text-white px-5 py-2.5 font-semibold disabled:opacity-60">
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

        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-5 border-b flex items-center gap-2">
            <History className="size-5 text-accent" />
            <div><h2 className="font-semibold">Riwayat Konfigurasi</h2><p className="text-xs text-muted-foreground">Menampilkan 20 perubahan terakhir tanpa membocorkan API key.</p></div>
          </div>
          {history.length === 0 ? <p className="p-6 text-sm text-muted-foreground text-center">Belum ada riwayat perubahan.</p> : (
            <div className="divide-y">
              {history.map((item) => <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm">
                <div><div className="font-mono font-medium break-all">{item.model}</div><div className="text-xs text-muted-foreground">{item.action === "key_removed" ? "API key dihapus" : item.api_key_changed ? "Model disimpan dan API key diperbarui" : "Model disimpan tanpa mengganti API key"}</div></div>
                <time className="text-xs text-muted-foreground whitespace-nowrap">{new Date(item.created_at).toLocaleString("id-ID")}</time>
              </div>)}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <b>Kontrol biaya:</b> OpenRouter hanya dipanggil ketika staff menekan tombol “Analisis dengan AI”. Hasil AI tidak otomatis meluluskan peserta dan tidak menggunakan kredit Lovable.
        </section>
      </div>
    </AdminShell>
  );
}
