import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2, Save, Sparkles, Bot } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminShell } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/pengaturan/ai-provider")({
  head: () => ({ meta: [{ title: "AI Provider — Safar Iman Admin" }] }),
  component: AiProviderPage,
});

const LOVABLE_MODELS = [
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "google/gemini-2.5-pro",
  "google/gemini-3-flash-preview",
  "openai/gpt-5-mini",
  "openai/gpt-5",
];

function AiProviderPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [provider, setProvider] = useState<"lovable" | "openrouter">("lovable");
  const [lovableModel, setLovableModel] = useState("google/gemini-2.5-flash");
  const [openrouterModel, setOpenrouterModel] = useState("openai/gpt-4o-mini");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [openrouterConnected, setOpenrouterConnected] = useState(false);
  const [openrouterUpdatedAt, setOpenrouterUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate({ to: "/admin/login" }); return; }
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" });
      if (!isAdmin) { await supabase.auth.signOut(); navigate({ to: "/admin/login" }); return; }
      const { data, error } = await supabase.functions.invoke("admin-ai-provider", { body: { action: "get" } });
      if (error || data?.error) { toast.error(data?.error ?? "Gagal memuat pengaturan AI"); setLoading(false); return; }
      setProvider(data.provider === "openrouter" ? "openrouter" : "lovable");
      if (data.lovable_model) setLovableModel(data.lovable_model);
      if (data.openrouter_model) setOpenrouterModel(data.openrouter_model);
      setOpenrouterConnected(Boolean(data.openrouter_connected));
      setOpenrouterUpdatedAt(data.openrouter_updated_at ?? null);
      setLoading(false);
    })();
  }, [navigate]);

  const save = async () => {
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("admin-ai-provider", { body: {
      action: "save", provider, lovable_model: lovableModel.trim(), openrouter_model: openrouterModel.trim(), openrouter_api_key: openrouterKey.trim() || null,
    } });
    setSaving(false);
    if (error || data?.error) { toast.error(data?.error ?? error?.message ?? "Gagal menyimpan pengaturan AI"); return; }
    if (openrouterKey.trim()) { setOpenrouterConnected(true); setOpenrouterUpdatedAt(new Date().toISOString()); setOpenrouterKey(""); }
    toast.success("Pengaturan AI tersimpan");
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="size-8 animate-spin text-accent" /></div>;
  }

  return (
    <AdminShell title="AI Provider (WA Auto-Reply & Pengoreksi Essay)">
      <div className="space-y-6 max-w-3xl">
        <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <Sparkles className="size-5 text-accent" /> Pilih Provider AI
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Provider yang dipilih akan dipakai untuk <strong>AI Auto-Reply WhatsApp</strong> dan <strong>Pengoreksi Essay & Studi Kasus</strong>.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <button
              onClick={() => setProvider("lovable")}
              className={`text-left rounded-2xl border-2 p-4 transition ${provider === "lovable" ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"}`}
            >
              <div className="flex items-center gap-2 font-semibold">
                <Bot className="size-4 text-accent" /> Lovable AI Gateway
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">Bawaan Lovable. Tidak perlu API key. Berbasis kredit workspace.</p>
            </button>
            <button
              onClick={() => setProvider("openrouter")}
              className={`text-left rounded-2xl border-2 p-4 transition ${provider === "openrouter" ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"}`}
            >
              <div className="flex items-center gap-2 font-semibold">
                <Bot className="size-4 text-accent" /> OpenRouter
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">Pakai API key & model OpenRouter sendiri (GPT-4o, Claude, Llama, dll).</p>
            </button>
          </div>
        </section>

        {/* Lovable settings */}
        <section className={`bg-card border rounded-2xl p-6 sm:p-8 space-y-4 ${provider === "lovable" ? "border-accent/40" : "border-border opacity-70"}`}>
          <div>
            <h3 className="font-display text-lg font-semibold">Lovable AI Gateway</h3>
            <p className="text-sm text-muted-foreground">Pilih model Lovable yang akan dipakai.</p>
          </div>
          <div>
            <Label className="text-sm">Model</Label>
            <select
              value={lovableModel}
              onChange={(e) => setLovableModel(e.target.value)}
              className="w-full mt-1 rounded-md border border-input bg-background p-2.5 text-sm font-mono"
            >
              {LOVABLE_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </section>

        {/* OpenRouter settings */}
        <section className={`bg-card border rounded-2xl p-6 sm:p-8 space-y-4 ${provider === "openrouter" ? "border-accent/40" : "border-border opacity-70"}`}>
          <div>
            <h3 className="font-display text-lg font-semibold">OpenRouter</h3>
            <p className="text-sm text-muted-foreground">
              Dapatkan API key di <a className="text-accent underline" href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">openrouter.ai/keys</a> dan pilih model dari{" "}
              <a className="text-accent underline" href="https://openrouter.ai/models" target="_blank" rel="noopener noreferrer">openrouter.ai/models</a>.
            </p>
          </div>
          <div className="rounded-lg border bg-secondary/30 p-3 text-sm flex items-start gap-2">
            <KeyRound className="size-4 mt-0.5 text-accent shrink-0" />
            <div><div className="font-semibold">{openrouterConnected ? "OpenRouter sudah terhubung" : "OpenRouter belum terhubung"}</div><div className="text-xs text-muted-foreground">API key disimpan aman dan tidak ditampilkan kembali.{openrouterUpdatedAt ? ` Terakhir diperbarui ${new Date(openrouterUpdatedAt).toLocaleString("id-ID")}.` : ""}</div></div>
          </div>
          <div>
            <Label className="text-sm">API Key OpenRouter</Label>
            <div className="relative mt-1">
              <Input type={showKey ? "text" : "password"} value={openrouterKey} onChange={(event) => setOpenrouterKey(event.target.value)} placeholder={openrouterConnected ? "Kosongkan jika tidak ingin mengganti" : "sk-or-v1-..."} autoComplete="new-password" className="font-mono pr-11" />
              <button type="button" onClick={() => setShowKey((value) => !value)} aria-label={showKey ? "Sembunyikan API key" : "Tampilkan API key"} className="absolute right-1 top-1 size-8 grid place-items-center text-muted-foreground">{showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
            </div>
          </div>
          <div>
            <Label className="text-sm">Model</Label>
            <Input
              value={openrouterModel}
              onChange={(e) => setOpenrouterModel(e.target.value)}
              placeholder="openai/gpt-4o-mini"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Contoh: <code>openai/gpt-4o-mini</code>, <code>anthropic/claude-3.5-sonnet</code>, <code>google/gemini-2.5-flash</code>, <code>meta-llama/llama-3.3-70b-instruct</code>.
            </p>
          </div>
        </section>

        <div>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-6 py-3 text-sm font-bold shadow-gold disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Simpan Pengaturan AI
          </button>
        </div>
      </div>
    </AdminShell>
  );
}
