import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Download, Copy, HeartHandshake } from "lucide-react";
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
  created_at: string;
};

const COLS =
  "id,registration_code,full_name,email,whatsapp,city,category,donation_status,donation_paid_at,created_at";

function PesertaKontribusiPage() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState<Category | "all">("all");

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data, error } = await supabase
        .from("participants")
        .select(COLS)
        .eq("donation_status", "paid")
        .order("donation_paid_at", { ascending: false });
      if (error) toast.error(error.message);
      else setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, [ready]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (catFilter !== "all" && r.category !== catFilter) return false;
      if (!term) return true;
      return [r.full_name, r.email, r.whatsapp, r.city, r.registration_code]
        .some((v) => v?.toLowerCase().includes(term));
    });
  }, [rows, q, catFilter]);

  const stats = useMemo(() => {
    const byCat = (c: Category) => rows.filter((r) => r.category === c).length;
    return {
      total: rows.length,
      fully: byCat("fully_funded"),
      partial: byCat("partial_funded"),
      self: byCat("self_funded"),
      g1: byCat("gelombang_1"),
      g2: byCat("gelombang_2"),
    };
  }, [rows]);

  const exportExcel = () => {
    const data = filtered.map((r) => ({
      Kode: r.registration_code,
      Nama: r.full_name,
      Email: r.email,
      WhatsApp: r.whatsapp,
      Kota: r.city ?? "",
      Kategori: r.category ? CAT_LABEL[r.category] : "-",
      "Tanggal Kontribusi": r.donation_paid_at ? new Date(r.donation_paid_at).toLocaleString("id-ID") : "-",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kontribusi");
    XLSX.writeFile(wb, `safar-iman-kontribusi-${Date.now()}.xlsx`);
    toast.success(`${data.length} data diekspor`);
  };

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast.success(`Disalin: ${txt}`);
  };

  if (!ready || loading) return <AdminLoading />;

  return (
    <AdminShell title="Peserta Kontribusi Valid">
      <p className="text-sm text-muted-foreground -mt-3">
        Daftar peserta yang sudah <strong>benar-benar valid membayar kontribusi/donasi</strong>. Total di sini
        merupakan perkiraan jumlah peserta yang telah menunaikan kontribusi.
      </p>

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
          {(Object.keys(CAT_LABEL) as Category[]).map((c) => (
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
                <Th>Kontak</Th><Th>Kota</Th><Th>Tanggal Kontribusi</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-muted-foreground">
                    Belum ada peserta yang valid berkontribusi.
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
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border bg-emerald/10 text-emerald border-emerald/30">
                        <HeartHandshake className="size-3.5" />
                        {r.donation_paid_at
                          ? new Date(r.donation_paid_at).toLocaleString("id-ID")
                          : "Valid"}
                      </span>
                    </td>
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
