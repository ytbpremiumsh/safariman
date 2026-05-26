import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Users, UserCheck, FileCheck, HeartHandshake, ArrowUpRight } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard Admin — Safar Iman" }] }),
  component: AdminOverview,
});

type Row = {
  created_at: string;
  updated_at: string;
  category: string | null;
  cv_url: string | null;
  photo_url: string | null;
  essay_worthy: string | null;
  essay_dream: string | null;
  essay_contribution: string | null;
  payment_status: string;
};

function AdminOverview() {
  const ready = useAdminGuard();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<7 | 14 | 30>(14);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data } = await supabase
        .from("participants")
        .select("created_at,updated_at,category,cv_url,photo_url,essay_worthy,essay_dream,essay_contribution,payment_status");
      setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, [ready]);

  const submitted = (r: Row) =>
    !!(r.cv_url || r.photo_url || r.essay_worthy || r.essay_dream || r.essay_contribution);

  const stats = useMemo(() => {
    const reguler = rows.filter((r) => r.category !== "self_funded");
    const self = rows.filter((r) => r.category === "self_funded");
    return {
      total: rows.length,
      reguler: reguler.length,
      self: self.length,
      submitted: rows.filter(submitted).length,
      paid: rows.filter((r) => r.payment_status === "paid").length,
    };
  }, [rows]);

  const chartData = useMemo(() => {
    const buckets: Record<string, { date: string; daftar: number; berkas: number }> = {};
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { date: key, daftar: 0, berkas: 0 };
    }
    for (const r of rows) {
      const dKey = r.created_at.slice(0, 10);
      if (buckets[dKey]) buckets[dKey].daftar += 1;
      if (submitted(r)) {
        const uKey = (r.updated_at || r.created_at).slice(0, 10);
        if (buckets[uKey]) buckets[uKey].berkas += 1;
      }
    }
    return Object.values(buckets).map((b) => ({
      ...b,
      label: new Date(b.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
    }));
  }, [rows, days]);

  if (!ready || loading) return <AdminLoading />;

  return (
    <AdminShell title="Ringkasan">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MiniStat label="Total Peserta" value={stats.total} />
        <MiniStat label="Reguler" value={stats.reguler} to="/admin/peserta/reguler" icon={<Users className="size-4" />} />
        <MiniStat label="Self Funded" value={stats.self} to="/admin/peserta/self-funded" icon={<UserCheck className="size-4" />} />
        <MiniStat label="Kirim Berkas" value={stats.submitted} icon={<FileCheck className="size-4" />} />
        <MiniStat label="Donasi Valid" value={stats.paid} icon={<HeartHandshake className="size-4" />} accent />
      </div>

      <section className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Aktivitas Harian</h2>
            <p className="text-xs text-muted-foreground">Pendaftaran & pengiriman berkas per hari</p>
          </div>
          <div className="flex gap-1 rounded-full bg-secondary p-1">
            {([7, 14, 30] as const).map((d) => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1 text-xs rounded-full transition ${days === d ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}>
                {d}h
              </button>
            ))}
          </div>
        </div>
        <div className="h-72 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12, color: "var(--foreground)" }}
                labelStyle={{ fontWeight: 600 }}
                cursor={{ fill: "var(--secondary)", opacity: 0.5 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              <Bar dataKey="daftar" name="Pendaftaran" fill="var(--emerald)" radius={[6, 6, 0, 0]} maxBarSize={28} />
              <Bar dataKey="berkas" name="Kirim Berkas" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-3">
        <QuickLink to="/admin/peserta/reguler" title="Peserta Reguler" desc="Kelola pendaftar Fully / Partial Funded" />
        <QuickLink to="/admin/peserta/self-funded" title="Peserta Self Funded" desc="Daftar peserta jalur mandiri" />
        <QuickLink to="/admin/pengaturan" title="Pengaturan" desc="Countdown, Twibbon, Panduan, Donasi" />
        <QuickLink to="/admin/wa-setup" title="WhatsApp & AI" desc="Template pesan & integrasi MPWA" />
      </section>
    </AdminShell>
  );
}

function MiniStat({
  label, value, icon, to, accent,
}: { label: string; value: number; icon?: React.ReactNode; to?: string; accent?: boolean }) {
  const inner = (
    <div className={`bg-card border rounded-2xl p-4 transition ${to ? "hover:border-accent/50 hover:shadow-soft" : "border-border"} ${accent ? "border-accent/40" : "border-border"}`}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">{icon}{label}</span>
        {to && <ArrowUpRight className="size-3.5 opacity-50" />}
      </div>
      <div className={`mt-2 font-display text-3xl font-semibold tracking-tight ${accent ? "text-accent" : ""}`}>{value}</div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function QuickLink({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link to={to} className="group bg-card border border-border rounded-2xl p-4 hover:border-accent/50 hover:shadow-soft transition flex items-start justify-between gap-3">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-accent group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition" />
    </Link>
  );
}
