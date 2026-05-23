import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  LogOut, Search, Download, Sparkles, Users, CheckCircle2, Clock, XCircle,
  Eye, FileDown, Image as ImageIcon, Loader2, ArrowLeft, MessageCircle, Settings, QrCode,
  FileCheck, FileX,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard Admin — Safar Iman" }] }),
  component: AdminDashboard,
});

type Status = "pending" | "reviewed" | "interview" | "accepted" | "rejected";
type Category = "fully_funded" | "partial_funded" | "self_funded";

type Participant = {
  id: string;
  created_at: string;
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
  reason: string | null;
  achievements: string | null;
  organization_experience: string | null;
  social_media: string | null;
  essay_worthy: string;
  essay_dream: string;
  essay_contribution: string;
  cv_url: string | null;
  photo_url: string | null;
};

const CAT_LABEL: Record<Category, string> = {
  fully_funded: "Fully Funded",
  partial_funded: "Partial Funded",
  self_funded: "Self Funded",
};

const STATUS_COLOR: Record<Status, string> = {
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  reviewed: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  interview: "bg-accent/20 text-accent border-accent/40",
  accepted: "bg-emerald/15 text-emerald border-emerald/30",
  rejected: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Participant[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");
  const [detail, setDetail] = useState<Participant | null>(null);
  const [docFilter, setDocFilter] = useState<"all" | "registered" | "submitted">("all");
  const [apiKey, setApiKey] = useState("");
  const [sender, setSender] = useState("");
  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [waMsg, setWaMsg] = useState("");
  const [waSending, setWaSending] = useState(false);
  const [countdownTarget, setCountdownTarget] = useState("");
  const [savingCountdown, setSavingCountdown] = useState(false);
  const [mayarKey, setMayarKey] = useState("");
  const [mayarAmount, setMayarAmount] = useState("150000");
  const [mayarDesc, setMayarDesc] = useState("");
  const [savingMayar, setSavingMayar] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate({ to: "/admin/login" }); return; }
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" });
      if (!isAdmin) { await supabase.auth.signOut(); navigate({ to: "/admin/login" }); return; }
      await load();
      await loadSettings();
    })();
  }, [navigate]);

  const loadSettings = async () => {
    const { data } = await supabase.from("app_settings").select("key,value");
    const map = Object.fromEntries((data ?? []).map((r: { key: string; value: string | null }) => [r.key, r.value ?? ""]));
    setApiKey(map.mpwa_api_key ?? "");
    setSender(map.mpwa_sender ?? "");
    setTemplates({
      pendaftaran: map.wa_template_pendaftaran ?? "",
      lolos: map.wa_template_lolos ?? "",
      ditolak: map.wa_template_ditolak ?? "",
      custom: map.wa_template_custom ?? "",
    });
    // datetime-local needs "YYYY-MM-DDTHH:mm"
    const raw = map.countdown_target ?? "";
    if (raw) {
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) {
        const pad = (n: number) => String(n).padStart(2, "0");
        setCountdownTarget(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
      }
    }
    setMayarKey(map.mayar_api_key ?? "");
    setMayarAmount(map.mayar_donation_amount ?? "150000");
    setMayarDesc(map.mayar_donation_description ?? "Kontribusi peserta untuk mendukung operasional program, kegiatan sosial, berbagi makanan, wakaf Al-Qur'an, dan keberlangsungan kegiatan Safar Iman.");
  };

  const saveMayar = async () => {
    if (!mayarKey.trim()) { toast.error("API Key Mayar wajib diisi"); return; }
    setSavingMayar(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from("app_settings").upsert([
      { key: "mayar_api_key", value: mayarKey.trim(), updated_at: now },
      { key: "mayar_donation_amount", value: String(Number(mayarAmount) || 0), updated_at: now },
      { key: "mayar_donation_description", value: mayarDesc, updated_at: now },
    ]);
    setSavingMayar(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Pengaturan Mayar disimpan");

  const saveCountdown = async () => {
    if (!countdownTarget) { toast.error("Pilih tanggal & waktu"); return; }
    setSavingCountdown(true);
    const iso = new Date(countdownTarget).toISOString();
    const { error } = await supabase.from("app_settings").upsert({
      key: "countdown_target", value: iso, updated_at: new Date().toISOString(),
    });
    setSavingCountdown(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Waktu countdown disimpan");
  };

  const fillTemplate = (raw: string, p: Participant) => raw
    .replace(/\{nama\}/g, p.full_name)
    .replace(/\{kode\}/g, p.id.slice(0, 8))
    .replace(/\{kategori\}/g, p.category ? CAT_LABEL[p.category] : "-")
    .replace(/\{status\}/g, p.status.toUpperCase());

  const sendWa = async (number: string, message: string) => {
    if (!apiKey || !sender) { toast.error("Atur MPWA dulu di halaman WA Setup"); return false; }
    const clean = number.replace(/\D/g, "").replace(/^0/, "62");
    setWaSending(true);
    try {
      const res = await fetch("/api/public/mpwa/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey, sender, number: clean, message, footer: "Safar Iman" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.status === false && json.message) { throw new Error(json.message || "Gagal kirim"); }
      toast.success(`WA terkirim ke ${clean}`);
      return true;
    } catch (e: any) { toast.error(e.message || "Gagal kirim WA"); return false; }
    finally { setWaSending(false); }
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("participants").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows((data ?? []) as Participant[]);
    setLoading(false);
  };

  const hasSubmittedDocs = (p: Participant) =>
    !!(p.cv_url || p.photo_url || p.essay_worthy || p.essay_dream || p.essay_contribution);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (cat !== "all" && r.category !== cat) return false;
      if (status !== "all" && r.status !== status) return false;
      if (docFilter === "registered" && hasSubmittedDocs(r)) return false;
      if (docFilter === "submitted" && !hasSubmittedDocs(r)) return false;
      if (!term) return true;
      return [r.full_name, r.email, r.whatsapp, r.city].some((v) => v?.toLowerCase().includes(term));
    });
  }, [rows, q, cat, status, docFilter]);

  const stats = useMemo(() => ({
    total: rows.length,
    pending: rows.filter((r) => r.status === "pending").length,
    accepted: rows.filter((r) => r.status === "accepted").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
    registeredOnly: rows.filter((r) => !hasSubmittedDocs(r)).length,
    submitted: rows.filter((r) => hasSubmittedDocs(r)).length,
  }), [rows]);

  const exportExcel = () => {
    const data = filtered.map((r) => ({
      "Tanggal Daftar": new Date(r.created_at).toLocaleString("id-ID"),
      "Nama": r.full_name,
      "Email": r.email,
      "WhatsApp": r.whatsapp,
      "Gender": r.gender,
      "Tanggal Lahir": r.birth_date,
      "Kota": r.city,
      "Pendidikan": r.education,
      "Pekerjaan": r.occupation,
      "Kategori": r.category ? CAT_LABEL[r.category] : "-",
      "Status": r.status,
      "Essay Layak": r.essay_worthy,
      "Essay Impian": r.essay_dream,
      "Essay Kontribusi": r.essay_contribution,
      "Foto URL": r.photo_url ?? "",
      "CV Path": r.cv_url ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Peserta");
    XLSX.writeFile(wb, `safar-iman-peserta-${Date.now()}.xlsx`);
    toast.success(`${data.length} data diekspor ke Excel`);
  };

  const updateStatus = async (id: string, newStatus: Status) => {
    const { error } = await supabase.from("participants").update({ status: newStatus }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    if (detail?.id === id) setDetail({ ...detail, status: newStatus });
    toast.success("Status diperbarui");
  };

  const downloadCv = async (path: string, name: string) => {
    const { data, error } = await supabase.storage.from("participant-cv").createSignedUrl(path, 60);
    if (error || !data) { toast.error("Gagal generate link"); return; }
    const a = document.createElement("a");
    a.href = data.signedUrl; a.download = name; a.target = "_blank";
    document.body.appendChild(a); a.click(); a.remove();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="size-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-emerald-deep text-white sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-gradient-gold grid place-items-center">
              <Sparkles className="size-4 text-emerald-deep" />
            </div>
            <div>
              <div className="font-display text-lg font-semibold leading-none">Safar Iman</div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-accent">Dashboard Admin</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/admin/wa-setup" className="text-sm text-white/90 hover:text-white inline-flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-white/10">
              <Settings className="size-4" /> <span className="hidden sm:inline">WA Setup</span>
            </Link>
            <Link to="/" className="text-sm text-white/70 hover:text-white flex items-center gap-1.5 px-3 py-2">
              <ArrowLeft className="size-4" /> <span className="hidden sm:inline">Beranda</span>
            </Link>
            <button onClick={signOut} className="text-sm text-white/90 hover:text-white inline-flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-white/10">
              <LogOut className="size-4" /> Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          <Stat icon={<Users className="size-5" />} label="Total Peserta" value={stats.total} tint="emerald" />
          <Stat icon={<Clock className="size-5" />} label="Menunggu" value={stats.pending} tint="amber" />
          <Stat icon={<CheckCircle2 className="size-5" />} label="Diterima" value={stats.accepted} tint="emerald" />
          <Stat icon={<XCircle className="size-5" />} label="Ditolak" value={stats.rejected} tint="red" />
          <Stat icon={<FileX className="size-5" />} label="Hanya Daftar" value={stats.registeredOnly} tint="amber" />
          <Stat icon={<FileCheck className="size-5" />} label="Sudah Kirim Berkas" value={stats.submitted} tint="emerald" />
        </div>

        {/* Countdown setting */}
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="size-4 text-accent" />
              <div className="font-semibold text-sm">Waktu Penutupan Pendaftaran (Countdown Landing)</div>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Tanggal & waktu ini akan ditampilkan pada countdown di halaman utama.</p>
            <Input
              type="datetime-local"
              value={countdownTarget}
              onChange={(e) => setCountdownTarget(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <button
            onClick={saveCountdown}
            disabled={savingCountdown}
            className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-5 py-2.5 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60"
          >
            {savingCountdown ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Simpan Countdown
          </button>
        </div>

        {/* Tabs + Filters */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {([
              { key: "all", label: "Semua Peserta" },
              { key: "registered", label: `Hanya Daftar (${stats.registeredOnly})` },
              { key: "submitted", label: `Sudah Kirim Berkas (${stats.submitted})` },
            ] as const).map((t) => (
              <button
                key={t.key}
                onClick={() => setDocFilter(t.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                  docFilter === t.key
                    ? "bg-emerald text-white border-emerald shadow-emerald"
                    : "border-border bg-background hover:bg-secondary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, email, WA, kota..." className="pl-9" />
            </div>
            <select value={cat} onChange={(e) => setCat(e.target.value as typeof cat)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="all">Semua Kategori</option>
              <option value="fully_funded">Fully Funded</option>
              <option value="partial_funded">Partial Funded</option>
              <option value="self_funded">Self Funded</option>
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="interview">Interview</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
            <button onClick={exportExcel} className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-emerald text-accent px-4 py-2 text-sm font-semibold shadow-emerald hover-lift">
              <Download className="size-4" /> Export Excel
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <Th>Nama</Th>
                  <Th>Kontak</Th>
                  <Th>Kota</Th>
                  <Th>Kategori</Th>
                  <Th>Status</Th>
                  <Th>Berkas</Th>
                  <Th>Daftar</Th>
                  <Th>Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">Tidak ada data.</td></tr>
                ) : filtered.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-secondary/30">
                    <Td>
                      <div className="font-medium">{r.full_name}</div>
                      <div className="text-xs text-muted-foreground">{r.education}</div>
                    </Td>
                    <Td>
                      <div className="text-xs">{r.email}</div>
                      <div className="text-xs text-muted-foreground">{r.whatsapp}</div>
                    </Td>
                    <Td>{r.city}</Td>
                    <Td>{r.category ? CAT_LABEL[r.category] : "—"}</Td>
                    <Td>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${STATUS_COLOR[r.status]}`}>
                        {r.status}
                      </span>
                    </Td>
                    <Td>
                      {hasSubmittedDocs(r) ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald">
                          <FileCheck className="size-3.5" /> Sudah Kirim
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600">
                          <FileX className="size-3.5" /> Belum Kirim
                        </span>
                      )}
                    </Td>
                    <Td className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("id-ID")}</Td>
                    <Td>
                      <button onClick={() => setDetail(r)} className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
                        <Eye className="size-4" /> Detail
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">{detail.full_name}</DialogTitle>
                <DialogDescription>
                  Terdaftar {new Date(detail.created_at).toLocaleString("id-ID")}
                </DialogDescription>
              </DialogHeader>

              <div className="grid sm:grid-cols-[120px,1fr] gap-4 mt-2">
                {detail.photo_url && (
                  <img src={detail.photo_url} alt={detail.full_name} className="size-28 rounded-xl object-cover border border-border" />
                )}
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <Row k="Email" v={detail.email} />
                  <Row k="WhatsApp" v={detail.whatsapp} />
                  <Row k="Gender" v={detail.gender} />
                  <Row k="Tanggal Lahir" v={detail.birth_date} />
                  <Row k="Kota" v={detail.city} />
                  <Row k="Pendidikan" v={detail.education} />
                  <Row k="Pekerjaan" v={detail.occupation} />
                  <Row k="Kategori" v={detail.category ? CAT_LABEL[detail.category] : "—"} />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {detail.cv_url && (
                  <button onClick={() => downloadCv(detail.cv_url!, `${detail.full_name}-CV.pdf`)} className="inline-flex items-center gap-1.5 rounded-full bg-emerald/10 text-emerald px-4 py-2 text-sm font-medium hover:bg-emerald/20">
                    <FileDown className="size-4" /> Download CV
                  </button>
                )}
                {detail.photo_url && (
                  <a href={detail.photo_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 text-accent px-4 py-2 text-sm font-medium hover:bg-accent/25">
                    <ImageIcon className="size-4" /> Lihat Foto
                  </a>
                )}
              </div>

              <div className="mt-6 space-y-4">
                <Essay title="Kenapa kamu layak dipilih?" body={detail.essay_worthy} />
                <Essay title="Apa impianmu setelah ke Tanah Suci?" body={detail.essay_dream} />
                <Essay title="Bagaimana kontribusimu untuk umat?" body={detail.essay_contribution} />
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Ubah Status</div>
                <div className="flex flex-wrap gap-2">
                  {(["pending", "reviewed", "interview", "accepted", "rejected"] as Status[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(detail.id, s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                        detail.status === s ? STATUS_COLOR[s] : "border-border bg-background hover:bg-secondary"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border space-y-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Kirim WhatsApp ({detail.whatsapp})</div>
                <textarea
                  value={waMsg}
                  onChange={(e) => setWaMsg(e.target.value)}
                  placeholder={`Assalamu'alaikum ${detail.full_name}, terima kasih telah mendaftar program Safar Iman...`}
                  className="w-full min-h-[90px] rounded-md border border-input bg-background p-3 text-sm"
                />
                <div className="flex flex-wrap gap-2">
                  {(["pendaftaran","lolos","ditolak","custom"] as const).map((k) => (
                    <button
                      key={k}
                      onClick={() => setWaMsg(fillTemplate(templates[k] ?? "", detail))}
                      className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-secondary capitalize"
                    >Template {k}</button>
                  ))}
                  <button
                    disabled={waSending || !waMsg.trim()}
                    onClick={() => sendWa(detail.whatsapp, waMsg)}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald text-white px-4 py-2 text-sm font-semibold disabled:opacity-50 hover:bg-emerald-deep"
                  >
                    {waSending ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />} Kirim WA
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}

function Stat({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: number; tint: "emerald" | "amber" | "red" }) {
  const tints = {
    emerald: "bg-emerald/10 text-emerald",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
  } as const;
  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex items-center gap-3">
      <div className={`size-11 rounded-xl grid place-items-center ${tints[tint]}`}>{icon}</div>
      <div>
        <div className="text-2xl font-display font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-semibold px-4 py-3 whitespace-nowrap">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}
function Row({ k, v }: { k: string; v: string }) {
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
      <div className="text-xs uppercase tracking-wider text-accent font-semibold">{title}</div>
      <p className="text-sm text-foreground/90 mt-1 leading-relaxed whitespace-pre-line">{body}</p>
    </div>
  );
}
