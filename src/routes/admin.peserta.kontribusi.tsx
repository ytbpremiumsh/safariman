import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Download, Copy, HeartHandshake, HandCoins, MessageCircle, AlertCircle, CheckCircle2 } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/peserta/kontribusi")({
  head: () => ({ meta: [{ title: "Peserta Kontribusi Valid — Safar Iman Admin" }] }),
  component: PesertaKontribusiPage,
});

type Category = "fully_funded" | "partial_funded" | "self_funded" | "gelombang_1" | "gelombang_2";

const CAT_LABEL: Record<Category, string> = {
  fully_funded: "Fully Funded",
  partial_funded: "Partial Funded",
  self_funded: "Self Funded",
  gelombang_1: "Fast Track G1",
  gelombang_2: "Fast Track G2",
};

// Kategori yang wajib berkontribusi/donasi
const DONATION_CATS: Category[] = ["fully_funded", "partial_funded"];

type Row = {
  id: string;
  registration_code: string;
  full_name: string;
  email: string;
  whatsapp: string;
  city: string | null;
  category: Category | null;
  donation_status: string | null;
  donation_paid_at: string | null;
  donation_url: string | null;
  created_at: string;
};

const COLS =
  "id,registration_code,full_name,email,whatsapp,city,category,donation_status,donation_paid_at,donation_url,created_at";

function PesertaKontribusiPage() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [paidRows, setPaidRows] = useState<Row[]>([]);
  const [unpaidRows, setUnpaidRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<"paid" | "unpaid">("paid");
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState<Category | "all">("all");

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const PAGE = 1000;
      const fetchAll = async (build: () => any) => {
        const all: Row[] = [];
        for (let from = 0; ; from += PAGE) {
          const { data, error } = await build().range(from, from + PAGE - 1);
          if (error) { toast.error(error.message); return all; }
          const rows = (data ?? []) as Row[];
          all.push(...rows);
          if (rows.length < PAGE) break;
          if (from > 100000) break; // safety
        }
        return all;
      };
      const [paid, unpaid] = await Promise.all([
        fetchAll(() => supabase
          .from("participants")
          .select(COLS)
          .eq("donation_status", "paid")
          .order("donation_paid_at", { ascending: false })),
        fetchAll(() => supabase
          .from("participants")
          .select(COLS)
          .in("category", DONATION_CATS)
          .or("donation_status.is.null,donation_status.neq.paid")
          .order("created_at", { ascending: false })),
      ]);
      setPaidRows(paid);
      setUnpaidRows(unpaid);
      setLoading(false);
    })();
  }, [ready]);

  const activeRows = tab === "paid" ? paidRows : unpaidRows;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return activeRows.filter((r) => {
      if (catFilter !== "all" && r.category !== catFilter) return false;
      if (!term) return true;
      return [r.full_name, r.email, r.whatsapp, r.city, r.registration_code]
        .some((v) => v?.toLowerCase().includes(term));
    });
  }, [activeRows, q, catFilter]);

  const stats = useMemo(() => {
    const byCat = (c: Category) => paidRows.filter((r) => r.category === c).length;
    return {
      total: paidRows.length,
      fully: byCat("fully_funded"),
      partial: byCat("partial_funded"),
      self: byCat("self_funded"),
      g1: byCat("gelombang_1"),
      g2: byCat("gelombang_2"),
    };
  }, [paidRows]);

  const unpaidStats = useMemo(() => ({
    total: unpaidRows.length,
    pending: unpaidRows.filter((r) => r.donation_status === "pending").length,
    belumMulai: unpaidRows.filter((r) => !r.donation_status).length,
  }), [unpaidRows]);

  const exportExcel = () => {
    const data = filtered.map((r) => ({
      Kode: r.registration_code,
      Nama: r.full_name,
      Email: r.email,
      WhatsApp: r.whatsapp,
      Kota: r.city ?? "",
      Kategori: r.category ? CAT_LABEL[r.category] : "-",
      Status: tab === "paid" ? "Valid" : (r.donation_status ?? "Belum Mulai"),
      "Tanggal Kontribusi": r.donation_paid_at ? new Date(r.donation_paid_at).toLocaleString("id-ID") : "-",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tab === "paid" ? "Kontribusi Valid" : "Belum Kontribusi");
    XLSX.writeFile(wb, `safar-iman-kontribusi-${tab}-${Date.now()}.xlsx`);
    toast.success(`${data.length} data diekspor`);
  };

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast.success(`Disalin: ${txt}`);
  };

  const waLink = (wa: string, nama: string, kode: string) => {
    const num = (wa ?? "").replace(/[^\d]/g, "").replace(/^0/, "62");
    const msg = encodeURIComponent(
      `Assalamu'alaikum ${nama},\n\nKami dari panitia Safar Iman ingin mengingatkan bahwa kontribusi/donasi kamu belum tercatat.\n\nKode: ${kode}\n\nMohon segera diselesaikan agar bisa lanjut ke tahap berikutnya. Jazakumullah khairan.`,
    );
    return `https://wa.me/${num}?text=${msg}`;
  };

  const markPaidManual = async (r: Row) => {
    if (!confirm(`Tandai kontribusi LUNAS untuk ${r.full_name} (${r.registration_code})?\n\nAksi ini akan menandai donasi sebagai valid secara manual.`)) return;
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("participants")
      .update({ donation_status: "paid", donation_paid_at: now })
      .eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    setUnpaidRows((rows) => rows.filter((x) => x.id !== r.id));
    setPaidRows((rows) => [{ ...r, donation_status: "paid", donation_paid_at: now }, ...rows]);
    toast.success(`Kontribusi ${r.registration_code} ditandai lunas`);
    // Fire-and-forget email notification
    supabase.functions.invoke("email-notify", { body: { event: "kontribusi", code: r.registration_code } }).catch(() => {});
  };

  if (!ready || loading) return <AdminLoading />;

  return (
    <AdminShell title="Peserta Kontribusi">
      <p className="text-sm text-muted-foreground -mt-3">
        Pantau peserta yang <strong>sudah berkontribusi</strong> maupun yang <strong>belum</strong>. Kategori Self Funded / Fast Track tidak termasuk daftar kontribusi (mereka via pembayaran pendaftaran).
      </p>

      {/* Tabs */}
      <div className="bg-card border border-border rounded-2xl p-1 inline-flex flex-wrap gap-1">
        <button
          onClick={() => setTab("paid")}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
            tab === "paid" ? "bg-gradient-emerald text-accent shadow-emerald" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          <HeartHandshake className="size-4" /> Kontribusi Valid
          <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-background/60 border border-border">
            {paidRows.length}
          </span>
        </button>
        <button
          onClick={() => setTab("unpaid")}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
            tab === "unpaid" ? "bg-amber-500 text-white shadow-md" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          <HandCoins className="size-4" /> Belum Kontribusi
          <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-white/25 border border-white/30">
            {unpaidRows.length}
          </span>
        </button>
      </div>

      {tab === "paid" ? (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: "Total Valid", value: stats.total, color: "text-accent" },
            { label: "Fully Funded", value: stats.fully, color: "text-foreground" },
            { label: "Partial Funded", value: stats.partial, color: "text-foreground" },
            { label: "Self Funded", value: stats.self, color: "text-foreground" },
            { label: "Fast Track G1", value: stats.g1, color: "text-foreground" },
            { label: "Fast Track G2", value: stats.g2, color: "text-foreground" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className={`text-2xl font-display font-semibold mt-1 ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="size-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <div className="font-semibold text-amber-900 dark:text-amber-200">
                {unpaidRows.length} peserta belum berkontribusi
              </div>
              <div className="text-xs text-amber-800/80 dark:text-amber-200/70 mt-0.5">
                Peserta kategori Fully / Partial Funded yang belum menyelesaikan kontribusi/donasi. Ingatkan via WhatsApp agar bisa lanjut ke tahap berikutnya.
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "Total Belum", value: unpaidStats.total, color: "text-amber-600" },
              { label: "Invoice Pending", value: unpaidStats.pending, color: "text-foreground" },
              { label: "Belum Ada Invoice", value: unpaidStats.belumMulai, color: "text-foreground" },
            ].map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
                <div className={`text-2xl font-display font-semibold mt-1 ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama, kode, email, WA, kota…"
            className="pl-9"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value as Category | "all")}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">Semua Kategori</option>
          {(tab === "unpaid" ? DONATION_CATS : (Object.keys(CAT_LABEL) as Category[])).map((c) => (
            <option key={c} value={c}>{CAT_LABEL[c]}</option>
          ))}
        </select>
        <button
          onClick={exportExcel}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-emerald text-accent px-4 py-2 text-sm font-semibold shadow-emerald hover-lift"
        >
          <Download className="size-4" /> Export
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
              <tr>
                <Th>Kode</Th><Th>Nama</Th><Th>Kategori</Th>
                <Th>Kontak</Th><Th>Kota</Th>
                <Th>{tab === "paid" ? "Tanggal Kontribusi" : "Status Donasi"}</Th>
                {tab === "unpaid" && <Th>Aksi</Th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={tab === "unpaid" ? 7 : 6} className="text-center py-10 text-muted-foreground">
                    {tab === "paid"
                      ? "Belum ada peserta yang valid berkontribusi."
                      : "🎉 Semua peserta sudah berkontribusi."}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-3 py-3">
                      <button
                        onClick={() => copy(r.registration_code)}
                        className="inline-flex items-center gap-1 font-mono text-xs px-2 py-1 rounded-md bg-accent/15 text-accent hover:bg-accent/25"
                      >
                        {r.registration_code} <Copy className="size-3" />
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium">{r.full_name}</div>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {r.category ? CAT_LABEL[r.category] : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs">{r.email}</div>
                      <div className="text-xs text-muted-foreground">{r.whatsapp}</div>
                    </td>
                    <td className="px-3 py-3 text-xs">{r.city ?? "—"}</td>
                    <td className="px-3 py-3 text-xs">
                      {tab === "paid" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border bg-emerald/10 text-emerald border-emerald/30">
                          <HeartHandshake className="size-3.5" />
                          {r.donation_paid_at
                            ? new Date(r.donation_paid_at).toLocaleString("id-ID")
                            : "Valid"}
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border ${
                          r.donation_status === "pending"
                            ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/30"
                            : "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/30"
                        }`}>
                          {r.donation_status === "pending" ? "Invoice Pending" : "Belum Mulai"}
                        </span>
                      )}
                    </td>
                    {tab === "unpaid" && (
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <a
                            href={waLink(r.whatsapp, r.full_name, r.registration_code)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded-md bg-emerald/15 text-emerald hover:bg-emerald/25"
                            title="Ingatkan via WhatsApp"
                          >
                            <MessageCircle className="size-3.5" /> Ingatkan
                          </a>
                          <button
                            onClick={() => markPaidManual(r)}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded-md bg-accent/15 text-accent hover:bg-accent/25"
                            title="Tandai kontribusi lunas secara manual"
                          >
                            <CheckCircle2 className="size-3.5" /> Tandai Lunas
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-3 py-2 font-medium">{children}</th>;
}
