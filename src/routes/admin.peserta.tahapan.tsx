import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Copy, CheckCircle2, XCircle, Clock, Brain, MessagesSquare, BookOpenCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/peserta/tahapan")({
  head: () => ({ meta: [{ title: "Tahapan Seleksi (Essay, TKA & Interview) — Safar Iman Admin" }] }),
  component: Page,
});

type Category = "fully_funded" | "partial_funded" | "self_funded" | "gelombang_1" | "gelombang_2";
type StageStatus = "pending" | "passed" | "failed";
type StageKey = "essay" | "tka" | "interview";

type Row = {
  id: string;
  registration_code: string;
  full_name: string;
  email: string;
  whatsapp: string;
  city: string;
  category: Category | null;
  status: string;
  essay_status: StageStatus;
  tka_status: StageStatus;
  interview_status: StageStatus;
  essay_updated_at: string | null;
  tka_updated_at: string | null;
  interview_updated_at: string | null;
  created_at: string;
};

const CAT_LABEL: Record<Category, string> = {
  fully_funded: "Fully Funded",
  partial_funded: "Partial Funded",
  self_funded: "Self Funded",
  gelombang_1: "Fast Track G1",
  gelombang_2: "Fast Track G2",
};

const STAGE_LABEL: Record<StageStatus, string> = {
  pending: "Menunggu",
  passed: "Lolos",
  failed: "Tidak Lolos",
};

function Page() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<StageKey>("essay");

  const reload = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("list_tahapan_participants");
    if (error) toast.error(error.message);
    else setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { if (ready) void reload(); }, [ready]);

  const eligible = (r: Row): boolean => {
    if (tab === "essay") return true;
    if (tab === "tka") return r.essay_status === "passed";
    return r.tka_status === "passed"; // interview
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (!eligible(r)) return false;
      if (!term) return true;
      return [r.full_name, r.email, r.whatsapp, r.city, r.registration_code]
        .some((v) => v?.toLowerCase().includes(term));
    });
  }, [rows, q, tab]);

  const stats = useMemo(() => {
    const pool = rows.filter(eligible);
    const field = (tab + "_status") as "essay_status" | "tka_status" | "interview_status";
    return {
      total: pool.length,
      pending: pool.filter((r) => r[field] === "pending").length,
      passed: pool.filter((r) => r[field] === "passed").length,
      failed: pool.filter((r) => r[field] === "failed").length,
    };
  }, [rows, tab]);

  const setStage = async (id: string, stage: StageKey, value: StageStatus) => {
    const { error } = await supabase.rpc("admin_set_tahapan", { p_id: id, p_stage: stage, p_value: value });
    if (error) { toast.error(error.message); return; }
    const label = stage === "essay" ? "Essay" : stage === "tka" ? "TKA" : "Interview";
    toast.success(`${label}: ${STAGE_LABEL[value]}`);
    void reload();
  };

  const copy = (txt: string) => { navigator.clipboard.writeText(txt); toast.success("Disalin"); };

  if (!ready || loading) return <AdminLoading />;

  return (
    <AdminShell title="Tahapan Seleksi — TKA & Interview">
      <p className="text-sm text-muted-foreground -mt-3">
        Tandai peserta yang lolos / tidak lolos pada tahap <strong>TKA</strong> dan <strong>Interview</strong>.
        Hasil tampil otomatis di halaman publik <em>Cek Tahapan</em>.
      </p>

      {/* Tabs */}
      <div className="bg-card border border-border rounded-2xl p-1 inline-flex">
        <button
          onClick={() => setTab("tka")}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
            tab === "tka" ? "bg-gradient-emerald text-accent shadow-emerald" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          <Brain className="size-4" /> Tahap TKA
        </button>
        <button
          onClick={() => setTab("interview")}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
            tab === "interview" ? "bg-gradient-emerald text-accent shadow-emerald" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          <MessagesSquare className="size-4" /> Tahap Interview
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: tab === "tka" ? "Total Peserta TKA" : "Eligible Interview", value: stats.total, color: "text-foreground" },
          { label: "Menunggu", value: stats.pending, color: "text-amber-600" },
          { label: "Lolos", value: stats.passed, color: "text-emerald" },
          { label: "Tidak Lolos", value: stats.failed, color: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className={`text-2xl font-display font-semibold mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, kode, email, WA, kota…" className="pl-9" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
              <tr>
                <Th>Kode</Th><Th>Nama</Th><Th>Kategori</Th><Th>Kontak</Th>
                <Th>TKA</Th><Th>Interview</Th><Th>Aksi {tab === "tka" ? "TKA" : "Interview"}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">
                  {tab === "interview"
                    ? "Belum ada peserta yang lolos TKA."
                    : "Belum ada peserta yang lolos essay & siap ikut TKA."}
                </td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="px-3 py-3">
                    <button onClick={() => copy(r.registration_code)} className="inline-flex items-center gap-1 font-mono text-xs px-2 py-1 rounded-md bg-accent/15 text-accent hover:bg-accent/25">
                      {r.registration_code} <Copy className="size-3" />
                    </button>
                  </td>
                  <td className="px-3 py-3 font-medium">{r.full_name}</td>
                  <td className="px-3 py-3 text-xs">{r.category ? CAT_LABEL[r.category] : "—"}</td>
                  <td className="px-3 py-3">
                    <div className="text-xs">{r.email}</div>
                    <div className="text-xs text-muted-foreground">{r.whatsapp}</div>
                  </td>
                  <td className="px-3 py-3"><StagePill v={r.tka_status} /></td>
                  <td className="px-3 py-3"><StagePill v={r.interview_status} /></td>
                  <td className="px-3 py-3">
                    <StageActions
                      current={tab === "tka" ? r.tka_status : r.interview_status}
                      onSet={(v) => setStage(r.id, tab, v)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

function StagePill({ v }: { v: StageStatus }) {
  const style = v === "passed"
    ? "bg-emerald/15 text-emerald border-emerald/40"
    : v === "failed"
    ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/30"
    : "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/30";
  const Icon = v === "passed" ? CheckCircle2 : v === "failed" ? XCircle : Clock;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${style}`}>
      <Icon className="size-3" /> {STAGE_LABEL[v]}
    </span>
  );
}

function StageActions({ current, onSet }: { current: StageStatus; onSet: (v: StageStatus) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onSet("passed")}
        disabled={current === "passed"}
        title="Loloskan"
        className="inline-flex items-center text-xs px-2 py-1.5 rounded-md bg-emerald/15 text-emerald hover:bg-emerald/25 disabled:opacity-40"
      >
        <CheckCircle2 className="size-3.5" />
      </button>
      <button
        onClick={() => onSet("failed")}
        disabled={current === "failed"}
        title="Tidak loloskan"
        className="inline-flex items-center text-xs px-2 py-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-40 dark:bg-red-950/30"
      >
        <XCircle className="size-3.5" />
      </button>
      <button
        onClick={() => onSet("pending")}
        disabled={current === "pending"}
        title="Reset"
        className="inline-flex items-center text-xs px-2 py-1.5 rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-40 dark:bg-amber-950/30"
      >
        <Clock className="size-3.5" />
      </button>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-3 py-2 font-medium">{children}</th>;
}
