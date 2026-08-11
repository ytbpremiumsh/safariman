import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search, FileText, CheckCircle2, XCircle, FileDown, Image as ImageIcon,
  ShieldCheck, Loader2, Megaphone, EyeOff, Bot,
  Inbox, Lock, AlertCircle, Copy, Check, Clock
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/seleksi/essay")({
  head: () => ({ meta: [{ title: "Seleksi Essay & Studi Kasus — Safar Iman" }] }),
  component: SeleksiEssayPrivatePage,
});

type Status = "reviewed" | "interview" | "rejected";
type Category = "fully_funded" | "partial_funded" | "self_funded" | "gelombang_1" | "gelombang_2";

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
  reviewed: "bg-amber-100 text-amber-700 border-amber-300",
  interview: "bg-emerald/15 text-emerald border-emerald/40",
  rejected: "bg-red-100 text-red-700 border-red-300",
};

function SeleksiEssayPrivatePage() {
  const navigate = useNavigate();
  const search = new URLSearchParams(window.location.search);
  const token = search.get("token");

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [detail, setDetail] = useState<Row | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    const checkToken = async () => {
      const { data, error } = await supabase
        .from("seleksi_private_tokens")
        .select("id, expires_at")
        .eq("token", token)
        .maybeSingle();

      if (error || !data) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        toast.error("Token akses telah kadaluarsa");
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);
      fetchData();
    };

    void checkToken();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("list_essay_complete_participants");
    if (error) {
      toast.error(error.message);
    } else {
      setRows((data ?? []) as Row[]);
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!term) return true;
      return [r.full_name, r.email, r.whatsapp, r.city, r.registration_code]
        .some((v) => v?.toLowerCase().includes(term));
    });
  }, [rows, q, statusFilter]);

  const updateStatus = async (id: string, s: Status) => {
    // Note: This requires the token-based bypass or valid admin session. 
    // Since we are using Supabase JS client, we need a valid session.
    // However, if the user isn't logged in, they can only READ if we granted it.
    // For now, assume the person accessing this is an admin who has the token,
    // or we'd need a special edge function for token-authorized updates.
    // Let's assume standard Supabase auth is still required for updates, 
    // but the token gives access to the UI.
    
    const { data: { session } } = await supabase.auth.getSession();
    const isAdmin = session ? await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" }) : { data: false };
    
    const { error } = await supabase.from("participants").update({ status: s }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    
    const stageValue: "passed" | "failed" | "pending" =
      s === "interview" ? "passed" : s === "rejected" ? "failed" : "pending";
    
    // Use token-based update via edge function if not admin
    if (!isAdmin.data) {
      const { data: efData, error: efError } = await supabase.functions.invoke("seleksi-token-update", {
        body: { token, participant_id: id, status: s, stage_value: stageValue }
      });
      if (efError) { toast.error(efError.message); return; }
    } else {
      const { error: e2 } = await supabase.rpc("admin_set_tahapan", { p_id: id, p_stage: "essay", p_value: stageValue });
      if (e2) { toast.error(e2.message); return; }
    }
    
    setRows((p) => p.map((r) => r.id === id ? { ...r, status: s } : r));
    if (detail?.id === id) setDetail({ ...detail, status: s });
    toast.success(`Status peserta berhasil diperbarui ke ${STATUS_LABEL[s]}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground">Memverifikasi akses seleksi…</p>
        </div>
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="size-20 bg-red-100 rounded-full grid place-items-center mx-auto">
            <Lock className="size-10 text-red-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-display font-bold">Akses Ditolak</h1>
            <p className="text-muted-foreground">
              Halaman ini bersifat private dan hanya dapat diakses menggunakan token yang valid dari Admin Dashboard Safar Iman.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-full font-semibold hover:bg-accent/90 transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 pb-20">
      <header className="bg-white border-b border-border sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 bg-accent rounded-lg grid place-items-center">
              <ShieldCheck className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold uppercase tracking-wider">Seleksi Private Essai</h1>
              <p className="text-[10px] text-muted-foreground">Safar Iman · Boarding Only</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald/10 text-emerald text-xs font-semibold">
              <span className="size-2 rounded-full bg-emerald animate-pulse" />
              Sesi Aktif (Token Valid)
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-bold">Daftar Peserta Seleksi</h2>
              <p className="text-sm text-muted-foreground">
                Menampilkan {filtered.length} peserta yang telah menyelesaikan pengiriman Essai dan Studi Kasus.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
               <div className="relative">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  value={q} 
                  onChange={(e) => setQ(e.target.value)} 
                  placeholder="Cari nama, email, WA..." 
                  className="pl-9 w-full sm:w-64" 
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as Status | "all")}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">Semua Status</option>
                <option value="reviewed">Sedang Direview</option>
                <option value="interview">Lolos (Interview)</option>
                <option value="rejected">Belum Lolos</option>
              </select>
            </div>
          </div>

          <div className="mt-6 border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-left">Nama & Token</th>
                    <th className="px-4 py-3 text-left">Kontak</th>
                    <th className="px-4 py-3 text-left">Kategori</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                        Tidak ada data peserta yang ditemukan.
                      </td>
                    </tr>
                  ) : filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-foreground">{r.full_name}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{r.registration_code}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs">{r.email}</div>
                        <div className="text-xs text-muted-foreground">{r.whatsapp}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-foreground border border-border">
                          {r.category ? CAT_LABEL[r.category] : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${STATUS_STYLE[r.status]}`}>
                          {STATUS_LABEL[r.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button 
                          onClick={() => setDetail(r)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/90 shadow-sm"
                        >
                          <FileText className="size-3.5" /> Detail Seleksi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl flex items-center gap-3">
                  {detail.full_name}
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${STATUS_STYLE[detail.status]}`}>
                    {STATUS_LABEL[detail.status]}
                  </span>
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <span className="font-mono text-foreground font-semibold">{detail.registration_code}</span>
                  <span>·</span>
                  <span>{detail.city}, {detail.education}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="grid md:grid-cols-[1fr,300px] gap-6 mt-4">
                <div className="space-y-6">
                  <EssayBlock title="Kenapa layak dipilih?" body={detail.essay_worthy} />
                  <EssayBlock title="Mimpi setelah Umrah" body={detail.essay_dream} />
                  <EssayBlock title="Kontribusi untuk Umat" body={detail.essay_contribution} />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <EssayBlock title="Studi Kasus 1" body={detail.case_study_1 ?? ""} small />
                    <EssayBlock title="Studi Kasus 2" body={detail.case_study_2 ?? ""} small />
                    <EssayBlock title="Studi Kasus 3" body={detail.case_study_3 ?? ""} small />
                    <EssayBlock title="Studi Kasus 4" body={detail.case_study_4 ?? ""} small />
                    <EssayBlock title="Studi Kasus 5" body={detail.case_study_5 ?? ""} small />
                  </div>
                </div>

                <div className="space-y-6">
                   {detail.photo_url && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pas Foto</div>
                      <img src={detail.photo_url} alt={detail.full_name} className="w-full aspect-[3/4] object-cover rounded-xl border border-border shadow-sm" />
                    </div>
                  )}

                  <div className="bg-secondary/40 rounded-xl p-4 space-y-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Detail Peserta</div>
                    <div className="grid gap-3 text-xs">
                      <KV k="WhatsApp" v={detail.whatsapp} />
                      <KV k="Gender" v={detail.gender === "male" ? "Laki-laki" : "Perempuan"} />
                      <KV k="Pekerjaan" v={detail.occupation} />
                      <KV k="Kategori" v={detail.category ? CAT_LABEL[detail.category] : "—"} />
                    </div>
                    {detail.cv_url && (
                      <button 
                        onClick={async () => {
                          const { data } = await supabase.storage.from("participant-cv").createSignedUrl(detail.cv_url!, 60);
                          if (data) window.open(data.signedUrl, "_blank");
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-accent/30 bg-accent/5 text-accent font-semibold hover:bg-accent/10 transition-colors"
                      >
                        <FileDown className="size-4" /> Download CV
                      </button>
                    )}
                  </div>

                  <div className="bg-emerald/5 border border-emerald/20 rounded-xl p-4 space-y-3">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-emerald/70">Update Status Kelulusan</div>
                    <div className="grid gap-2">
                      <button 
                        onClick={() => updateStatus(detail.id, "interview")}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald text-white font-bold hover:bg-emerald/90 transition-colors shadow-sm"
                      >
                        <CheckCircle2 className="size-4" /> Lolos Tahap Seleksi
                      </button>
                      <button 
                        onClick={() => updateStatus(detail.id, "rejected")}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-sm"
                      >
                        <XCircle className="size-4" /> Tidak Lolos
                      </button>
                      <button 
                        onClick={() => updateStatus(detail.id, "reviewed")}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border bg-white text-muted-foreground font-semibold hover:bg-secondary transition-colors"
                      >
                        Reset ke Review
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EssayBlock({ title, body, small }: { title: string; body: string; small?: boolean }) {
  return (
    <div className="space-y-2">
      <div className={`text-[10px] font-bold uppercase tracking-widest text-accent ${small ? "opacity-70" : ""}`}>{title}</div>
      <div className={`p-4 rounded-xl border border-border bg-secondary/20 leading-relaxed text-foreground/90 whitespace-pre-wrap ${small ? "text-xs" : "text-sm"}`}>
        {body || "—"}
      </div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-semibold text-right">{v || "—"}</span>
    </div>
  );
}
