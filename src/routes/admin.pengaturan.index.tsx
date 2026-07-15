import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, HeartHandshake, BookOpen, HelpCircle, Image as ImageIcon, Layers, Megaphone, FileText, Mail, MessageCircle, MessageSquareText, ListOrdered, Sparkles, FolderOpen } from "lucide-react";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/pengaturan/")({
  head: () => ({ meta: [{ title: "Pengaturan — Safar Iman Admin" }] }),
  component: PengaturanHub,
});

const ITEMS = [
  {
    to: "/admin/pengaturan/gelombang",
    icon: Layers,
    title: "Gelombang Pendaftaran",
    desc: "Atur nama, tanggal, harga, dan keterangan untuk Reguler, Gelombang 1, dan Gelombang 2.",
  },
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
    to: "/admin/pengaturan/timeline",
    icon: ListOrdered,
    title: "Timeline Program",
    desc: "Edit judul, deskripsi, tanggal/durasi, dan urutan tahap timeline pendaftaran hingga keberangkatan.",
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
  {
    to: "/admin/pengaturan/apresiasi",
    icon: Sparkles,
    title: "Apresiasi Peserta",
    desc: "Tanggal & link Kelas Online, Kajian Sirah, E-Sertifikat, dan Akses Rekaman untuk peserta yang sudah berkontribusi.",
  },
  {
    to: "/admin/pengaturan/hasil-seleksi",
    icon: Megaphone,
    title: "Pengumuman Hasil Seleksi",
    desc: "Aktif/nonaktifkan halaman /cek-hasil, ubah teks lolos / tidak lolos / pending.",
  },
  {
    to: "/admin/pengaturan/dokumen-self-funded",
    icon: FileText,
    title: "Dokumen Self Funded",
    desc: "Custom TTD, stempel, nama & jabatan penandatangan, serta isi teks LOA, Panduan Pembayaran, Konfirmasi Kehadiran, dan Surat Pengantar Proposal.",
  },
  {
    to: "/admin/pengaturan/email",
    icon: Mail,
    title: "Template Email",
    desc: "Custom subjek & isi email otomatis untuk Pendaftaran, Kirim Berkas, Kirim Essay, dan Kontribusi.",
  },
  {
    to: "/admin/pengaturan/wa-channel",
    icon: MessageCircle,
    title: "Link Saluran WhatsApp",
    desc: "URL Saluran WhatsApp yang ditampilkan sebagai ajakan gabung di seluruh halaman sukses pendaftaran.",
  },
  {
    to: "/admin/pengaturan/wa-quick-reply",
    icon: MessageSquareText,
    title: "Balas Cepat WhatsApp",
    desc: "Kumpulan template pesan siap-kirim (keyword + isi) untuk membalas peserta di WhatsApp. Tinggal klik Salin lalu tempel.",
  },
  {
    to: "/admin/pengaturan/media",
    icon: FolderOpen,
    title: "Media Library",
    desc: "Upload gambar, dokumen, atau file lain. Dapatkan URL link yang bisa dipakai di mana saja & tombol download langsung.",
  },
  {
    to: "/admin/pengaturan/faq",
    icon: HelpCircle,
    title: "Halaman FAQ",
    desc: "Aktif/nonaktifkan halaman /faq, tambah/edit pertanyaan & jawaban (pendaftaran, berkas, essay, timeline, benefit, kontribusi).",
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
