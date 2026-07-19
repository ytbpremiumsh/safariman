import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Users, UserCheck, FileCheck, HeartHandshake, ArrowUpRight, Wallet, Layers } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";
import { BackupReminderBanner } from "@/components/admin/BackupReminderBanner";


export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard Admin — Safar Iman" }] }),
  component: AdminOverview,
});

type Row = {
  id: string;
  created_at: string;
  updated_at: string;
  category: string | null;
  cv_url: string | null;
  photo_url: string | null;
  essay_worthy: string | null;
  essay_dream: string | null;
  essay_contribution: string | null;
  payment_status: string;
  paid_at: string | null;
  donation_status: string | null;
  donation_paid_at: string | null;
};

const COLS = "id,created_at,updated_at,category,cv_url,photo_url,essay_worthy,essay_dream,essay_contribution,payment_status,paid_at,donation_status,donation_paid_at";

function AdminOverview() {
  const ready = useAdminGuard();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<7 | 14 | 30>(14);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const pageSize = 1000;
      let from = 0;
      const all: Row[] = [];
      // Paginate to bypass PostgREST default 1000-row cap
      // and load semua peserta tanpa batasan.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { data, error } = await supabase
          .from("participants")
          .select(COLS)
          .order("created_at", { ascending: false })
          .range(from, from + pageSize - 1);
        if (error) break;
        const batch = (data ?? []) as Row[];
        all.push(...batch);
        if (batch.length < pageSize) break;
        from += pageSize;
      }
      setRows(all);
      setLoading(false);
    })();

    const channel = supabase
      .channel("admin-participants")
      .on("postgres_changes", { event: "*", schema: "public", table: "participants" }, (payload) => {
        setRows((prev) => {
          if (payload.eventType === "INSERT") {
            const n = payload.new as Row;
            if (prev.some((r) => r.id === n.id)) return prev;
            return [n, ...prev];
          }
          if (payload.eventType === "UPDATE") {
            const n = payload.new as Row;
            return prev.map((r) => (r.id === n.id ? { ...r, ...n } : r));
          }
          if (payload.eventType === "DELETE") {
            const o = payload.old as Partial<Row>;
            return prev.filter((r) => r.id !== o.id);
          }
          return prev;
        });
      })
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => { supabase.removeChannel(channel); };
  }, [ready]);

  const submitted = (r: Row) =>
    !!(r.cv_url || r.photo_url || r.essay_worthy || r.essay_dream || r.essay_contribution);

  const isGelombang = (r: Row) => r.category === "gelombang_1" || r.category === "gelombang_2";
  const isReguler = (r: Row) =>
    r.category === null || r.category === "fully_funded" || r.category === "partial_funded";

  const stats = useMemo(() => {
    const reguler = rows.filter(isReguler);
    const self = rows.filter((r) => r.category === "self_funded");
    const g1 = rows.filter((r) => r.category === "gelombang_1");
    const g2 = rows.filter((r) => r.category === "gelombang_2");
    return {
      total: rows.length,
      reguler: reguler.length,
      self: self.length,
      g1: g1.length,
      g2: g2.length,
      g1Paid: g1.filter((r) => r.payment_status === "paid").length,
      g2Paid: g2.filter((r) => r.payment_status === "paid").length,
      submitted: rows.filter(submitted).length,
      donasi: rows.filter((r) => r.donation_status === "paid").length,
      pendaftaranPaid: rows.filter((r) => isGelombang(r) && r.payment_status === "paid").length,
    };
  }, [rows]);

  const todayStats = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(start.getDate() + 1);
    const inToday = (iso?: string | null) => {
      if (!iso) return false;
      const t = new Date(iso).getTime();
      return t >= start.getTime() && t < end.getTime();
    };
    return {
      daftar: rows.filter((r) => inToday(r.created_at)).length,
      berkas: rows.filter((r) => submitted(r) && inToday(r.updated_at)).length,
      donasi: rows.filter((r) => r.donation_status === "paid" && inToday(r.donation_paid_at)).length,
      pendaftaranPaid: rows.filter((r) => isGelombang(r) && r.payment_status === "paid" && inToday(r.paid_at)).length,
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
      <BackupReminderBanner />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MiniStat label="Total Peserta" value={stats.total} />
        <MiniStat label="Reguler" value={stats.reguler} to="/admin/peserta/reguler" icon={<Users className="size-4" />} />
        <MiniStat label="Self Funded" value={stats.self} to="/admin/peserta/self-funded" icon={<UserCheck className="size-4" />} />
        <MiniStat label="Gelombang 1" value={stats.g1} sub={`${stats.g1Paid} bayar`} icon={<Layers className="size-4" />} />
        <MiniStat label="Gelombang 2" value={stats.g2} sub={`${stats.g2Paid} bayar`} icon={<Layers className="size-4" />} />
        <MiniStat label="Donasi Valid" value={stats.donasi} icon={<HeartHandshake className="size-4" />} accent />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SummaryCard
          title="Biaya Pendaftaran (Gelombang)"
          desc="Total peserta Gelombang 1 & 2 yang telah membayar biaya pendaftaran."
          value={stats.pendaftaranPaid}
          icon={<Wallet className="size-5" />}
          tone="accent"
        />
        <SummaryCard
          title="Donasi Peserta Reguler"
          desc="Donasi yang masuk dari peserta jalur Fully / Partial Funded."
          value={stats.donasi}
          icon={<HeartHandshake className="size-5" />}
          tone="emerald"
        />
      </div>

      <section className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              Aktivitas Hari Ini
              <span className="inline-flex items-center gap-1.5 text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald/10 text-emerald">
                <span className="relative inline-flex size-1.5">
                  {live && <span className="absolute inline-flex h-full w-full rounded-full bg-emerald animate-ping opacity-75" />}
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald" />
                </span>
                {live ? "Live" : "Menghubungkan…"}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <TodayCard label="Pendaftaran" value={todayStats.daftar} icon={<Users className="size-4" />} tone="emerald" />
          <TodayCard label="Kirim Berkas" value={todayStats.berkas} icon={<FileCheck className="size-4" />} tone="accent" />
          <TodayCard label="Bayar Pendaftaran" value={todayStats.pendaftaranPaid} icon={<Wallet className="size-4" />} tone="accent" />
          <TodayCard label="Donasi Valid" value={todayStats.donasi} icon={<HeartHandshake className="size-4" />} tone="rose" />
        </div>
      </section>


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
  label, value, icon, to, accent, sub,
}: { label: string; value: number; icon?: React.ReactNode; to?: string; accent?: boolean; sub?: string }) {
  const inner = (
    <div className={`bg-card border rounded-2xl p-4 transition ${to ? "hover:border-accent/50 hover:shadow-soft" : "border-border"} ${accent ? "border-accent/40" : "border-border"}`}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">{icon}{label}</span>
        {to && <ArrowUpRight className="size-3.5 opacity-50" />}
      </div>
      <div className={`mt-2 font-display text-3xl font-semibold tracking-tight ${accent ? "text-accent" : ""}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function SummaryCard({
  title, desc, value, icon, tone,
}: { title: string; desc: string; value: number; icon: React.ReactNode; tone: "emerald" | "accent" }) {
  const toneMap = {
    emerald: "bg-emerald/10 text-emerald border-emerald/30",
    accent: "bg-accent/15 text-accent border-accent/40",
  } as const;
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex items-start gap-4">
      <div className={`size-12 rounded-xl grid place-items-center border ${toneMap[tone]}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-base font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <div className="font-display text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
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

function TodayCard({
  label, value, icon, tone,
}: { label: string; value: number; icon: React.ReactNode; tone: "emerald" | "accent" | "rose" }) {
  const toneMap = {
    emerald: "bg-emerald/10 text-emerald",
    accent: "bg-accent/10 text-accent",
    rose: "bg-rose-500/10 text-rose-600",
  } as const;
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4 flex items-center gap-3">
      <div className={`size-10 rounded-xl grid place-items-center ${toneMap[tone]}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-display text-2xl font-semibold tracking-tight leading-tight">{value}</div>
      </div>
    </div>
  );
}
