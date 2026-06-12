import { useEffect, useMemo, useState } from "react";
import {
  Search, Download, Eye, FileDown, Image as ImageIcon, Loader2, MessageCircle,
  FileCheck, FileX, HeartHandshake, XCircle, Copy, Wallet,
} from "lucide-react";

import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { AdminLoading, useAdminGuard } from "@/components/AdminShell";

type Status = "pending" | "reviewed" | "interview" | "accepted" | "rejected";
type Category = "fully_funded" | "partial_funded" | "self_funded" | "gelombang_1" | "gelombang_2";

export type PesertaKind = "reguler" | "self_funded";

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
  gelombang_1: "Fast Track • Gelombang 1",
  gelombang_2: "Fast Track • Gelombang 2",
};

const CAT_COLOR: Record<Category, string> = {
  fully_funded: "bg-emerald/10 text-emerald border-emerald/30",
  partial_funded: "bg-emerald/10 text-emerald border-emerald/30",
  self_funded: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  gelombang_1: "bg-accent/15 text-accent border-accent/40",
  gelombang_2: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
};

const isGelombang = (c: Category | null) => c === "gelombang_1" || c === "gelombang_2";


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

export function PesertaTable({ kind }: { kind: PesertaKind }) {
  const ready = useAdminGuard();
  const isSelf = kind === "self_funded";
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Participant[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status | "all" | "paid">("all");
  const [detail, setDetail] = useState<Participant | null>(null);
  const [docFilter, setDocFilter] = useState<"all" | "registered" | "submitted">("all");
  const [apiKey, setApiKey] = useState("");
  const [sender, setSender] = useState("");
  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [waMsg, setWaMsg] = useState("");
  const [waSending, setWaSending] = useState(false);
  const [autoLolos, setAutoLolos] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const [catFilter, setCatFilter] = useState<"all" | "fully_partial" | "gelombang_1" | "gelombang_2">("all");


  useEffect(() => {
    if (!ready) return;
    (async () => {
      const query = supabase.from("participants").select("*").order("created_at", { ascending: false });
      const [{ data: list, error }, { data: cfg }] = await Promise.all([
        isSelf
          ? query.eq("category", "self_funded")
          : query.or("category.is.null,category.eq.fully_funded,category.eq.partial_funded,category.eq.gelombang_1,category.eq.gelombang_2"),
        supabase.from("app_settings").select("key,value"),
      ]);
      if (error) toast.error(error.message);
      else setRows((list ?? []) as Participant[]);
      const map = Object.fromEntries((cfg ?? []).map((r: any) => [r.key, r.value ?? ""]));
      setApiKey(map.mpwa_api_key ?? "");
      setSender(map.mpwa_sender ?? "");
      setTemplates({
        pendaftaran: map.wa_template_pendaftaran ?? "",
        pendaftaran_self: map.wa_template_pendaftaran_self ?? "",
        lolos: map.wa_template_lolos ?? "",
        ditolak: map.wa_template_ditolak ?? "",
        custom: map.wa_template_custom ?? "",
      });
      setAutoLolos((map.auto_lolos_enabled ?? "false") === "true");
      setLoading(false);

    })();
  }, [ready, isSelf]);


  const hasSubmittedDocs = (p: Participant) =>
    !!(p.cv_url || p.photo_url || p.essay_worthy || p.essay_dream || p.essay_contribution);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status === "paid") { if (r.payment_status !== "paid") return false; }
      else if (status !== "all" && r.status !== status) return false;
      if (!isSelf) {
        if (catFilter === "fully_partial" && (r.category !== "fully_funded" && r.category !== "partial_funded" && r.category !== null)) return false;
        if (catFilter === "gelombang_1" && r.category !== "gelombang_1") return false;
        if (catFilter === "gelombang_2" && r.category !== "gelombang_2") return false;
        if (docFilter === "registered" && hasSubmittedDocs(r)) return false;
        if (docFilter === "submitted" && !hasSubmittedDocs(r)) return false;
      }
      if (!term) return true;
      return [r.full_name, r.email, r.whatsapp, r.city, r.registration_code].some((v) => v?.toLowerCase().includes(term));
    });
  }, [rows, q, status, docFilter, catFilter, isSelf]);

  const stats = useMemo(() => ({
    registeredOnly: rows.filter((r) => !hasSubmittedDocs(r)).length,
    submitted: rows.filter(hasSubmittedDocs).length,
    regulerCount: rows.filter((r) => !isGelombang(r.category)).length,
    g1Count: rows.filter((r) => r.category === "gelombang_1").length,
    g2Count: rows.filter((r) => r.category === "gelombang_2").length,
    g1Paid: rows.filter((r) => r.category === "gelombang_1" && r.payment_status === "paid").length,
    g2Paid: rows.filter((r) => r.category === "gelombang_2" && r.payment_status === "paid").length,
    donasiPaid: rows.filter((r) => !isGelombang(r.category) && r.payment_status === "paid").length,
  }), [rows]);


  const exportExcel = () => {
    const data = filtered.map((r) => ({
      "Kode": r.registration_code,
      "Tanggal Daftar": new Date(r.created_at).toLocaleString("id-ID"),
      "Nama": r.full_name, "Email": r.email, "WhatsApp": r.whatsapp,
      "Gender": r.gender, "Tanggal Lahir": r.birth_date, "Kota": r.city,
      "Pendidikan": r.education, "Pekerjaan": r.occupation,
      "Kategori": r.category ? CAT_LABEL[r.category] : "-",
      "Status": STATUS_LABEL[r.status],
      "Jenis Pembayaran": isGelombang(r.category) ? "Biaya Pendaftaran" : "Donasi",
      "Status Pembayaran": r.payment_status === "paid" ? "Valid" : (r.payment_status === "pending" ? "Pending" : "Belum"),
      "Tanggal Pembayaran": r.paid_at ? new Date(r.paid_at).toLocaleString("id-ID") : "-",
      ...(isSelf ? {} : {
        "Essay Layak": r.essay_worthy,
        "Essay Impian": r.essay_dream,
        "Essay Kontribusi": r.essay_contribution,
      }),

    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Peserta");
    XLSX.writeFile(wb, `safar-iman-${kind}-${Date.now()}.xlsx`);
    toast.success(`${data.length} data diekspor`);
  };

  const updateStatus = async (id: string, s: Status) => {
    const { error } = await supabase.from("participants").update({ status: s }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: s } : r)));
    if (detail?.id === id) setDetail({ ...detail, status: s });
    toast.success(`Status: ${STATUS_LABEL[s]}`);
  };


  const markPaidManual = async (id: string) => {
    const row = rows.find((r) => r.id === id);
    const gel = row ? isGelombang(row.category) : false;
    const label = gel ? "biaya pendaftaran" : "donasi";
    if (!confirm(`Tandai ${label} sebagai VALID secara manual?`)) return;
    const now = new Date().toISOString();
    const shouldAutoLolos = !gel && autoLolos;
    const patch: any = { payment_status: "paid", paid_at: now };
    if (shouldAutoLolos) patch.status = "accepted";
    const { error } = await supabase.from("participants").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    if (detail?.id === id) setDetail({ ...detail, ...patch });
    toast.success(gel ? "Pendaftaran ditandai lunas" : (shouldAutoLolos ? "Donasi valid · Status otomatis Lolos" : "Donasi ditandai valid"));

    // Auto kirim WA notif untuk jalur Fast Track setelah konfirmasi manual.
    if (gel && row?.registration_code) {
      try {
        const { notifyWa } = await import("@/lib/api");
        await notifyWa("pendaftaran", row.registration_code);
        toast.success("Notifikasi WA terkirim");
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Bulk operations
  const visibleIds = useMemo(() => filtered.map((r) => r.id), [filtered]);
  const allChecked = selected.size > 0 && visibleIds.every((id) => selected.has(id));
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected((prev) => {
      if (visibleIds.every((id) => prev.has(id))) {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      visibleIds.forEach((id) => next.add(id));
      return next;
    });
  };
  const bulkUpdateStatus = async (s: Status) => {
    if (selected.size === 0) return;
    if (!confirm(`Ubah status ${selected.size} peserta menjadi "${STATUS_LABEL[s]}"?`)) return;
    setBulkBusy(true);
    const ids = Array.from(selected);
    const { error } = await supabase.from("participants").update({ status: s }).in("id", ids);
    setBulkBusy(false);
    if (error) { toast.error(error.message); return; }
    setRows((prev) => prev.map((r) => (selected.has(r.id) ? { ...r, status: s } : r)));
    setSelected(new Set());
    toast.success(`${ids.length} peserta → ${STATUS_LABEL[s]}`);
  };


  const unmarkPaidManual = async (id: string) => {
    if (!confirm("Batalkan status donasi valid peserta ini?")) return;
    const { error } = await supabase.from("participants").update({ payment_status: "unpaid", paid_at: null }).eq("id", id);
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
      const { mpwaProxy } = await import("@/lib/api");
      const json: any = await mpwaProxy("send-message", { api_key: apiKey, sender, number: clean, message, footer: "Safar Iman" });
      if (json?.status === false && json?.message) throw new Error(json.message);
      toast.success(`WA terkirim ke ${clean}`);
      return true;
    } catch (e: any) { toast.error(e.message || "Gagal kirim WA"); return false; }
    finally { setWaSending(false); }
  };

  if (!ready || loading) return <AdminLoading />;

  const tplKeys = isSelf
    ? (["pendaftaran_self", "custom"] as const)
    : (["pendaftaran", "lolos", "ditolak", "custom"] as const);

  return (
    <>
      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        {!isSelf && (
          <>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Jalur Peserta</div>
              <div className="flex flex-wrap gap-2">
                {([
                  { key: "all", label: `Semua (${rows.length})` },
                  { key: "fully_partial", label: `Reguler (${stats.regulerCount})` },
                  { key: "gelombang_1", label: `Gelombang 1 (${stats.g1Count} · ${stats.g1Paid} bayar)` },
                  { key: "gelombang_2", label: `Gelombang 2 (${stats.g2Count} · ${stats.g2Paid} bayar)` },
                ] as const).map((t) => (
                  <button key={t.key} onClick={() => setCatFilter(t.key)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                      catFilter === t.key ? "bg-accent text-accent-foreground border-accent shadow-sm" : "border-border bg-background hover:bg-secondary"
                    }`}>{t.label}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Tahap Berkas</div>
              <div className="flex flex-wrap gap-2">
                {([
                  { key: "all", label: `Semua (${rows.length})` },
                  { key: "registered", label: `Hanya Daftar (${stats.registeredOnly})` },
                  { key: "submitted", label: `Sudah Kirim Berkas (${stats.submitted})` },
                ] as const).map((t) => (
                  <button key={t.key} onClick={() => setDocFilter(t.key)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                      docFilter === t.key ? "bg-emerald text-white border-emerald shadow-emerald" : "border-border bg-background hover:bg-secondary"
                    }`}>{t.label}</button>
                ))}
              </div>
            </div>
          </>
        )}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, kode, email, WA, kota..." className="pl-9" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu</option>
            {!isSelf && <option value="accepted">Lolos</option>}
            {!isSelf && <option value="rejected">Belum Lolos</option>}
            {!isSelf && <option value="paid">Sudah Bayar / Donasi</option>}
          </select>
          <button onClick={exportExcel} className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-emerald text-accent px-4 py-2 text-sm font-semibold shadow-emerald hover-lift">
            <Download className="size-4" /> Export
          </button>
        </div>
      </div>



      {!isSelf && selected.size > 0 && (
        <div className="sticky top-14 z-10 bg-emerald/10 border border-emerald/30 rounded-2xl p-3 flex flex-wrap items-center gap-3">
          <div className="text-sm font-semibold text-emerald-deep">
            {selected.size} peserta dipilih
          </div>
          {autoLolos && (
            <span className="text-[11px] px-2 py-1 rounded-full bg-emerald/20 text-emerald-deep border border-emerald/40">
              Auto Lolos aktif
            </span>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              disabled={bulkBusy}
              onClick={() => bulkUpdateStatus("accepted")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-emerald text-white hover:bg-emerald-deep disabled:opacity-60"
            >
              <FileCheck className="size-4" /> Tandai Lolos
            </button>
            <button
              disabled={bulkBusy}
              onClick={() => bulkUpdateStatus("rejected")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-60"
            >
              <XCircle className="size-4" /> Belum Lolos
            </button>
            <button
              disabled={bulkBusy}
              onClick={() => bulkUpdateStatus("pending")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border border-border bg-background hover:bg-secondary disabled:opacity-60"
            >
              Reset Menunggu
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border border-border hover:bg-secondary"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
              <tr>
                {!isSelf && (
                  <Th>
                    <input
                      type="checkbox"
                      aria-label="Pilih semua"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="size-4 rounded border-border accent-emerald cursor-pointer"
                    />
                  </Th>
                )}
                <Th>Kode</Th><Th>Nama</Th>
                {!isSelf && <Th>Jalur</Th>}
                <Th>Kontak</Th><Th>Kota</Th>
                {!isSelf && <Th>Berkas</Th>}
                <Th>Status</Th>
                {!isSelf && <Th>Pembayaran</Th>}
                <Th>Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={isSelf ? 6 : 10} className="text-center py-10 text-muted-foreground">Tidak ada data.</td></tr>
              ) : filtered.map((r) => {
                const gel = isGelombang(r.category);
                const payLabel = gel ? "Bayar Pendaftaran" : "Donasi";
                return (
                <tr key={r.id} className="border-t border-border hover:bg-secondary/30">
                  {!isSelf && (
                    <Td>
                      <input
                        type="checkbox"
                        aria-label={`Pilih ${r.full_name}`}
                        checked={selected.has(r.id)}
                        onChange={() => toggleOne(r.id)}
                        className="size-4 rounded border-border accent-emerald cursor-pointer"
                      />
                    </Td>
                  )}
                  <Td>
                    <button onClick={() => copyCode(r.registration_code)} className="inline-flex items-center gap-1 font-mono text-xs px-2 py-1 rounded-md bg-emerald/10 text-emerald hover:bg-emerald/20">
                      {r.registration_code} <Copy className="size-3" />
                    </button>
                  </Td>

                  <Td>
                    <div className="font-medium">{r.full_name}</div>
                    <div className="text-xs text-muted-foreground">{r.education}</div>
                  </Td>
                  {!isSelf && (
                    <Td>
                      {r.category ? (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium border ${CAT_COLOR[r.category]}`}>
                          {CAT_LABEL[r.category]}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                    </Td>
                  )}
                  <Td>
                    <div className="text-xs">{r.email}</div>
                    <div className="text-xs text-muted-foreground">{r.whatsapp}</div>
                  </Td>
                  <Td>{r.city}</Td>
                  {!isSelf && (
                    <Td>
                      {isGelombang(r.category) ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent" title="Fast Track: berkas otomatis terkonfirmasi">
                          <FileCheck className="size-3.5" /> Auto (Fast Track)
                        </span>
                      ) : hasSubmittedDocs(r) ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald"><FileCheck className="size-3.5" /> Sudah</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600"><FileX className="size-3.5" /> Belum</span>
                      )}
                    </Td>
                  )}
                  <Td>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${STATUS_COLOR[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </Td>
                  {!isSelf && (
                    <Td>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{payLabel}</span>
                        {r.payment_status === "paid" ? (
                          <span className={`inline-flex w-fit items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            gel ? "bg-accent/15 text-accent border-accent/40" : "bg-gradient-gold text-emerald-deep border-accent/40"
                          }`}>
                            {gel ? <Wallet className="size-3.5" /> : <HeartHandshake className="size-3.5" />} Valid
                          </span>
                        ) : r.payment_status === "pending" ? (
                          <span className="text-[11px] text-amber-600 font-medium">Pending</span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Belum</span>
                        )}
                      </div>
                    </Td>
                  )}
                  <Td>
                    <button onClick={() => setDetail(r)} className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
                      <Eye className="size-4" /> Detail
                    </button>
                  </Td>
                </tr>
                );
              })}
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

              {!isSelf && (
                <>
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
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold border ${
                        isGelombang(detail.category)
                          ? "bg-accent/15 text-accent border-accent/40"
                          : "bg-gradient-gold text-emerald-deep border-accent/40"
                      }`}>
                        {isGelombang(detail.category) ? <Wallet className="size-4" /> : <HeartHandshake className="size-4" />}
                        {isGelombang(detail.category) ? "Biaya Pendaftaran Lunas" : "Donasi Valid"} · {detail.paid_at ? new Date(detail.paid_at).toLocaleDateString("id-ID") : ""}
                      </span>
                    )}

                  </div>

                  {/* Pertanyaan essay disembunyikan — review essay dilakukan di menu Berkas Essay. */}


                  <div className="mt-6 pt-4 border-t border-border">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                      {isGelombang(detail.category) ? "Biaya Pendaftaran Gelombang" : "Donasi Peserta"}
                    </div>
                    {detail.payment_status === "paid" ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold border ${
                          isGelombang(detail.category)
                            ? "bg-accent/15 text-accent border-accent/40"
                            : "bg-gradient-gold text-emerald-deep border-accent/40"
                        }`}>
                          {isGelombang(detail.category) ? <Wallet className="size-4" /> : <HeartHandshake className="size-4" />}
                          {isGelombang(detail.category) ? "Pendaftaran Lunas" : "Donasi Valid"} · {detail.paid_at ? new Date(detail.paid_at).toLocaleString("id-ID") : ""}
                        </span>
                        <button onClick={() => unmarkPaidManual(detail.id)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border border-red-500/40 text-red-600 hover:bg-red-500/10">
                          <XCircle className="size-3.5" /> Batalkan
                        </button>
                      </div>
                    ) : isGelombang(detail.category) ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Peserta jalur <strong>{CAT_LABEL[detail.category!]}</strong> wajib membayar biaya pendaftaran sebelum melanjutkan. Jika sudah membayar di luar sistem, tandai manual.</p>
                        <button onClick={() => markPaidManual(detail.id)} className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-5 py-2.5 text-sm font-bold border border-accent/40 hover-lift">
                          <Wallet className="size-4" /> Tandai Bayar Pendaftaran (Manual)
                        </button>
                      </div>
                    ) : hasSubmittedDocs(detail) ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Peserta sudah mengirim berkas. Jika sudah membayar donasi di luar sistem, tandai manual di sini agar keputusan kelulusan dapat ditentukan.</p>
                        <button onClick={() => markPaidManual(detail.id)} className="inline-flex items-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-5 py-2.5 text-sm font-bold border border-accent/40 shadow-gold hover-lift">
                          <HeartHandshake className="size-4" /> Tandai Donasi Valid (Manual)
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Donasi dapat ditandai setelah peserta mengirim berkas.</p>
                    )}
                  </div>

                  {!isGelombang(detail.category) && hasSubmittedDocs(detail) && (
                    <div className="mt-6 pt-4 border-t border-border">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Keputusan Kelulusan</div>
                      {detail.payment_status !== "paid" ? (
                        <p className="text-sm text-muted-foreground">
                          Status <strong>Lolos / Belum Lolos</strong> dapat dipilih setelah donasi peserta ditandai valid.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Status saat ini:{" "}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_COLOR[detail.status]}`}>
                              {STATUS_LABEL[detail.status]}
                            </span>
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => updateStatus(detail.id, "accepted")}
                              disabled={detail.status === "accepted"}
                              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition ${
                                detail.status === "accepted"
                                  ? "bg-emerald text-white border-emerald shadow-emerald"
                                  : "border-emerald/40 text-emerald hover:bg-emerald/10"
                              }`}
                            >
                              <FileCheck className="size-4" /> Lolos
                            </button>
                            <button
                              onClick={() => updateStatus(detail.id, "rejected")}
                              disabled={detail.status === "rejected"}
                              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition ${
                                detail.status === "rejected"
                                  ? "bg-red-500 text-white border-red-500"
                                  : "border-red-500/40 text-red-600 hover:bg-red-500/10"
                              }`}
                            >
                              <XCircle className="size-4" /> Belum Lolos
                            </button>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Catatan: review essay tetap dapat dilakukan pada menu <strong>Berkas Essay</strong>.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}


              {isSelf && (
                <div className="mt-5 p-4 rounded-xl bg-accent/10 border border-accent/30 text-sm">
                  Jalur <strong>Self Funded</strong> tidak memerlukan pengiriman berkas, essay, maupun donasi. Cukup gunakan kode pendaftaran untuk cek status.
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-border space-y-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Kirim WhatsApp ({detail.whatsapp})</div>
                <textarea value={waMsg} onChange={(e) => setWaMsg(e.target.value)}
                  placeholder={`Assalamu'alaikum ${detail.full_name}, ...`}
                  className="w-full min-h-[90px] rounded-md border border-input bg-background p-3 text-sm" />
                <div className="flex flex-wrap gap-2">
                  {tplKeys.map((k) => (
                    <button key={k} onClick={() => setWaMsg(fillTemplate(templates[k] ?? "", detail))}
                      className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-secondary capitalize">Template {k.replace("_", " ")}</button>
                  ))}
                  <button disabled={waSending || !waMsg.trim()} onClick={() => sendWa(detail.whatsapp, waMsg)}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald text-white px-4 py-2 text-sm font-semibold disabled:opacity-50 hover:bg-emerald-deep">
                    {waSending ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />} Kirim WA
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
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
