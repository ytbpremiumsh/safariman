import { createFileRoute } from "@tanstack/react-router";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";
import {
  UserPlus,
  Image as ImageIcon,
  FileText,
  PencilLine,
  CheckCircle2,
  ClipboardCheck,
  Users,
  Megaphone,
  Trophy,
  Plane,
  ArrowRight,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/admin/alur/fully-funded")({
  head: () => ({ meta: [{ title: "Alur Fully Funded — Safar Iman Admin" }] }),
  component: AlurFullyFunded,
});

type Step = {
  no: number;
  title: string;
  icon: any;
  actor: "Peserta" | "Admin" | "Sistem";
  desc: string;
  details: string[];
  route?: string;
  duration?: string;
};

const STEPS: Step[] = [
  {
    no: 1,
    title: "Pendaftaran Online",
    icon: UserPlus,
    actor: "Peserta",
    desc: "Calon peserta mengisi formulir pendaftaran jalur Reguler (Fully Funded) secara gratis.",
    details: [
      "Mengakses halaman /daftar dari landing page.",
      "Mengisi data diri lengkap: nama, email, WhatsApp, gender, TTL, kota, pendidikan, pekerjaan, Instagram.",
      "Menyetujui syarat & ketentuan program.",
      "Sistem menerbitkan Kode Pendaftaran unik (format HXP-XXXXXXXX).",
      "Status awal peserta: pending.",
    ],
    route: "/daftar",
    duration: "± 5 menit",
  },
  {
    no: 2,
    title: "Bagikan Twibbon & Poster",
    icon: ImageIcon,
    actor: "Peserta",
    desc: "Peserta wajib mendownload frame twibbon dan membagikannya di media sosial.",
    details: [
      "Download frame twibbon resmi Safar Iman.",
      "Pasang foto pribadi pada frame.",
      "Upload ke Instagram & tag akun resmi Safar Iman.",
      "Follow akun sosial media Safar Iman.",
    ],
    route: "/twibbon",
    duration: "± 10 menit",
  },
  {
    no: 3,
    title: "Kirim Berkas",
    icon: FileText,
    actor: "Peserta",
    desc: "Upload CV dan pas foto formal sebagai berkas administrasi.",
    details: [
      "Login menggunakan Kode Pendaftaran di halaman /berkas.",
      "Upload CV (PDF, maks. 2MB).",
      "Upload pas foto formal (JPG/PNG).",
      "Sistem menyimpan ke bucket participant-cv & participant-photo.",
    ],
    route: "/berkas",
    duration: "± 5 menit",
  },
  {
    no: 4,
    title: "Pengerjaan Essay",
    icon: PencilLine,
    actor: "Peserta",
    desc: "Peserta mengisi 3 essay wajib sebagai bahan pertimbangan seleksi.",
    details: [
      "Akses halaman /essay menggunakan Kode Pendaftaran.",
      "Essay 1: Mengapa kamu layak terpilih?",
      "Essay 2: Apa mimpi & target setelah umrah?",
      "Essay 3: Kontribusi apa yang akan kamu berikan?",
      "Submit essay — sistem otomatis mengubah status ke 'interview' (jika auto-lolos aktif).",
    ],
    route: "/essay",
    duration: "± 30-60 menit",
  },
  {
    no: 5,
    title: "Verifikasi Berkas & Essay",
    icon: ClipboardCheck,
    actor: "Admin",
    desc: "Admin memeriksa kelengkapan berkas dan kualitas essay peserta.",
    details: [
      "Buka halaman /admin/peserta/essay untuk melihat seluruh essay.",
      "Review CV & pas foto via /admin/peserta/reguler.",
      "Tandai peserta yang lolos seleksi berkas → status 'interview'.",
      "Tandai peserta yang gugur → status 'rejected'.",
    ],
    route: "/admin/peserta/essay",
    duration: "1-3 hari",
  },
  {
    no: 6,
    title: "Pengumuman Lolos Essay",
    icon: Megaphone,
    actor: "Sistem",
    desc: "Hasil seleksi essay diumumkan melalui halaman cek hasil.",
    details: [
      "Peserta cek hasil di halaman /cek-hasil menggunakan Kode Pendaftaran.",
      "Notifikasi WhatsApp otomatis dikirim ke peserta lolos.",
      "Yang lolos berhak lanjut ke TKA (Tes Kesiapan Awal).",
      "Teks pengumuman dapat dikustomisasi di /admin/pengaturan/hasil-seleksi.",
    ],
    route: "/cek-hasil",
    duration: "1 hari",
  },
  {
    no: 7,
    title: "TKA (Tes Kesiapan Awal)",
    icon: ClipboardCheck,
    actor: "Peserta",
    desc: "Peserta mengikuti TKA berbasis CBT untuk mengukur kesiapan mental & pengetahuan dasar.",
    details: [
      "Akses CBT melalui link & token yang dikirim via WhatsApp.",
      "Tes berbasis waktu dengan soal pilihan ganda.",
      "Materi: keislaman dasar, motivasi, wawasan umrah.",
      "Hasil otomatis tercatat di sistem CBT.",
    ],
    duration: "± 60-90 menit",
  },
  {
    no: 8,
    title: "Wawancara Final",
    icon: Users,
    actor: "Admin",
    desc: "Wawancara 1-on-1 dengan tim seleksi sebagai tahap final penilaian.",
    details: [
      "Jadwal dikirim via WhatsApp ke peserta lolos TKA.",
      "Wawancara: motivasi, komitmen, kesiapan finansial pendukung, niat ibadah.",
      "Penilaian akhir berdasarkan akumulasi seluruh tahap.",
    ],
    duration: "± 30-45 menit",
  },
  {
    no: 9,
    title: "Pengumuman Final & Penerimaan",
    icon: Trophy,
    actor: "Sistem",
    desc: "Pengumuman peserta yang resmi diterima sebagai penerima manfaat Umrah Gratis Safar Iman.",
    details: [
      "Status peserta diubah menjadi 'accepted' oleh admin.",
      "Notifikasi WhatsApp + email otomatis ke peserta diterima.",
      "Peserta menerima Letter of Acceptance (LOA) resmi.",
      "Briefing pra-keberangkatan dijadwalkan.",
    ],
    route: "/admin/peserta/reguler",
    duration: "1 hari",
  },
  {
    no: 10,
    title: "Keberangkatan Umrah",
    icon: Plane,
    actor: "Peserta",
    desc: "Peserta terpilih berangkat menunaikan ibadah umrah bersama Safar Iman.",
    details: [
      "Mengikuti manasik & briefing akhir.",
      "Berkumpul di titik keberangkatan sesuai jadwal.",
      "Menunaikan ibadah umrah dengan pendampingan muthawif.",
      "Pelaporan & dokumentasi pasca-umrah.",
    ],
    duration: "± 9-12 hari",
  },
];

const ACTOR_STYLE: Record<Step["actor"], string> = {
  Peserta: "bg-emerald/10 text-emerald border-emerald/30",
  Admin: "bg-accent/10 text-accent border-accent/30",
  Sistem: "bg-muted text-muted-foreground border-border",
};

function AlurFullyFunded() {
  const ready = useAdminGuard();
  if (!ready) return <AdminLoading />;

  return (
    <AdminShell title="Alur Lengkap Pendaftaran Fully Funded">
      <div className="mb-6 rounded-2xl border border-accent/30 bg-accent/5 p-5">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl bg-gradient-gold text-emerald-deep grid place-items-center shrink-0">
            <Trophy className="size-5" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold">Jalur Reguler — Fully Funded (Gratis)</div>
            <p className="text-sm text-muted-foreground mt-1">
              Dokumentasi lengkap 11 tahap perjalanan peserta dari registrasi awal hingga keberangkatan umrah.
              Halaman ini menjadi referensi internal tim untuk memantau & menjelaskan alur program kepada calon peserta.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8 text-xs">
        <LegendChip color="bg-emerald" label="Peserta" />
        <LegendChip color="bg-accent" label="Admin" />
        <LegendChip color="bg-muted-foreground" label="Sistem Otomatis" />
      </div>

      <div className="relative">
        <div className="absolute left-[27px] top-2 bottom-2 w-px bg-gradient-to-b from-emerald/40 via-border to-accent/40" />
        <div className="space-y-4">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.no} className="relative pl-16">
                <div className="absolute left-0 top-2 size-[56px] rounded-2xl bg-card border-2 border-emerald/40 grid place-items-center shadow-soft">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-emerald uppercase tracking-wider">Step</span>
                    <span className="font-display text-lg font-bold leading-none">{s.no}</span>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-5 hover:border-accent/40 transition">
                  <div className="flex items-start gap-3 mb-3 flex-wrap">
                    <div className="size-10 rounded-xl bg-emerald/10 text-emerald grid place-items-center shrink-0">
                      <Icon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${ACTOR_STYLE[s.actor]}`}>
                          {s.actor}
                        </span>
                        {s.duration && (
                          <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                            <Clock className="size-3" />
                            {s.duration}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-sm pl-1">
                    {s.details.map((d, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-emerald shrink-0 mt-0.5" />
                        <span className="text-foreground/80">{d}</span>
                      </li>
                    ))}
                  </ul>
                  {s.route && (
                    <a
                      href={s.route}
                      target={s.route.startsWith("/admin") ? "_self" : "_blank"}
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline mt-3 font-medium"
                    >
                      Buka halaman: <code className="font-mono">{s.route}</code>
                      <ArrowRight className="size-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
          <ClipboardCheck className="size-5 text-emerald" />
          Ringkasan Status Peserta
        </h3>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <StatusRow label="pending" desc="Baru daftar, belum lengkapi berkas/essay." />
          <StatusRow label="interview" desc="Lolos berkas + essay, lanjut tahap TKA & LDS." />
          <StatusRow label="rejected" desc="Tidak lolos seleksi pada tahap tertentu." />
          <StatusRow label="accepted" desc="Diterima — penerima manfaat resmi umrah gratis." />
        </div>
      </div>
    </AdminShell>
  );
}

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
      <span className={`size-2.5 rounded-full ${color}`} />
      <span className="text-foreground/80">{label}</span>
    </div>
  );
}

function StatusRow({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
      <code className="text-xs font-mono bg-background border border-border px-2 py-1 rounded shrink-0">{label}</code>
      <span className="text-muted-foreground">{desc}</span>
    </div>
  );
}
