import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft, Copy, Eye, EyeOff, KeyRound, Loader2, RefreshCw, ShieldCheck, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";
import { edgeFunctionUrl } from "@/lib/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin/peserta/essay-api")({
  head: () => ({ meta: [{ title: "API Integration — Safar Iman Admin" }] }),
  component: EssayApiPage,
});

function EssayApiPage() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [cbtKey, setCbtKey] = useState("");
  const [publicKey, setPublicKey] = useState("");

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key,value")
        .in("key", ["cbt_api_key", "public_api_key"]);
      const map = new Map((data ?? []).map((r: any) => [r.key, r.value]));
      setCbtKey((map.get("cbt_api_key") ?? "") as string);
      setPublicKey((map.get("public_api_key") ?? "") as string);
      setLoading(false);
    })();
  }, [ready]);

  if (!ready || loading) return <AdminLoading />;

  return (
    <AdminShell title="API Integration">
      <Link to="/admin/peserta/essay" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground -mt-2">
        <ArrowLeft className="size-3.5" /> Kembali ke Daftar Peserta Essay
      </Link>

      <Tabs defaultValue="cbt" className="w-full">
        <TabsList className="h-auto w-full sm:w-auto flex-wrap gap-1 bg-muted p-1">
          <TabsTrigger value="cbt" className="text-xs sm:text-sm">API CBT Integration</TabsTrigger>
          <TabsTrigger value="public" className="text-xs sm:text-sm">API Integration Umum</TabsTrigger>
        </TabsList>

        <TabsContent value="cbt" className="space-y-5 mt-4">
          <CbtSection apiKey={cbtKey} setApiKey={setCbtKey} />
        </TabsContent>

        <TabsContent value="public" className="space-y-5 mt-4">
          <PublicSection apiKey={publicKey} setApiKey={setPublicKey} />
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}

/* --------------------------------- shared --------------------------------- */

function copy(txt: string, label = "Disalin") {
  navigator.clipboard.writeText(txt);
  toast.success(label);
}

function CredentialsCard({
  title, subtitle, baseUrl, apiKey, onRotate, rotating, showKey, setShowKey,
}: {
  title: string; subtitle: string; baseUrl: string; apiKey: string;
  onRotate: () => void; rotating: boolean; showKey: boolean; setShowKey: (v: boolean) => void;
}) {
  const masked = apiKey ? apiKey.slice(0, 8) + "•".repeat(20) + apiKey.slice(-4) : "(belum di-set)";
  return (
    <div className="bg-gradient-to-br from-emerald-deep/95 via-emerald to-emerald-deep text-white border border-emerald-deep/30 rounded-2xl p-5 shadow-emerald">
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-xl bg-white/15 grid place-items-center shrink-0">
          <ShieldCheck className="size-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-lg font-semibold">{title}</div>
          <p className="text-xs text-white/70 mt-0.5">{subtitle}</p>

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
                <button onClick={() => setShowKey(!showKey)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20" title={showKey ? "Sembunyikan" : "Lihat"}>
                  {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
                <button onClick={() => copy(apiKey, "API Key disalin")} className="p-2 rounded-lg bg-white/10 hover:bg-white/20"><Copy className="size-4" /></button>
                <button onClick={onRotate} disabled={rotating} className="p-2 rounded-lg bg-amber-500/30 hover:bg-amber-500/50 disabled:opacity-50" title="Rotate Key">
                  {rotating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
        <code className="font-mono text-sm font-semibold break-all">{baseUrl}{path}</code>
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

/* ---------------------------------- CBT ---------------------------------- */

function CbtSection({ apiKey, setApiKey }: { apiKey: string; setApiKey: (v: string) => void }) {
  const baseUrl = edgeFunctionUrl("cbt-api");
  const [showKey, setShowKey] = useState(false);
  const [rotating, setRotating] = useState(false);

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

  return (
    <>
      <CredentialsCard
        title="Kredensial CBT (Login Peserta)"
        subtitle="Untuk vendor CBT. Peserta login pakai Kode Pendaftaran sebagai token."
        baseUrl={baseUrl}
        apiKey={apiKey}
        onRotate={rotateKey}
        rotating={rotating}
        showKey={showKey}
        setShowKey={setShowKey}
      />

      <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
        <div>
          <div className="font-display text-lg font-semibold">Dokumentasi Endpoint CBT</div>
          <p className="text-xs text-muted-foreground mt-1">
            Otentikasi pakai header <code className="font-mono bg-secondary px-1.5 py-0.5 rounded">Authorization: Bearer &lt;API_KEY&gt;</code>.
          </p>
        </div>

        <Endpoint
          method="POST" path="/verify-token" color="emerald" access="Public (tanpa API key)"
          desc="Dipakai sistem CBT saat peserta login. Validasi kode pendaftaran + memastikan essay sudah dikirim lengkap."
          body={`{ "token": "HXP-XXXXXXXX" }`}
          response={`{
  "ok": true,
  "eligible": true,
  "participant": { "id": "...", "token": "HXP-XXXXXXXX", "full_name": "...", "category": "fully_funded", "status": "interview" }
}`}
          baseUrl={baseUrl}
        />
        <Endpoint
          method="GET" path="/participants" color="blue" access="Butuh API Key"
          desc="List semua peserta yang sudah kirim essay lengkap (calon TPA/LDS)."
          response={`{ "ok": true, "count": 42, "participants": [ /* ... */ ] }`}
          baseUrl={baseUrl}
        />
        <Endpoint
          method="GET" path="/participant/:code" color="blue" access="Butuh API Key"
          desc="Detail satu peserta berdasarkan kode pendaftaran."
          response={`{ "ok": true, "eligible": true, "participant": { /* ... */ } }`}
          baseUrl={baseUrl}
        />

        <a href={baseUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
          Buka health check <ExternalLink className="size-3" />
        </a>
      </div>
    </>
  );
}

/* --------------------------------- Public --------------------------------- */

function PublicSection({ apiKey, setApiKey }: { apiKey: string; setApiKey: (v: string) => void }) {
  const baseUrl = edgeFunctionUrl("public-api");
  const [showKey, setShowKey] = useState(false);
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    if (apiKey) return;
    // Auto-generate on first open so admin can copy immediately.
    (async () => {
      const bytes = crypto.getRandomValues(new Uint8Array(24));
      const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
      const newKey = `pub_${hex}`;
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "public_api_key", value: newKey }, { onConflict: "key" });
      if (!error) setApiKey(newKey);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotateKey = async () => {
    if (!confirm("Rotate Public API Key? Semua integrasi pihak ke-3 HARUS diupdate.")) return;
    setRotating(true);
    try {
      const bytes = crypto.getRandomValues(new Uint8Array(24));
      const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
      const newKey = `pub_${hex}`;
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "public_api_key", value: newKey }, { onConflict: "key" });
      if (error) throw error;
      setApiKey(newKey);
      toast.success("Public API Key baru dibuat.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRotating(false);
    }
  };

  return (
    <>
      <CredentialsCard
        title="Kredensial API Umum"
        subtitle="Untuk integrasi umum pihak ke-2 / ke-3: status seleksi, benefit peserta, validitas pembayaran & kontribusi, jalur pendaftaran (reguler / gelombang / self funded)."
        baseUrl={baseUrl}
        apiKey={apiKey}
        onRotate={rotateKey}
        rotating={rotating}
        showKey={showKey}
        setShowKey={setShowKey}
      />

      <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
        <div>
          <div className="font-display text-lg font-semibold">Dokumentasi Endpoint API Umum</div>
          <p className="text-xs text-muted-foreground mt-1">
            Semua endpoint butuh header <code className="font-mono bg-secondary px-1.5 py-0.5 rounded">Authorization: Bearer &lt;API_KEY&gt;</code>.
            Response berisi status seleksi, benefit sesuai jalur, validitas pembayaran, dan validitas kontribusi.
          </p>
        </div>

        <Endpoint
          method="GET" path="/participants" color="blue" access="Butuh API Key"
          desc="List semua peserta. Filter opsional via query: ?category=fully_funded|partial_funded|self_funded|gelombang_1|gelombang_2, ?status=pending|berkas|essay|interview|accepted|rejected, ?paid=1 (hanya yang pembayaran valid), ?limit=500."
          response={`{
  "ok": true,
  "count": 120,
  "participants": [
    {
      "id": "...",
      "registration_code": "HXP-XXXXXXXX",
      "full_name": "Nama Peserta",
      "category": "gelombang_1",
      "category_label": "Fast Track Gelombang 1",
      "status": "essay",
      "status_label": "Seleksi Essay & Studi Kasus",
      "payment":      { "status": "paid",   "valid": true, "paid_at": "..." },
      "contribution": { "status": "paid",   "valid": true, "paid_at": "..." },
      "benefits": [ "Fast track masuk seleksi tanpa antre reguler", "..." ],
      "selection": {
        "berkas_confirmed_at": "...",
        "essay_submitted": true,
        "tka_status": "lolos",
        "interview_status": null
      }
    }
  ]
}`}
          baseUrl={baseUrl}
        />

        <Endpoint
          method="GET" path="/participant/:code" color="blue" access="Butuh API Key"
          desc="Detail lengkap 1 peserta (termasuk email, whatsapp, kota, pendidikan, dsb) berdasarkan kode pendaftaran."
          response={`{
  "ok": true,
  "participant": {
    "registration_code": "HXP-XXXXXXXX",
    "full_name": "...",
    "email": "...",
    "whatsapp": "...",
    "category": "fully_funded",
    "category_label": "Fully Funded",
    "status": "interview",
    "status_label": "Tahap TKA / Interview",
    "payment":      { "valid": true,  "status": "paid",   "paid_at": "..." },
    "contribution": { "valid": true,  "status": "paid",   "paid_at": "..." },
    "benefits": [ "Biaya perjalanan umrah ditanggung penuh oleh Program Safar Iman", "..." ],
    "selection": { "essay_submitted": true, "tka_status": "lolos", "interview_status": "lolos" }
  }
}`}
          baseUrl={baseUrl}
        />

        <Endpoint
          method="GET" path="/status/:code" color="blue" access="Butuh API Key"
          desc="Status ringkas peserta — cocok untuk widget tracking pihak ke-3. Tidak mengembalikan PII lengkap."
          response={`{
  "ok": true,
  "status": {
    "registration_code": "HXP-XXXXXXXX",
    "full_name": "...",
    "category_label": "Fast Track Gelombang 2",
    "status_label": "Seleksi Berkas",
    "payment": { "valid": true }, "contribution": { "valid": false },
    "selection": { "essay_submitted": false, "tka_status": null, "interview_status": null }
  }
}`}
          baseUrl={baseUrl}
        />

        <Endpoint
          method="GET" path="/stats" color="blue" access="Butuh API Key"
          desc="Agregat total peserta per kategori & per status, plus jumlah yang pembayaran dan kontribusinya valid."
          response={`{
  "ok": true,
  "total": 340,
  "by_category": { "fully_funded": 40, "partial_funded": 60, "self_funded": 120, "gelombang_1": 70, "gelombang_2": 50 },
  "by_status":   { "pending": 20, "berkas": 90, "essay": 100, "interview": 80, "accepted": 40, "rejected": 10 },
  "payment_valid": 210,
  "contribution_valid": 190
}`}
          baseUrl={baseUrl}
        />

        <div className="bg-secondary/40 rounded-xl p-4 text-xs space-y-2">
          <div className="font-semibold uppercase tracking-wider text-muted-foreground">Catatan</div>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground leading-relaxed">
            <li><strong>payment.valid = true</strong> berarti Mayar sudah konfirmasi pembayaran pendaftaran (jalur Gelombang 1 / 2).</li>
            <li><strong>contribution.valid = true</strong> berarti kontribusi (donasi) untuk jalur Fully / Partial Funded sudah lunas.</li>
            <li><strong>benefits</strong> otomatis menyesuaikan jalur pendaftaran peserta.</li>
            <li>Setelah rotate key, seluruh integrasi pihak ke-3 harus update credential — key lama langsung invalid.</li>
          </ul>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="font-display text-lg font-semibold mb-2">Quick Test (cURL)</div>
        <pre className="bg-black/90 text-emerald-300 text-xs p-4 rounded-lg overflow-x-auto whitespace-pre">
{`# List peserta yang pembayarannya valid
curl "${baseUrl}/participants?paid=1" \\
  -H "Authorization: Bearer ${showKey ? apiKey : "<API_KEY>"}"

# Detail peserta
curl "${baseUrl}/participant/HXP-XXXXXXXX" \\
  -H "Authorization: Bearer ${showKey ? apiKey : "<API_KEY>"}"

# Agregat statistik
curl "${baseUrl}/stats" \\
  -H "Authorization: Bearer ${showKey ? apiKey : "<API_KEY>"}"`}
        </pre>
        <a href={baseUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-2">
          Buka health check <ExternalLink className="size-3" />
        </a>
      </div>
    </>
  );
}
