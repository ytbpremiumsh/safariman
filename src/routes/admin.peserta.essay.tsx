import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { isFeatureEnabled } from "@/lib/features";

import {
  Search, Download, Copy, FileText, CheckCircle2, XCircle, FileDown, Image as ImageIcon,
  ShieldCheck, ArrowRight, HeartHandshake, Sparkles, Loader2, Megaphone, EyeOff, Bot,
  Inbox, MailQuestion, MessageCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";
import { ManualEssayReview, type ReviewDecision, type ReviewScores } from "@/components/ManualEssayReview";

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
  case_study_3: string | null;
  case_study_4: string | null;
  case_study_5: string | null;
  case_study_6: string | null;
  case_study_7: string | null;
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

type PendingRow = {
  id: string;
  registration_code: string;
  full_name: string;
  email: string;
  whatsapp: string;
  city: string;
  education: string;
  category: Category | null;
  has_essay_worthy: boolean;
  has_essay_dream: boolean;
  has_essay_contribution: boolean;
  has_case_study_1: boolean;
  has_case_study_2: boolean;
  has_case_study_3: boolean;
  has_case_study_4: boolean;
  has_case_study_5: boolean;
  has_case_study_6: boolean;
  has_case_study_7: boolean;
  updated_at: string;
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
  reviewed: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/30 dark:text-amber-200",
  interview: "bg-emerald text-primary-foreground border-emerald shadow-soft",
  rejected: "bg-destructive text-destructive-foreground border-destructive shadow-soft",
};

const normalizeStatus = (s: string): Status =>
  s === "interview" || s === "accepted" ? "interview"
  : s === "rejected" ? "rejected"
  : "reviewed";

const PENDING_PAGE_SIZE = 1000;

async function loadAllPendingEssayParticipants(): Promise<PendingRow[]> {
  const allRows: PendingRow[] = [];

  for (let from = 0; ; from += PENDING_PAGE_SIZE) {
    const { data, error } = await (supabase.rpc as any)("list_essay_pending_participants")
      .order("id", { ascending: true })
      .range(from, from + PENDING_PAGE_SIZE - 1);

    if (error) throw error;

    const page = (data ?? []) as PendingRow[];
    allRows.push(...page);
    if (page.length < PENDING_PAGE_SIZE) break;
  }

  // Defensive deduplication in case the underlying data changes between pages.
  return Array.from(new Map(allRows.map((row) => [row.id, row])).values());
}

function PesertaEssayPage() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [pendingRows, setPendingRows] = useState<PendingRow[]>([]);
  const [tab, setTab] = useState<"sent" | "pending">("sent");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [detail, setDetail] = useState<Row | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [published, setPublished] = useState(false);
  const [pubBusy, setPubBusy] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [detailScores, setDetailScores] = useState<ReviewScores | null>(null);
  const [reviewInfo, setReviewInfo] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!detail?.id) { setDetailScores(null); return; }
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.from("admin_essay_reviews")
        .select("scores").eq("participant_id", detail.id).maybeSingle();
      if (!cancelled) setDetailScores((data?.scores as ReviewScores) ?? null);
    })();
    return () => { cancelled = true; };
  }, [detail?.id]);

  const saveReview = async (id: string, decision: ReviewDecision, scores: ReviewScores) => {
    setReviewBusy(true);
    const { error } = await supabase.rpc("admin_save_essay_review", {
      p_participant_id: id, p_scores: scores, p_decision: decision,
    });
    setReviewBusy(false);
    if (error) { toast.error(error.message); return; }
    setDetailScores(scores);
    setReviewInfo((p) => ({ ...p, [id]: new Date().toISOString() }));
    setRows((p) => p.map((r) => r.id === id ? { ...r, status: decision } : r));
    setDetail((d) => d && d.id === id ? { ...d, status: decision } : d);
    toast.success(decision === "interview"
      ? "Nilai tersimpan — peserta masuk Tahapan TKA"
      : decision === "rejected" ? "Nilai tersimpan — peserta Tidak Lolos" : "Nilai tersimpan");
  };

  const resetReview = async (id: string) => {
    setReviewBusy(true);
    const { error } = await supabase.from("admin_essay_reviews").delete().eq("participant_id", id);
    if (!error) {
      await supabase.from("participants").update({ status: "pending" }).eq("id", id);
      await supabase.rpc("admin_set_tahapan", { p_id: id, p_stage: "essay", p_value: "pending" });
    }
    setReviewBusy(false);
    if (error) { toast.error(error.message); return; }
    setDetailScores(null);
    setReviewInfo((p) => { const next = { ...p }; delete next[id]; return next; });
    setRows((p) => p.map((r) => r.id === id ? { ...r, status: "reviewed" as Status } : r));
    setDetail((d) => d && d.id === id ? { ...d, status: "reviewed" as Status } : d);
    toast.success("Penilaian direset — peserta kembali seperti semula.");
  };

  const reload = async () => {
    setLoading(true);
    const [{ data, error }, pendingResult, settingRes, reviewRes] = await Promise.all([
      supabase.rpc("list_essay_complete_participants"),
      loadAllPendingEssayParticipants()
        .then((data) => ({ data, error: null as Error | null }))
        .catch((error: Error) => ({ data: [] as PendingRow[], error })),
      supabase.from("app_settings").select("value").eq("key", "essay_results_published").maybeSingle(),
      supabase.from("admin_essay_reviews").select("participant_id,updated_at"),
    ]);
    setReviewInfo(Object.fromEntries(((reviewRes.data ?? []) as { participant_id: string; updated_at: string }[])
      .map((r) => [r.participant_id, r.updated_at])));
    if (error) toast.error(error.message);
    else setRows(((data ?? []) as Row[]).map((r) => ({ ...r, status: normalizeStatus(r.status as string) })));
    if (pendingResult.error) toast.error(pendingResult.error.message);
    else setPendingRows(pendingResult.data);
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
    }).sort((a, b) => {
      const at = reviewInfo[a.id] ? new Date(reviewInfo[a.id]).getTime() : 0;
      const bt = reviewInfo[b.id] ? new Date(reviewInfo[b.id]).getTime() : 0;
      return bt - at;
    });
  }, [rows, q, statusFilter, reviewInfo]);

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
    // Sinkronkan juga essay_status agar Tahapan (TKA / Interview) & halaman Cek Tahapan konsisten
    const stageValue: "passed" | "failed" | "pending" =
      s === "interview" ? "passed" : s === "rejected" ? "failed" : "pending";
    const { error: e2 } = await supabase.rpc("admin_set_tahapan", { p_id: id, p_stage: "essay", p_value: stageValue });
    if (e2) { toast.error(e2.message); return; }
    setRows((p) => p.map((r) => r.id === id ? { ...r, status: s } : r));
    if (detail?.id === id) setDetail({ ...detail, status: s });
    if (s === "interview") {
      toast.success(`Lolos Essay & Studi Kasus — otomatis dipindahkan ke tahap TKA`);
    } else if (s === "rejected") {
      toast.success(`Ditandai Tidak Lolos Essay & Studi Kasus`);
    } else {
      toast.success(`Status: ${STATUS_LABEL[s]}`);
    }
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
    const enabled = await isFeatureEnabled("ai_grading_enabled");
    if (!enabled) {
      toast.error("Fitur AI Grading sedang dinonaktifkan di Dashboard Admin.");
      return;
    }
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

      {/* Tabs: Sudah Kirim vs Belum Kirim */}
      <div className="bg-card border border-border rounded-2xl p-1 inline-flex flex-wrap gap-1">
        <button
          onClick={() => setTab("sent")}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
            tab === "sent" ? "bg-gradient-emerald text-accent shadow-emerald" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          <Inbox className="size-4" /> Sudah Kirim
          <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-background/60 border border-border">
            {rows.length}
          </span>
        </button>
        <button
          onClick={() => setTab("pending")}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
            tab === "pending" ? "bg-amber-500 text-white shadow-md" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          <MailQuestion className="size-4" /> Belum Kirim
          <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-white/25 border border-white/30">
            {pendingRows.length}
          </span>
        </button>
      </div>

      {tab === "sent" && (
        <>
          {/* Publish hasil — TAHAP ESSAY & STUDI KASUS (terpisah dari toggle Berkas) */}
          <EssayPublishBox
            published={published}
            pubBusy={pubBusy}
            allDecided={allDecided}
            pendingCount={stats.pending}
            onToggle={togglePublish}
          />

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
        </>
      )}

      {tab === "pending" && (
        <PendingEssaySection rows={pendingRows} q={q} setQ={setQ} onCopy={copy} />
      )}

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
              <div className="mt-2">
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
                {detail.donation_status === "paid" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold border bg-gradient-gold text-emerald-deep border-accent/40">
                    <HeartHandshake className="size-4" /> Donasi Valid
                    {detail.donation_paid_at ? ` · ${new Date(detail.donation_paid_at).toLocaleDateString("id-ID")}` : ""}
                  </span>
                )}
              </div>

              {/* Aksi Cepat — Pengoreksi AI */}
              <AiGraderCard row={detail} busy={aiBusy} onRun={() => runAiGrade(detail)} />

              {/* Penilaian per soal + keputusan */}
              <div className="mt-6">
                <ManualEssayReview
                  answers={{
                    essay_1: detail.essay_worthy,
                    essay_2: detail.essay_dream,
                    essay_3: detail.essay_contribution,
                    case_1: detail.case_study_1,
                    case_2: detail.case_study_2,
                    case_3: detail.case_study_3,
                    case_4: detail.case_study_4,
                    case_5: detail.case_study_5,
                    case_6: detail.case_study_6,
                    case_7: detail.case_study_7,
                  }}
                  initialScores={detailScores}
                  currentDecision={detail.status as ReviewDecision}
                  busy={reviewBusy}
                  onSave={(decision, scores) => saveReview(detail.id, decision, scores)}
                  onReset={() => resetReview(detail.id)}
                />
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

function AiGraderCard({ row, busy, onRun }: { row: Row; busy: boolean; onRun: () => void }) {
  const verdict = row.essay_ai_verdict;
  const percent = row.essay_ai_percent;
  const score = row.essay_ai_score;
  const verdictMeta = verdict === "layak"
    ? { label: "AI: LAYAK", cls: "bg-emerald text-white border-emerald" }
    : verdict === "tidak_layak"
    ? { label: "AI: TIDAK LAYAK", cls: "bg-red-500 text-white border-red-500" }
    : verdict === "ragu"
    ? { label: "AI: RAGU", cls: "bg-amber-500 text-white border-amber-500" }
    : null;

  const aiBadgeCls =
    percent == null ? "bg-secondary text-muted-foreground"
    : percent >= 70 ? "bg-red-100 text-red-700 border border-red-300"
    : percent >= 40 ? "bg-amber-100 text-amber-700 border border-amber-300"
    : "bg-emerald/15 text-emerald border border-emerald/30";

  return (
    <div className="mt-6 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 via-card to-emerald/5 p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl bg-accent/15 grid place-items-center shrink-0">
            <Bot className="size-5 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-display font-semibold">Aksi Cepat — Pengoreksi AI</div>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                <Sparkles className="size-3" /> Honest Review
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
              Jalankan koreksi otomatis untuk mendapat indikasi penggunaan AI, skor kualitas jawaban, dan rekomendasi
              kesimpulan layak / tidak layak melanjutkan ke tahap berikutnya.
            </p>
          </div>
        </div>
        <button
          onClick={onRun}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-emerald text-accent px-4 py-2 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Bot className="size-4" />}
          {row.essay_ai_graded_at ? "Koreksi Ulang" : "Koreksi dengan AI"}
        </button>
      </div>

      {row.essay_ai_graded_at && (
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <div className={`rounded-xl p-3 ${aiBadgeCls}`}>
            <div className="text-[10px] uppercase tracking-wider opacity-80">Indikasi Penggunaan AI</div>
            <div className="text-2xl font-display font-bold">{percent ?? "—"}<span className="text-sm font-medium">/100</span></div>
            <div className="text-[11px] opacity-80 mt-0.5">
              {percent == null ? "—" : percent >= 70 ? "Tinggi (kemungkinan ditulis AI)" : percent >= 40 ? "Sedang" : "Rendah (otentik)"}
            </div>
          </div>
          <div className="rounded-xl p-3 bg-secondary/60 border border-border">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Skor Kualitas</div>
            <div className="text-2xl font-display font-bold">{score ?? "—"}<span className="text-sm font-medium">/100</span></div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Kedalaman, relevansi, otentisitas</div>
          </div>
          <div className="rounded-xl p-3 border bg-card flex flex-col">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Rekomendasi</div>
            {verdictMeta ? (
              <span className={`inline-flex items-center justify-center text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md border mt-1 self-start ${verdictMeta.cls}`}>
                {verdictMeta.label}
              </span>
            ) : <span className="text-sm">—</span>}
            <div className="text-[11px] text-muted-foreground mt-1">
              Dinilai {new Date(row.essay_ai_graded_at).toLocaleString("id-ID")}
            </div>
          </div>
        </div>
      )}

      {row.essay_ai_summary && (
        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Kesimpulan AI</div>
          <div className="text-sm bg-card border border-border rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
            {row.essay_ai_summary.startsWith("STAFF_AI_JSON:")
              ? "Rekomendasi poin AI staff telah tersimpan. Buka detail koreksi pada halaman staff untuk melihat centang dan highlight bukti."
              : row.essay_ai_summary}
          </div>
          <div className="text-[11px] text-muted-foreground mt-2 italic">
            Catatan: hasil AI bersifat bantuan/indikasi. Keputusan akhir tetap di tangan tim seleksi.
          </div>
        </div>
      )}
    </div>
  );
}

function EssayPublishBox({
  published, pubBusy, allDecided, pendingCount, onToggle,
}: {
  published: boolean;
  pubBusy: boolean;
  allDecided: boolean;
  pendingCount: number;
  onToggle: (next: boolean) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const canPublish = published || allDecided;
  return (
    <div
      className={`rounded-2xl border-2 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${
        published
          ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-300 dark:bg-indigo-950/20"
          : "bg-amber-50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-700"
      }`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className={`shrink-0 size-10 rounded-xl grid place-items-center ${published ? "bg-indigo-600 text-white" : "bg-amber-400 text-white"}`}>
          {published ? <Megaphone className="size-5" /> : <EyeOff className="size-5" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-600 text-white">
              Tahap 3 · Essay &amp; Studi Kasus
            </span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${published ? "bg-emerald text-white" : "bg-amber-500 text-white"}`}>
              {published ? "Status: AKTIF" : "Status: NONAKTIF"}
            </span>
          </div>
          <div className="font-semibold text-sm mt-1">
            {published
              ? "Hasil Essay & Studi Kasus sudah DIPUBLIKASIKAN"
              : "Hasil Essay & Studi Kasus BELUM DIPUBLIKASIKAN"}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
            {published
              ? "Peserta sudah dapat melihat keputusan Essay & Studi Kasus di halaman Cek Tahapan. Toggle ini terpisah dari Seleksi Berkas."
              : `Tandai semua keputusan Essay & Studi Kasus dulu, lalu Publish. Saat ini ${pendingCount} peserta belum diputuskan.`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {confirming ? (
          <>
            <button
              onClick={() => setConfirming(false)}
              disabled={pubBusy}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-secondary border border-border"
            >
              Batal
            </button>
            <button
              onClick={() => { onToggle(!published); setConfirming(false); }}
              disabled={pubBusy}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white shadow-lg ${published ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
            >
              {pubBusy ? <Loader2 className="size-4 animate-spin" /> : <Megaphone className="size-4" />}
              Ya, {published ? "tarik" : "publish"}
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            disabled={pubBusy || !canPublish}
            title={!canPublish ? "Selesaikan semua keputusan dulu" : undefined}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
              published
                ? "bg-white text-red-700 border-2 border-red-300 hover:bg-red-50 dark:bg-transparent"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg"
            }`}
          >
            <Megaphone className="size-4" />
            {published ? "Tarik Publikasi" : "Publish Hasil"}
          </button>
        )}
      </div>
    </div>
  );
}


function PendingEssaySection({
  rows,
  q,
  setQ,
  onCopy,
}: {
  rows: PendingRow[];
  q: string;
  setQ: (s: string) => void;
  onCopy: (txt: string, label?: string) => void;
}) {
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) =>
      [r.full_name, r.email, r.whatsapp, r.city, r.registration_code]
        .some((v) => v?.toLowerCase().includes(term)),
    );
  }, [rows, q]);

  const exportPendingExcel = () => {
    if (rows.length === 0) {
      toast.error("Tidak ada data peserta yang dapat diekspor");
      return;
    }

    const data = rows.map((r, index) => {
      const essayFilled = [r.has_essay_worthy, r.has_essay_dream, r.has_essay_contribution].filter(Boolean).length;
      const caseStudyFilled = [
        r.has_case_study_1, r.has_case_study_2, r.has_case_study_3, r.has_case_study_4,
        r.has_case_study_5, r.has_case_study_6, r.has_case_study_7,
      ].filter(Boolean).length;

      return {
        No: index + 1,
        Token: r.registration_code,
        Nama: r.full_name,
        Email: r.email,
        WhatsApp: r.whatsapp,
        Kota: r.city,
        Pendidikan: r.education,
        Kategori: r.category ? CAT_LABEL[r.category] : "-",
        "Essay 1": r.has_essay_worthy ? "Sudah" : "Belum",
        "Essay 2": r.has_essay_dream ? "Sudah" : "Belum",
        "Essay 3": r.has_essay_contribution ? "Sudah" : "Belum",
        "Studi Kasus 1": r.has_case_study_1 ? "Sudah" : "Belum",
        "Studi Kasus 2": r.has_case_study_2 ? "Sudah" : "Belum",
        "Studi Kasus 3": r.has_case_study_3 ? "Sudah" : "Belum",
        "Studi Kasus 4": r.has_case_study_4 ? "Sudah" : "Belum",
        "Studi Kasus 5": r.has_case_study_5 ? "Sudah" : "Belum",
        "Studi Kasus 6": r.has_case_study_6 ? "Sudah" : "Belum",
        "Studi Kasus 7": r.has_case_study_7 ? "Sudah" : "Belum",
        "Total Terisi": `${essayFilled + caseStudyFilled}/10`,
        Status: "Belum Mengirim Lengkap",
        "Terakhir Diperbarui": r.updated_at
          ? new Date(r.updated_at).toLocaleString("id-ID")
          : "-",
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = Object.keys(data[0]).map((key) => ({
      wch: Math.min(42, Math.max(key.length + 2, ...data.map((row) => String(row[key as keyof typeof row] ?? "").length + 2))),
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Belum Kirim Essay");
    XLSX.writeFile(wb, `safar-iman-belum-kirim-essay-${Date.now()}.xlsx`);
    toast.success(`${data.length} peserta belum kirim berhasil diekspor`);
  };

  const waLink = (wa: string, nama: string, kode: string) => {
    const num = wa.replace(/[^\d]/g, "").replace(/^0/, "62");
    const msg = encodeURIComponent(
      `Assalamu'alaikum ${nama},\n\nKami dari panitia Safar Iman ingin mengingatkan bahwa kamu belum mengirimkan Essay & Studi Kasus untuk tahap seleksi berikutnya.\n\nKode: ${kode}\n\nMohon segera dilengkapi ya. Jazakumullah khairan.`,
    );
    return `https://wa.me/${num}?text=${msg}`;
  };

  return (
    <>
      <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3">
        <MailQuestion className="size-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm">
          <div className="font-semibold text-amber-900 dark:text-amber-200">
            {rows.length} peserta belum mengirim Essay & Studi Kasus
          </div>
          <div className="text-xs text-amber-800/80 dark:text-amber-200/70 mt-0.5">
            Daftar peserta yang sudah lolos tahap Berkas namun belum melengkapi jawaban Essay & Studi Kasus. Hubungi via WhatsApp untuk mengingatkan.
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, kode token, email, WA, kota…" className="pl-9" />
        </div>
        <button
          onClick={exportPendingExcel}
          disabled={rows.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-500 text-white px-4 py-2 text-sm font-semibold shadow-md hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="size-4" /> Export Semua ({rows.length})
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
              <tr>
                <Th>Token</Th><Th>Nama</Th><Th>Kategori</Th><Th>Kontak</Th><Th>Kota</Th><Th>Kelengkapan</Th><Th>Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">
                  🎉 Semua peserta sudah mengirim Essay & Studi Kasus.
                </td></tr>
              ) : filtered.map((r) => {
                const filled = [r.has_essay_worthy, r.has_essay_dream, r.has_essay_contribution].filter(Boolean).length;
                const csFilled = [
                  r.has_case_study_1, r.has_case_study_2, r.has_case_study_3, r.has_case_study_4,
                  r.has_case_study_5, r.has_case_study_6, r.has_case_study_7,
                ].filter(Boolean).length;
                const totalFilled = filled + csFilled;
                const totalAll = 3 + 7;
                return (
                  <tr key={r.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-3 py-3">
                      <button onClick={() => onCopy(r.registration_code, `Token ${r.registration_code} disalin`)} className="inline-flex items-center gap-1 font-mono text-xs px-2 py-1 rounded-md bg-accent/15 text-accent hover:bg-accent/25">
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
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex w-fit items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          filled === 0
                            ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/30"
                            : filled < 3
                              ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/30"
                              : "bg-emerald/15 text-emerald border-emerald/30"
                        }`}>
                          {filled}/3 Essay
                        </span>
                        <span className={`inline-flex w-fit items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          csFilled === 0
                            ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/30"
                            : csFilled < 7
                              ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/30"
                              : "bg-emerald/15 text-emerald border-emerald/30"
                        }`}>
                          {csFilled}/7 Studi Kasus
                        </span>
                        <span className="text-[10px] text-muted-foreground">Total {totalFilled}/{totalAll}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <a
                        href={waLink(r.whatsapp, r.full_name, r.registration_code)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded-md bg-emerald/15 text-emerald hover:bg-emerald/25"
                        title="Ingatkan via WhatsApp"
                      >
                        <MessageCircle className="size-3.5" /> Ingatkan
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
