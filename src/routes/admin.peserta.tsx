import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search, Download, Eye, FileDown, Image as ImageIcon, Loader2, MessageCircle,
  FileCheck, FileX, HeartHandshake, CheckCircle2, XCircle, Copy,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/peserta")({
  head: () => ({ meta: [{ title: "Peserta — Safar Iman Admin" }] }),
  component: PesertaPage,
});

type Status = "pending" | "reviewed" | "interview" | "accepted" | "rejected";
type Category = "fully_funded" | "partial_funded" | "self_funded";

type Participant = {
  id: string;
  created_at: string;
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
  payment_status: string;
  paid_at: string | null;
};

const CAT_LABEL: Record<Category, string> = {
  fully_funded: "Fully Funded",
  partial_funded: "Partial Funded",
  self_funded: "Self Funded",
};

const STATUS_LABEL: Record<Status, string> = {
  pending: "Menunggu",
  reviewed: "Direview",
  interview: "Interview",
  accepted: "Lolos",
  rejected: "Belum Lolos",
};

const STATUS_COLOR: Record<Status, string> = {
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  reviewed: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  interview: "bg-accent/20 text-accent border-accent/40",
  accepted: "bg-emerald/15 text-emerald border-emerald/30",
  rejected: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};

function PesertaPage() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Participant[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "all">("all");
  const [status, setStatus] = useState<Status | "all" | "paid">("all");
  const [detail, setDetail] = useState<Participant | null>(null);
  const [docFilter, setDocFilter] = useState<"all" | "registered" | "submitted">("all");
  const [apiKey, setApiKey] = useState("");
  const [sender, setSender] = useState("");
  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [waMsg, setWaMsg] = useState("");
  const [waSending, setWaSending] = useState(false);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const [{ data: list, error }, { data: cfg }] = await Promise.all([
        supabase.from("participants").select("*").order("created_at", { ascending: false }),
        supabase.from("app_settings").select("key,value"),
      ]);
      if (error) toast.error(error.message);
      else setRows((list ?? []) as Participant[]);
      const map = Object.fromEntries((cfg ?? []).map((r: any) => [r.key, r.value ?? ""]));
      setApiKey(map.mpwa_api_key ?? "");
      setSender(map.mpwa_sender ?? "");
      setTemplates({
        pendaftaran: map.wa_template_pendaftaran ?? "",
        lolos: map.wa_template_lolos ?? "",
        ditolak: map.wa_template_ditolak ?? "",
        custom: map.wa_template_custom ?? "",
      });
      setLoading(false);
    })();
  }, [ready]);

  const hasSubmittedDocs = (p: Participant) =>
    !!(p.cv_url || p.photo_url || p.essay_worthy || p.essay_dream || p.essay_contribution);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (cat !== "all" && r.category !== cat) return false;
      if (status === "paid") { if (r.payment_status !== "paid") return false; }
      else if (status !== "all" && r.status !== status) return false;
      if (docFilter === "registered" && hasSubmittedDocs(r)) return false;
      if (docFilter === "submitted" && !hasSubmittedDocs(r)) return false;
      if (!term) return true;
      return [r.full_name, r.email, r.whatsapp, r.city, r.registration_code].some((v) => v?.toLowerCase().includes(term));
    });
  }, [rows, q, cat, status, docFilter]);

  const stats = useMemo(() => ({
    registeredOnly: rows.filter((r) => !hasSubmittedDocs(r)).length,
    submitted: rows.filter(hasSubmittedDocs).length,
  }), [rows]);

  const exportExcel = () => {
    const data = filtered.map((r) => ({
      "Kode": r.registration_code,
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
      "Status": STATUS_LABEL[r.status],
      "Donasi": r.payment_status === "paid" ? "Valid" : "Belum",
      "Tanggal Donasi": r.paid_at ? new Date(r.paid_at).toLocaleString("id-ID") : "-",
      "Essay Layak": r.essay_worthy,
      "Essay Impian": r.essay_dream,
      "Essay Kontribusi": r.essay_contribution,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Peserta");
    XLSX.writeFile(wb, `safar-iman-peserta-${Date.now()}.xlsx`);
    toast.success(`${data.length} data diekspor`);
  };

  const updateStatus = async (id: string, newStatus: Status) => {
    const { error } = await supabase.from("participants").update({ status: newStatus }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    if (detail?.id === id) setDetail({ ...detail, status: newStatus });
    toast.success("Status diperbarui");
  };

  const markPaidManual = async (id: string) => {
    if (!confirm("Tandai donasi sebagai VALID secara manual? Peserta akan langsung bisa lanjut ke tahap Essay.")) return;
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("participants")
      .update({ payment_status: "paid", paid_at: now })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, payment_status: "paid", paid_at: now } : r)));
    if (detail?.id === id) setDetail({ ...detail, payment_status: "paid", paid_at: now });
    toast.success("Donasi ditandai valid");
  };

  const unmarkPaidManual = async (id: string) => {
    if (!confirm("Batalkan status donasi valid peserta ini?")) return;
    const { error } = await supabase
      .from("participants")
      .update({ payment_status: "unpaid", paid_at: null })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, payment_status: "unpaid", paid_at: null } : r)));
    if (detail?.id === id) setDetail({ ...detail, payment_status: "unpaid", paid_at: null });
    toast.success("Status donasi dibatalkan");
  };

  const downloadCv = async (path: string, name: string) => {
    const { data, error } = await supabase.storage.from("participant-cv").createSignedUrl(path, 60);
    if (error || !data) { toast.error("Gagal generate link"); return; }
    const a = document.createElement("a");
    a.href = data.signedUrl; a.download = name; a.target = "_blank";
    document.body.appendChild(a); a.click(); a.remove();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Kode ${code} disalin`);
  };

  const fillTemplate = (raw: string, p: Participant) => raw
    .replace(/\{nama\}/g, p.full_name)
    .replace(/\{kode\}/g, p.registration_code)
    .replace(/\{kategori\}/g, p.category ? CAT_LABEL[p.category] : "-")
    .replace(/\{status\}/g, STATUS_LABEL[p.status]);

  const sendWa = async (number: string, message: string) => {
    if (!apiKey || !sender) { toast.error("Atur MPWA dulu di WA Setup"); return false; }
    const clean = number.replace(/\D/g, "").replace(/^0/, "62");
    setWaSending(true);
    try {
      const res = await fetch("/api/public/mpwa/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey, sender, number: clean, message, footer: "Safar Iman" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || (json.status === false && json.message)) throw new Error(json.message || "Gagal kirim");
      toast.success(`WA terkirim ke ${clean}`);
      return true;
    } catch (e: any) { toast.error(e.message || "Gagal kirim WA"); return false; }
    finally { setWaSending(false); }
  };

  if (!ready || loading) return <AdminLoading />;

  return (
    <AdminShell title="Daftar Peserta">
      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {([
            { key: "all", label: `Semua (${rows.length})` },
            { key: "registered", label: `Hanya Daftar (${stats.registeredOnly})` },
            { key: "submitted", label: `Sudah Kirim Berkas (${stats.submitted})` },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setDocFilter(t.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                docFilter === t.key ? "bg-emerald text-white border-emerald shadow-emerald" : "border-border bg-background hover:bg-secondary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, kode, email, WA, kota..." className="pl-9" />
          </div>
          <select value={cat} onChange={(e) => setCat(e.target.value as typeof cat)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="all">Semua Kategori</option>
            <option value="fully_funded">Fully Funded</option>
            <option value="partial_funded">Partial Funded</option>
            <option value="self_funded">Self Funded</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="accepted">Lolos</option>
            <option value="rejected">Belum Lolos</option>
            <option value="paid">Donasi Valid</option>
          </select>
          <button onClick={exportExcel} className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-emerald text-accent px-4 py-2 text-sm font-semibold shadow-emerald hover-lift">
            <Download className="size-4" /> Export
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
              <tr>
                <Th>Kode</Th>
                <Th>Nama</Th>
                <Th>Kontak</Th>
                <Th>Kota</Th>
                <Th>Kategori</Th>
                <Th>Berkas</Th>
                <Th>Status</Th>
                <Th>Donasi</Th>
                <Th>Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-muted-foreground">Tidak ada data.</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-secondary/30">
                  <Td>
                    <button onClick={() => copyCode(r.registration_code)} className="inline-flex items-center gap-1 font-mono text-xs px-2 py-1 rounded-md bg-emerald/10 text-emerald hover:bg-emerald/20">
                      {r.registration_code} <Copy className="size-3" />
                    </button>
                  </Td>
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
                    {hasSubmittedDocs(r) ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald">
                        <FileCheck className="size-3.5" /> Sudah
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600">
                        <FileX className="size-3.5" /> Belum
                      </span>
                    )}
                  </Td>
                  <Td>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${STATUS_COLOR[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </Td>
                  <Td>
                    {r.payment_status === "paid" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gradient-gold text-emerald-deep border border-accent/40">
                        <HeartHandshake className="size-3.5" /> Valid
                      </span>
                    ) : r.payment_status === "pending" ? (
                      <span className="text-[11px] text-amber-600">Pending</span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </Td>
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

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">{detail.full_name}</DialogTitle>
                <DialogDescription>
                  Kode <span className="font-mono text-foreground">{detail.registration_code}</span> · Terdaftar {new Date(detail.created_at).toLocaleString("id-ID")}
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
                {detail.payment_status === "paid" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-gold text-emerald-deep px-4 py-2 text-sm font-bold border border-accent/40">
                    <HeartHandshake className="size-4" /> Donasi Valid · {detail.paid_at ? new Date(detail.paid_at).toLocaleDateString("id-ID") : ""}
                  </span>
                )}
              </div>

              <div className="mt-6 space-y-4">
                <Essay title="Kenapa kamu layak dipilih?" body={detail.essay_worthy} />
                <Essay title="Apa impianmu setelah ke Tanah Suci?" body={detail.essay_dream} />
                <Essay title="Bagaimana kontribusimu untuk umat?" body={detail.essay_contribution} />
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  {hasSubmittedDocs(detail) ? "Keputusan Seleksi Berkas" : "Status Pendaftaran"}
                </div>
                {hasSubmittedDocs(detail) ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateStatus(detail.id, "accepted")}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition ${
                        detail.status === "accepted"
                          ? "bg-emerald text-white border-emerald shadow-emerald"
                          : "border-emerald/40 text-emerald hover:bg-emerald/10"
                      }`}
                    >
                      <CheckCircle2 className="size-4" /> Lolos (lanjut donasi)
                    </button>
                    <button
                      onClick={() => updateStatus(detail.id, "rejected")}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition ${
                        detail.status === "rejected"
                          ? "bg-red-500 text-white border-red-500"
                          : "border-red-500/40 text-red-600 hover:bg-red-500/10"
                      }`}
                    >
                      <XCircle className="size-4" /> Belum Lolos
                    </button>
                    <button
                      onClick={() => updateStatus(detail.id, "pending")}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border border-border hover:bg-secondary"
                    >
                      Reset ke Menunggu
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Peserta belum mengirim berkas. Keputusan <strong>Lolos / Belum Lolos</strong> akan tersedia setelah berkas dikirim.
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Donasi Peserta</div>
                {detail.payment_status === "paid" ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-gold text-emerald-deep px-4 py-2 text-sm font-bold border border-accent/40">
                      <HeartHandshake className="size-4" /> Donasi Valid · {detail.paid_at ? new Date(detail.paid_at).toLocaleString("id-ID") : ""}
                    </span>
                    <button
                      onClick={() => unmarkPaidManual(detail.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border border-red-500/40 text-red-600 hover:bg-red-500/10"
                    >
                      <XCircle className="size-3.5" /> Batalkan
                    </button>
                  </div>
                ) : detail.status === "accepted" ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Peserta lolos berkas. Jika peserta sudah membayar di luar sistem (transfer manual, dll), kamu bisa tandai langsung di sini.
                    </p>
                    <button
                      onClick={() => markPaidManual(detail.id)}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-5 py-2.5 text-sm font-bold border border-accent/40 shadow-gold hover-lift"
                    >
                      <HeartHandshake className="size-4" /> Tandai Donasi Valid (Manual)
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Status donasi terbuka setelah peserta dinyatakan <strong>Lolos</strong>.
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-border space-y-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Kirim WhatsApp ({detail.whatsapp})</div>
                <textarea
                  value={waMsg}
                  onChange={(e) => setWaMsg(e.target.value)}
                  placeholder={`Assalamu'alaikum ${detail.full_name}, ...`}
                  className="w-full min-h-[90px] rounded-md border border-input bg-background p-3 text-sm"
                />
                <div className="flex flex-wrap gap-2">
                  {(["pendaftaran", "lolos", "ditolak", "custom"] as const).map((k) => (
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
    </AdminShell>
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
