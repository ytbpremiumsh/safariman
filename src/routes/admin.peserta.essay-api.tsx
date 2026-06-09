import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft, Copy, Eye, EyeOff, KeyRound, Loader2, RefreshCw, ShieldCheck, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";
import { edgeFunctionUrl } from "@/lib/api";

export const Route = createFileRoute("/admin/peserta/essay-api")({
  head: () => ({ meta: [{ title: "API CBT Integration — Safar Iman Admin" }] }),
  component: EssayApiPage,
});

function EssayApiPage() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [rotating, setRotating] = useState(false);
  const baseUrl = edgeFunctionUrl("cbt-api");

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data } = await supabase.from("app_settings").select("value").eq("key", "cbt_api_key").maybeSingle();
      setApiKey((data?.value ?? "") as string);
      setLoading(false);
    })();
  }, [ready]);

  const copy = (txt: string, label = "Disalin") => {
    navigator.clipboard.writeText(txt);
    toast.success(label);
  };

  const rotateKey = async () => {
    if (!confirm("Rotate CBT API Key? Sistem CBT eksternal HARUS diupdate dengan key baru.")) return;
    setRotating(true);
    try {
      const bytes = crypto.getRandomValues(new Uint8Array(24));
      const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
      const newKey = `cbt_${hex}`;
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "cbt_api_key", value: newKey }, { onConflict: "key" });
      if (error) throw error;
      setApiKey(newKey);
      toast.success("API Key baru dibuat. Segera update di sistem CBT.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRotating(false);
    }
  };

  if (!ready || loading) return <AdminLoading />;

  const masked = apiKey ? apiKey.slice(0, 8) + "•".repeat(20) + apiKey.slice(-4) : "(belum di-set)";

  return (
    <AdminShell title="API CBT Integration">
      <Link to="/admin/peserta/essay" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground -mt-2">
        <ArrowLeft className="size-3.5" /> Kembali ke Daftar Peserta Essay
      </Link>

      {/* Credentials */}
      <div className="bg-gradient-to-br from-emerald-deep/95 via-emerald to-emerald-deep text-white border border-emerald-deep/30 rounded-2xl p-5 shadow-emerald">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl bg-white/15 grid place-items-center shrink-0">
            <ShieldCheck className="size-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-lg font-semibold">Kredensial untuk Pihak Ke-2 / Ke-3</div>
            <p className="text-xs text-white/70 mt-0.5">
              Berikan <strong>Base URL</strong> + <strong>API Key</strong> ke vendor CBT. Peserta login pakai <strong>Kode Pendaftaran</strong> mereka sebagai token.
            </p>

            <div className="mt-4 grid gap-3 text-sm">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-white/60 mb-1">Base URL</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate bg-black/25 rounded-lg px-3 py-2 font-mono text-xs">{baseUrl}</code>
                  <button onClick={() => copy(baseUrl, "Base URL disalin")} className="p-2 rounded-lg bg-white/10 hover:bg-white/20"><Copy className="size-4" /></button>
                </div>
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-wider text-white/60 mb-1 flex items-center gap-2">
                  <KeyRound className="size-3" /> API Key (Header: Authorization: Bearer …)
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate bg-black/25 rounded-lg px-3 py-2 font-mono text-xs">{showKey ? apiKey : masked}</code>
                  <button onClick={() => setShowKey((v) => !v)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20" title={showKey ? "Sembunyikan" : "Lihat"}>
                    {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                  <button onClick={() => copy(apiKey, "API Key disalin")} className="p-2 rounded-lg bg-white/10 hover:bg-white/20"><Copy className="size-4" /></button>
                  <button onClick={rotateKey} disabled={rotating} className="p-2 rounded-lg bg-amber-500/30 hover:bg-amber-500/50 disabled:opacity-50" title="Rotate Key">
                    {rotating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Docs */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
        <div>
          <div className="font-display text-lg font-semibold">Dokumentasi Endpoint</div>
          <p className="text-xs text-muted-foreground mt-1">
            Semua endpoint mengembalikan JSON. Otentikasi pakai header <code className="font-mono bg-secondary px-1.5 py-0.5 rounded">Authorization: Bearer &lt;API_KEY&gt;</code>.
          </p>
        </div>

        <Endpoint
          method="POST"
          path="/verify-token"
          color="emerald"
          access="Public (tanpa API key)"
          desc="Dipakai sistem CBT saat peserta login. Validasi kode pendaftaran + memastikan essay sudah dikirim lengkap."
          body={`{
  "token": "HXP-XXXXXXXX"
}`}
          response={`{
  "ok": true,
  "eligible": true,
  "participant": {
    "id": "...",
    "token": "HXP-XXXXXXXX",
    "registration_code": "HXP-XXXXXXXX",
    "full_name": "Nama Lengkap",
    "email": "email@example.com",
    "whatsapp": "0812...",
    "category": "fully_funded",
    "category_label": "Fully Funded",
    "status": "interview",
    "essay": { "worthy": "...", "dream": "...", "contribution": "..." }
  }
}`}
          baseUrl={baseUrl}
        />

        <Endpoint
          method="GET"
          path="/participants"
          color="blue"
          access="Butuh API Key"
          desc="List semua peserta yang sudah kirim essay lengkap (calon TPA/LDS)."
          response={`{
  "ok": true,
  "count": 42,
  "participants": [ /* array of participant objects */ ]
}`}
          baseUrl={baseUrl}
        />

        <Endpoint
          method="GET"
          path="/participant/:code"
          color="blue"
          access="Butuh API Key"
          desc="Detail satu peserta berdasarkan kode pendaftaran."
          response={`{
  "ok": true,
  "eligible": true,
  "participant": { /* participant object */ }
}`}
          baseUrl={baseUrl}
        />

        <div className="bg-secondary/40 rounded-xl p-4 text-xs space-y-2">
          <div className="font-semibold uppercase tracking-wider text-muted-foreground">Catatan Penting</div>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground leading-relaxed">
            <li>Peserta <strong>self funded</strong> tidak masuk daftar CBT (tidak lanjut TPA/LDS).</li>
            <li>Endpoint <code className="font-mono">/verify-token</code> mengembalikan <code className="font-mono">403</code> bila essay belum lengkap.</li>
            <li>Setelah rotate key, vendor CBT harus update credential di sisi mereka. Key lama langsung invalid.</li>
            <li>Status seleksi (lolos / tidak) diatur dari halaman <Link to="/admin/peserta/essay" className="text-accent hover:underline">Daftar Peserta Essay</Link>.</li>
          </ul>
        </div>
      </div>

      {/* Quick test */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="font-display text-lg font-semibold mb-2">Quick Test (cURL)</div>
        <pre className="bg-black/90 text-emerald-300 text-xs p-4 rounded-lg overflow-x-auto whitespace-pre">
{`# Verify token (public)
curl -X POST "${baseUrl}/verify-token" \\
  -H "Content-Type: application/json" \\
  -d '{"token":"HXP-XXXXXXXX"}'

# List participants (protected)
curl "${baseUrl}/participants" \\
  -H "Authorization: Bearer ${showKey ? apiKey : "<API_KEY>"}"`}
        </pre>
        <a href={baseUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-2">
          Buka health check <ExternalLink className="size-3" />
        </a>
      </div>
    </AdminShell>
  );
}

function Endpoint({
  method, path, color, access, desc, body, response, baseUrl,
}: {
  method: "GET" | "POST"; path: string; color: "emerald" | "blue"; access: string; desc: string;
  body?: string; response: string; baseUrl: string;
}) {
  const methodColor = color === "emerald" ? "bg-emerald text-white" : "bg-blue-600 text-white";
  return (
    <div className="border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-bold px-2 py-1 rounded ${methodColor}`}>{method}</span>
        <code className="font-mono text-sm font-semibold">{baseUrl}{path}</code>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">{access}</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      {body && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Request Body</div>
          <pre className="bg-secondary/60 text-xs p-3 rounded-lg overflow-x-auto whitespace-pre font-mono">{body}</pre>
        </div>
      )}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Response (success)</div>
        <pre className="bg-secondary/60 text-xs p-3 rounded-lg overflow-x-auto whitespace-pre font-mono">{response}</pre>
      </div>
    </div>
  );
}
