import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search, Download, Copy, FileText, CheckCircle2, XCircle, FileDown, Image as ImageIcon,
  ShieldCheck, ArrowRight, HeartHandshake, Sparkles, Loader2, Megaphone, EyeOff, Bot,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/peserta/essay")({
  head: () => ({ meta: [{ title: "Peserta Lolos Essay — Safar Iman Admin" }] }),
  component: PesertaEssayPage,
});

type Category = "fully_funded" | "partial_funded" | "self_funded" | "gelombang_1" | "gelombang_2";
type Status = "reviewed" | "interview" | "rejected";

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
  case_study_1: string | null;
  case_study_2: string | null;
  cv_url: string | null;
  photo_url: string | null;
  donation_status: string;
  donation_paid_at: string | null;
  essay_ai_score: number | null;
  essay_ai_percent: number | null;
  essay_ai_verdict: "layak" | "tidak_layak" | "ragu" | null;
  essay_ai_summary: string | null;
  essay_ai_graded_at: string | null;
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
  reviewed: "Sedang Direview",
  interview: "Lolos Tahap Selanjutnya",
  rejected: "Belum Lolos",
};

const STATUS_STYLE: Record<Status, string> = {
  reviewed: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/30",
  interview: "bg-emerald/15 text-emerald border-emerald/40",
  rejected: "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/30",
};

const normalizeStatus = (s: string): Status =>
  s === "interview" || s === "accepted" ? "interview"
  : s === "rejected" ? "rejected"
  : "reviewed";

function PesertaEssayPage() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [detail, setDetail] = useState<Row | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [published, setPublished] = useState(false);
  const [pubBusy, setPubBusy] = useState(false);

  const reload = async () => {
    setLoading(true);
    const [{ data, error }, settingRes] = await Promise.all([
      supabase.rpc("list_essay_complete_participants"),
      supabase.from("app_settings").select("value").eq("key", "essay_results_published").maybeSingle(),
    ]);
    if (error) toast.error(error.message);
    else setRows(((data ?? []) as Row[]).map((r) => ({ ...r, status: normalizeStatus(r.status as string) })));
    setPublished((settingRes.data?.value ?? "false") === "true");
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
    pending: rows.filter((r) => r.status === "reviewed").length,
    lolos: rows.filter((r) => r.status === "interview").length,
    tidak: rows.filter((r) => r.status === "rejected").length,
  }), [rows]);

  const allDecided = rows.length > 0 && rows.every((r) => r.status === "interview" || r.status === "rejected");

  const updateStatus = async (id: string, s: Status) => {
    const { error } = await supabase.from("participants").update({ status: s }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setRows((p) => p.map((r) => r.id === id ? { ...r, status: s } : r));
    if (detail?.id === id) setDetail({ ...detail, status: s });
    toast.success(`Status: ${STATUS_LABEL[s]}`);
  };

  const togglePublish = async (next: boolean) => {
    setPubBusy(true);
    const { error } = await supabase.rpc("admin_set_setting", { p_key: "essay_results_published", p_value: next ? "true" : "false" });
    setPubBusy(false);
    if (error) { toast.error(error.message); return; }
    setPublished(next);
    toast.success(next ? "Hasil Essay dipublikasikan ke peserta" : "Publikasi hasil Essay ditahan");
  };

  const runAiGrade = async (row: Row) => {
    setAiBusy(true);
    const { data, error } = await supabase.functions.invoke("essay-ai-grade", {
      body: { participant_id: row.id },
    });
    setAiBusy(false);
    if (error) { toast.error(error.message ?? "Gagal menjalankan koreksi AI"); return; }
    const res = (data as any)?.result;
    if (!res) { toast.error("Respons AI tidak valid"); return; }
    const patched: Row = {
      ...row,
      essay_ai_score: res.score,
      essay_ai_percent: res.ai_used_percent,
      essay_ai_verdict: res.verdict,
      essay_ai_summary: res.summary,
      essay_ai_graded_at: new Date().toISOString(),
    };
    setRows((p) => p.map((r) => r.id === row.id ? patched : r));
    if (detail?.id === row.id) setDetail(patched);
    toast.success("Koreksi AI selesai");
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
      Keputusan: STATUS_LABEL[r.status],
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

  if (!ready || loading) return <AdminLoading />;

  return (
    <AdminShell title="Peserta Telah Mengirim Essay">
      {/* Header actions — link to API docs in separate page */}
      <div className="flex flex-wrap gap-2 items-center justify-between -mt-3">
        <p className="text-sm text-muted-foreground">
          Tentukan keputusan kelulusan tiap peserta untuk lanjut ke tahap <strong>TPA / LDS</strong>.
        </p>
        <div className="flex gap-2">
          <Link
            to="/admin/pengaturan/hasil-seleksi"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border bg-card hover:bg-secondary"
          >
            <CheckCircle2 className="size-3.5" /> Pengaturan Halaman Pengumuman
          </Link>
          <Link
            to="/admin/peserta/essay-api"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-gradient-emerald text-accent shadow-emerald hover-lift font-semibold"
          >
            <ShieldCheck className="size-3.5" /> API CBT &amp; Dokumentasi <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Kirim Essay", value: stats.total, color: "text-foreground" },
          { label: "Belum Diputuskan", value: stats.pending, color: "text-amber-600" },
          { label: "LOLOS (Lanjut)", value: stats.lolos, color: "text-emerald" },
          { label: "Tidak Lolos", value: stats.tidak, color: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className={`text-2xl font-display font-semibold mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
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
          <option value="all">Semua Keputusan</option>
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
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
                <Th>Kontak</Th><Th>Kota</Th><Th>Keputusan</Th><Th>Aksi Cepat</Th>
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
                      className={"h-8 rounded-md border px-2 text-xs font-medium " + STATUS_STYLE[r.status]}
                    >
                      {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setDetail(r)} className="inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded-md border border-border hover:bg-secondary" title="Detail">
                        <FileText className="size-3.5" />
                      </button>
                      <button
                        onClick={() => updateStatus(r.id, "interview")}
                        disabled={r.status === "interview"}
                        title="Loloskan"
                        className="inline-flex items-center text-xs px-2 py-1.5 rounded-md bg-emerald/15 text-emerald hover:bg-emerald/25 disabled:opacity-40"
                      >
                        <CheckCircle2 className="size-3.5" />
                      </button>
                      <button
                        onClick={() => updateStatus(r.id, "rejected")}
                        disabled={r.status === "rejected"}
                        title="Tidak loloskan"
                        className="inline-flex items-center text-xs px-2 py-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-40 dark:bg-red-950/30"
                      >
                        <XCircle className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl flex items-center gap-2 flex-wrap">
                  {detail.full_name}
                  <span className={"text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border " + STATUS_STYLE[detail.status]}>
                    {STATUS_LABEL[detail.status]}
                  </span>
                </DialogTitle>
                <DialogDescription>
                  Kode <span className="font-mono text-foreground">{detail.registration_code}</span>
                  {" · "}Terdaftar {new Date(detail.created_at).toLocaleString("id-ID")}
                </DialogDescription>
              </DialogHeader>

              {/* Identitas */}
              <div className="grid sm:grid-cols-[120px,1fr] gap-4 mt-2">
                {detail.photo_url && (
                  <img src={detail.photo_url} alt={detail.full_name} className="size-28 rounded-xl object-cover border border-border" />
                )}
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <KV k="Email" v={detail.email} />
                  <KV k="WhatsApp" v={detail.whatsapp} />
                  <KV k="Gender" v={detail.gender} />
                  <KV k="Tanggal Lahir" v={detail.birth_date} />
                  <KV k="Kota" v={detail.city} />
                  <KV k="Pendidikan" v={detail.education} />
                  <KV k="Pekerjaan" v={detail.occupation} />
                  <KV k="Kategori" v={detail.category ? CAT_LABEL[detail.category] : "—"} />
                </div>
              </div>

              {/* Berkas + donasi */}
              <div className="mt-5 flex flex-wrap gap-2">
                {detail.cv_url && (
                  <button
                    onClick={async () => {
                      const { data, error } = await supabase.storage.from("participant-cv").createSignedUrl(detail.cv_url!, 60);
                      if (error || !data) { toast.error("Gagal generate link"); return; }
                      const a = document.createElement("a");
                      a.href = data.signedUrl; a.download = `${detail.full_name}-CV.pdf`; a.target = "_blank";
                      document.body.appendChild(a); a.click(); a.remove();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald/10 text-emerald px-4 py-2 text-sm font-medium hover:bg-emerald/20"
                  >
                    <FileDown className="size-4" /> Download CV
                  </button>
                )}
                {detail.photo_url && (
                  <a href={detail.photo_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 text-accent px-4 py-2 text-sm font-medium hover:bg-accent/25">
                    <ImageIcon className="size-4" /> Lihat Foto
                  </a>
                )}
                {detail.donation_status === "paid" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold border bg-gradient-gold text-emerald-deep border-accent/40">
                    <HeartHandshake className="size-4" /> Donasi Valid
                    {detail.donation_paid_at ? ` · ${new Date(detail.donation_paid_at).toLocaleDateString("id-ID")}` : ""}
                  </span>
                )}
              </div>

              {/* Essays */}
              <div className="mt-6 space-y-4">
                <Essay title="Kenapa kamu layak dipilih?" body={detail.essay_worthy} />
                <Essay title="Apa impianmu setelah ke Tanah Suci?" body={detail.essay_dream} />
                <Essay title="Bagaimana kontribusimu untuk umat?" body={detail.essay_contribution} />
              </div>

              {/* Keputusan */}
              <div className="mt-6 pt-4 border-t border-border space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tentukan Keputusan Essay</div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => updateStatus(detail.id, "reviewed")}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition ${
                      detail.status === "reviewed" ? "bg-amber-500 text-white border-amber-500" : "border-amber-500/40 text-amber-600 hover:bg-amber-500/10"
                    }`}>
                    Sedang Direview
                  </button>
                  <button onClick={() => updateStatus(detail.id, "interview")}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition ${
                      detail.status === "interview" ? "bg-emerald text-white border-emerald shadow-emerald" : "border-emerald/40 text-emerald hover:bg-emerald/10"
                    }`}>
                    <CheckCircle2 className="size-4" /> Lolos Tahap Selanjutnya
                  </button>
                  <button onClick={() => updateStatus(detail.id, "rejected")}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition ${
                      detail.status === "rejected" ? "bg-red-500 text-white border-red-500" : "border-red-500/40 text-red-600 hover:bg-red-500/10"
                    }`}>
                    <XCircle className="size-4" /> Belum Lolos
                  </button>
                </div>
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
function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground w-24 shrink-0">{k}</span>
      <span className="font-medium break-all">{v || "—"}</span>
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
