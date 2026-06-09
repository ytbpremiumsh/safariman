import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search, Download, Copy, Eye, Loader2, FileText, KeyRound, RefreshCw,
  CheckCircle2, ExternalLink, ShieldCheck,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";
import { edgeFunctionUrl } from "@/lib/api";

export const Route = createFileRoute("/admin/peserta/essay")({
  head: () => ({ meta: [{ title: "Peserta Lolos Essay — Safar Iman Admin" }] }),
  component: PesertaEssayPage,
});

type Category = "fully_funded" | "partial_funded" | "self_funded" | "gelombang_1" | "gelombang_2";
type Status = "pending" | "reviewed" | "interview" | "accepted" | "rejected";

type Row = {
  id: string;
  registration_code: string;
  full_name: string;
  email: string;
  whatsapp: string;
  gender: string;
  birth_date: string;
  city: string;
  education: string;
  occupation: string;
  category: Category | null;
  status: Status;
  essay_worthy: string;
  essay_dream: string;
  essay_contribution: string;
  cv_url: string | null;
  photo_url: string | null;
  donation_status: string;
  donation_paid_at: string | null;
  created_at: string;
};

const CAT_LABEL: Record<Category, string> = {
  fully_funded: "Fully Funded",
  partial_funded: "Partial Funded",
  self_funded: "Self Funded",
  gelombang_1: "Fast Track G1",
  gelombang_2: "Fast Track G2",
};

const STATUS_LABEL: Record<Status, string> = {
  pending: "Menunggu",
  reviewed: "Direview",
  interview: "Lanjut TPA/LDS",
  accepted: "Lolos",
  rejected: "Belum Lolos",
};

function PesertaEssayPage() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [detail, setDetail] = useState<Row | null>(null);

  // CBT API key
  const [apiKey, setApiKey] = useState("");
  const [rotating, setRotating] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const baseUrl = edgeFunctionUrl("cbt-api");

  const reload = async () => {
    setLoading(true);
    const [{ data, error }, { data: cfg }] = await Promise.all([
      supabase.rpc("list_essay_complete_participants"),
      supabase.from("app_settings").select("value").eq("key", "cbt_api_key").maybeSingle(),
    ]);
    if (error) toast.error(error.message);
    else setRows((data ?? []) as Row[]);
    setApiKey((cfg?.value ?? "") as string);
    setLoading(false);
  };

  useEffect(() => {
    if (!ready) return;
    void reload();
  }, [ready]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!term) return true;
      return [r.full_name, r.email, r.whatsapp, r.city, r.registration_code]
        .some((v) => v?.toLowerCase().includes(term));
    });
  }, [rows, q, statusFilter]);

  const stats = useMemo(() => ({
    total: rows.length,
    interview: rows.filter((r) => r.status === "interview").length,
    accepted: rows.filter((r) => r.status === "accepted").length,
    pending: rows.filter((r) => r.status === "pending" || r.status === "reviewed").length,
  }), [rows]);

  const updateStatus = async (id: string, s: Status) => {
    const { error } = await supabase.from("participants").update({ status: s }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setRows((p) => p.map((r) => r.id === id ? { ...r, status: s } : r));
    if (detail?.id === id) setDetail({ ...detail, status: s });
    toast.success("Status diperbarui");
  };

  const exportExcel = () => {
    const data = filtered.map((r) => ({
      Token: r.registration_code,
      Nama: r.full_name,
      Email: r.email,
      WhatsApp: r.whatsapp,
      Gender: r.gender,
      "Tanggal Lahir": r.birth_date,
      Kota: r.city,
      Pendidikan: r.education,
      Pekerjaan: r.occupation,
      Kategori: r.category ? CAT_LABEL[r.category] : "-",
      Status: STATUS_LABEL[r.status],
      Donasi: r.donation_status === "paid" ? "Valid" : r.donation_status,
      "Essay Layak": r.essay_worthy,
      "Essay Impian": r.essay_dream,
      "Essay Kontribusi": r.essay_contribution,
      CV: r.cv_url ?? "",
      Foto: r.photo_url ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Essay");
    XLSX.writeFile(wb, `safar-iman-essay-${Date.now()}.xlsx`);
    toast.success(`${data.length} data diekspor`);
  };

  const copy = (txt: string, label = "Disalin") => {
    navigator.clipboard.writeText(txt);
    toast.success(label);
  };

  const rotateKey = async () => {
    if (!confirm("Rotate CBT API Key? Sistem CBT eksternal harus diupdate dengan key baru.")) return;
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
      toast.success("API Key baru dibuat");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRotating(false);
    }
  };

  if (!ready || loading) return <AdminLoading />;

  return (
    <AdminShell title="Peserta Lolos Essay (Calon TPA/LDS)">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Kirim Essay", value: stats.total, color: "text-emerald" },
          { label: "Menunggu Seleksi", value: stats.pending, color: "text-amber-600" },
          { label: "Lanjut TPA/LDS", value: stats.interview, color: "text-accent" },
          { label: "Lolos Final", value: stats.accepted, color: "text-emerald" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className={`text-2xl font-display font-semibold mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* CBT API Card */}
      <div className="bg-gradient-to-br from-emerald-deep/95 via-emerald to-emerald-deep text-white border border-emerald-deep/30 rounded-2xl p-5 shadow-emerald">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl bg-white/15 grid place-items-center shrink-0">
            <ShieldCheck className="size-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-lg font-semibold">API Integrasi CBT</div>
            <p className="text-xs text-white/70 mt-0.5">
              Untuk pihak ke-2/3 (penyedia CBT). Peserta login pakai <strong>Kode Pendaftaran</strong> sebagai token.
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
                  <KeyRound className="size-3" /> API Key (Authorization: Bearer …)
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate bg-black/25 rounded-lg px-3 py-2 font-mono text-xs">
                    {showKey ? apiKey : apiKey.replace(/./g, "•").slice(0, 28) + "…"}
                  </code>
                  <button onClick={() => setShowKey((v) => !v)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20" title="Lihat">
                    <Eye className="size-4" />
                  </button>
                  <button onClick={() => copy(apiKey, "API Key disalin")} className="p-2 rounded-lg bg-white/10 hover:bg-white/20"><Copy className="size-4" /></button>
                  <button onClick={rotateKey} disabled={rotating} className="p-2 rounded-lg bg-amber-500/30 hover:bg-amber-500/50 disabled:opacity-50" title="Rotate">
                    {rotating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                  </button>
                </div>
              </div>

              <details className="bg-black/20 rounded-lg p-3 text-xs">
                <summary className="cursor-pointer font-semibold">Endpoints &amp; contoh request</summary>
                <div className="mt-3 space-y-3 font-mono leading-relaxed">
                  <div>
                    <div className="text-accent">POST {baseUrl}/verify-token</div>
                    <div className="text-white/70">Public · login peserta di CBT</div>
                    <pre className="mt-1 whitespace-pre-wrap bg-black/30 p-2 rounded">{`{ "token": "HXP-XXXXXXXX" }`}</pre>
                  </div>
                  <div>
                    <div className="text-accent">GET {baseUrl}/participants</div>
                    <div className="text-white/70">Header: Authorization: Bearer &lt;API_KEY&gt;</div>
                  </div>
                  <div>
                    <div className="text-accent">GET {baseUrl}/participant/HXP-XXXXXXXX</div>
                    <div className="text-white/70">Header: Authorization: Bearer &lt;API_KEY&gt;</div>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, kode token, email, WA, kota…" className="pl-9" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Status | "all")}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="reviewed">Direview</option>
          <option value="interview">Lanjut TPA/LDS</option>
          <option value="accepted">Lolos</option>
          <option value="rejected">Belum Lolos</option>
        </select>
        <button onClick={exportExcel} className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-emerald text-accent px-4 py-2 text-sm font-semibold shadow-emerald hover-lift">
          <Download className="size-4" /> Export
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
              <tr>
                <Th>Token CBT</Th><Th>Nama</Th><Th>Kategori</Th>
                <Th>Kontak</Th><Th>Kota</Th><Th>Status Seleksi</Th><Th>Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">Belum ada peserta yang kirim essay lengkap.</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="px-3 py-3">
                    <button onClick={() => copy(r.registration_code, `Token ${r.registration_code} disalin`)} className="inline-flex items-center gap-1 font-mono text-xs px-2 py-1 rounded-md bg-accent/15 text-accent hover:bg-accent/25">
                      {r.registration_code} <Copy className="size-3" />
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{r.full_name}</div>
                    <div className="text-xs text-muted-foreground">{r.education}</div>
                  </td>
                  <td className="px-3 py-3 text-xs">{r.category ? CAT_LABEL[r.category] : "—"}</td>
                  <td className="px-3 py-3">
                    <div className="text-xs">{r.email}</div>
                    <div className="text-xs text-muted-foreground">{r.whatsapp}</div>
                  </td>
                  <td className="px-3 py-3 text-xs">{r.city}</td>
                  <td className="px-3 py-3">
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value as Status)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={() => setDetail(r)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-secondary">
                      <FileText className="size-3.5" /> Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {detail.full_name}
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-accent/15 text-accent">{detail.registration_code}</span>
                </DialogTitle>
                <DialogDescription>
                  {detail.category ? CAT_LABEL[detail.category] : "—"} · {detail.city}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Email" value={detail.email} />
                <Info label="WhatsApp" value={detail.whatsapp} />
                <Info label="Gender" value={detail.gender} />
                <Info label="Tanggal Lahir" value={detail.birth_date} />
                <Info label="Pendidikan" value={detail.education} />
                <Info label="Pekerjaan" value={detail.occupation} />
                <Info label="Donasi" value={detail.donation_status === "paid" ? "Valid" : detail.donation_status} />
                <Info label="Status Seleksi" value={STATUS_LABEL[detail.status]} />
              </div>

              {(detail.cv_url || detail.photo_url) && (
                <div className="flex gap-2 flex-wrap">
                  {detail.cv_url && (
                    <a href={detail.cv_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-secondary">
                      CV <ExternalLink className="size-3" />
                    </a>
                  )}
                  {detail.photo_url && (
                    <a href={detail.photo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-secondary">
                      Foto <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              )}

              <Essay title="Mengapa kamu layak?" body={detail.essay_worthy} />
              <Essay title="Impian setelah umrah" body={detail.essay_dream} />
              <Essay title="Kontribusi untuk umat" body={detail.essay_contribution} />

              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                <button onClick={() => updateStatus(detail.id, "interview")} className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md bg-accent text-accent-foreground hover:opacity-90">
                  <CheckCircle2 className="size-3.5" /> Lanjutkan ke TPA/LDS
                </button>
                <button onClick={() => updateStatus(detail.id, "rejected")} className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border border-red-300 text-red-600 hover:bg-red-50">
                  Belum Lolos
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-3 py-2.5 font-semibold">{children}</th>;
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/40 rounded-lg p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-medium text-foreground mt-0.5 break-words">{value || "—"}</div>
    </div>
  );
}
function Essay({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="text-xs font-semibold text-accent mb-1">{title}</div>
      <div className="text-sm whitespace-pre-wrap bg-secondary/40 rounded-lg p-3 leading-relaxed">{body || "—"}</div>
    </div>
  );
}
