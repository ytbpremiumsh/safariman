import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Clock, CheckCircle2, XCircle, FileCheck, FileX, HeartHandshake, ArrowRight, Settings, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard Admin — Safar Iman" }] }),
  component: AdminOverview,
});

function AdminOverview() {
  const ready = useAdminGuard();
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0, registeredOnly: 0, submitted: 0, paid: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data } = await supabase.from("participants").select("status,cv_url,photo_url,essay_worthy,essay_dream,essay_contribution,payment_status");
      const rows = data ?? [];
      const submitted = (r: any) => !!(r.cv_url || r.photo_url || r.essay_worthy || r.essay_dream || r.essay_contribution);
      setStats({
        total: rows.length,
        pending: rows.filter((r: any) => r.status === "pending").length,
        accepted: rows.filter((r: any) => r.status === "accepted").length,
        rejected: rows.filter((r: any) => r.status === "rejected").length,
        registeredOnly: rows.filter((r: any) => !submitted(r)).length,
        submitted: rows.filter(submitted).length,
        paid: rows.filter((r: any) => r.payment_status === "paid").length,
      });
      setLoading(false);
    })();
  }, [ready]);

  if (!ready || loading) return <AdminLoading />;

  return (
    <AdminShell title="Ringkasan">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat icon={<Users className="size-5" />} label="Total Peserta" value={stats.total} tint="emerald" />
        <Stat icon={<Clock className="size-5" />} label="Menunggu" value={stats.pending} tint="amber" />
        <Stat icon={<CheckCircle2 className="size-5" />} label="Lolos" value={stats.accepted} tint="emerald" />
        <Stat icon={<XCircle className="size-5" />} label="Belum Lolos" value={stats.rejected} tint="red" />
        <Stat icon={<FileX className="size-5" />} label="Hanya Daftar" value={stats.registeredOnly} tint="amber" />
        <Stat icon={<FileCheck className="size-5" />} label="Sudah Kirim Berkas" value={stats.submitted} tint="emerald" />
        <Stat icon={<HeartHandshake className="size-5" />} label="Donasi Valid" value={stats.paid} tint="gold" />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <ShortcutCard to="/admin/peserta" icon={<Users className="size-5" />} title="Kelola Peserta" desc="Lihat seluruh pendaftar, ubah status Lolos / Belum Lolos, kirim WhatsApp." />
        <ShortcutCard to="/admin/pengaturan" icon={<Settings className="size-5" />} title="Pengaturan" desc="Atur countdown landing & integrasi pembayaran Mayar (donasi peserta lolos)." />
        <ShortcutCard to="/admin/wa-setup" icon={<MessageCircle className="size-5" />} title="WA Setup" desc="Konfigurasi API MPWA & template pesan otomatis." />
      </div>
    </AdminShell>
  );
}

function ShortcutCard({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to} className="group bg-card border border-border rounded-2xl p-5 hover:border-accent/50 hover:shadow-soft transition">
      <div className="size-11 rounded-xl bg-emerald/10 text-emerald grid place-items-center mb-3">{icon}</div>
      <div className="font-display text-lg font-semibold flex items-center gap-1.5">{title} <ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition" /></div>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    </Link>
  );
}

function Stat({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: number; tint: "emerald" | "amber" | "red" | "gold" }) {
  const tints = {
    emerald: "bg-emerald/10 text-emerald",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
    gold: "bg-accent/15 text-accent",
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
