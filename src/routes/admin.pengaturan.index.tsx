import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, HeartHandshake, BookOpen, Image as ImageIcon } from "lucide-react";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/pengaturan/")({
  head: () => ({ meta: [{ title: "Pengaturan — Safar Iman Admin" }] }),
  component: PengaturanHub,
});

const ITEMS = [
  {
    to: "/admin/pengaturan/twibbon",
    icon: ImageIcon,
    title: "Frame Twibbon",
    desc: "Upload frame PNG transparan 1080×1080 untuk halaman Twibbon peserta.",
  },
  {
    to: "/admin/pengaturan/countdown",
    icon: Clock,
    title: "Countdown Landing",
    desc: "Atur tanggal & waktu penutupan pendaftaran yang tampil di halaman utama.",
  },
  {
    to: "/admin/pengaturan/panduan",
    icon: BookOpen,
    title: "Link Panduan",
    desc: "URL tujuan tombol 'Panduan' pada hero halaman utama.",
  },
  {
    to: "/admin/pengaturan/donasi",
    icon: HeartHandshake,
    title: "Donasi & Pembayaran Mayar",
    desc: "API Key Mayar, nominal & deskripsi invoice, webhook URL, dan webhook secrets.",
  },
] as const;

function PengaturanHub() {
  const ready = useAdminGuard();
  if (!ready) return <AdminLoading />;

  return (
    <AdminShell title="Pengaturan">
      <p className="text-sm text-muted-foreground -mt-3">
        Pilih kategori pengaturan yang ingin diubah. Setiap kategori berdiri sendiri agar tidak tercampur.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className="group bg-card border border-border rounded-2xl p-5 hover:border-accent/50 hover:shadow-soft transition"
            >
              <div className="size-11 rounded-xl bg-emerald/10 text-emerald grid place-items-center mb-3">
                <Icon className="size-5" />
              </div>
              <div className="font-display text-lg font-semibold flex items-center gap-1.5">
                {it.title}
                <ArrowRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition" />
              </div>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{it.desc}</p>
            </Link>
          );
        })}
      </div>
    </AdminShell>
  );
}
