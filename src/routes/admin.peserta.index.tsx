import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, UserCheck, ArrowRight } from "lucide-react";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/peserta/")({
  head: () => ({ meta: [{ title: "Peserta — Safar Iman Admin" }] }),
  component: PesertaHub,
});

function PesertaHub() {
  const ready = useAdminGuard();
  if (!ready) return <AdminLoading />;
  return (
    <AdminShell title="Peserta">
      <p className="text-sm text-muted-foreground -mt-3">Pilih kategori peserta yang ingin dikelola.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Card to="/admin/peserta/reguler" icon={<Users className="size-5" />} title="Peserta Reguler"
          desc="Jalur Fully / Partial Funded — termasuk berkas, essay, seleksi, dan donasi." />
        <Card to="/admin/peserta/self-funded" icon={<UserCheck className="size-5" />} title="Peserta Self Funded"
          desc="Jalur mandiri — hanya data pendaftar, tanpa berkas/essay/donasi." />
      </div>
    </AdminShell>
  );
}

function Card({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to} className="group bg-card border border-border rounded-2xl p-5 hover:border-accent/50 hover:shadow-soft transition">
      <div className="size-11 rounded-xl bg-emerald/10 text-emerald grid place-items-center mb-3">{icon}</div>
      <div className="font-display text-lg font-semibold flex items-center gap-1.5">
        {title} <ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition" />
      </div>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    </Link>
  );
}
