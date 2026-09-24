import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Award,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  FileCheck2,
  HandCoins,
  KeyRound,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { ApresiasiPeserta } from "@/components/ApresiasiPeserta";
import logoSafarIman from "@/assets/logo-safar-iman.png";

export const Route = createFileRoute("/cek-pengumuman")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, follow" },
      { title: "Cek Pengumuman — Safar Iman" },
      {
        name: "description",
        content: "Cek pengumuman hasil Essay, Studi Kasus, dan Tes Kesiapan Awal Safar Iman.",
      },
    ],
  }),
  component: CekPengumumanPage,
});

type StageStatus = "pending" | "passed" | "failed";
type LookupRow = {
  found: boolean;
  full_name: string;
  category: string | null;
  status: string;
  has_berkas: boolean;
  has_essay: boolean;
  donation_status: string;
  payment_status: string;
  essay_status: StageStatus;
  tka_status: StageStatus;
  interview_status: StageStatus;
  berkas_published?: boolean;
  essay_published?: boolean;
};

function CekPengumumanPage() {
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [data, setData] = useState<LookupRow | null>(null);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode) return;
    setSearching(true);
    setData(null);
    setError("");
    const result = await supabase.rpc("lookup_tahapan_by_code", { p_code: cleanCode });
    setSearching(false);
    if (result.error) {
      setError("Pengumuman belum dapat dimuat. Silakan coba kembali.");
      return;
    }
    const participant = (result.data ?? [])[0] as LookupRow | undefined;
    if (!participant) {
      setError(`Kode ${cleanCode.toUpperCase()} tidak ditemukan.`);
      return;
    }
    setData(participant);
  };

  return (
    <div className="min-h-screen bg-[#f6f1e7] text-[#0d392e]">
      <header className="border-b border-[#dfd4bd] bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-17 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-4 min-w-0">
            <img src={logoSafarIman} alt="Safar Iman" className="h-10 w-auto object-contain" />
            <span className="hidden sm:block border-l border-[#dfd4bd] pl-4 text-xs text-[#61756e]">
              Portal Hasil Seleksi
            </span>
          </Link>
          <Link
            to="/cek-tahapan"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfd4bd] bg-white px-3 py-2 text-xs font-semibold hover:bg-[#f7f3ea]"
          >
            <ArrowLeft className="size-3.5" /> Cek Tahapan
          </Link>
        </div>
      </header>

      <section className="bg-[#0d4739] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-11 sm:py-14">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs">
            <ShieldCheck className="size-3.5" /> Pengumuman terverifikasi
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mt-4">
            Cek Pengumuman Peserta
          </h1>
          <p className="text-sm text-white/75 mt-2 max-w-xl leading-relaxed">
            Masukkan kode pendaftaran untuk melihat hasil Essay &amp; Studi Kasus serta Tes Kesiapan
            Awal.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-14 -mt-5 relative z-10">
        <form
          onSubmit={submit}
          className="rounded-2xl border border-[#dfd4bd] bg-white p-4 sm:p-5 shadow-lg shadow-black/5"
        >
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#61756e]">
            Kode Pendaftaran
          </label>
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <div className="relative flex-1">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#61756e]" />
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Contoh: HXP-AB12CD34"
                className="pl-10 font-mono h-11"
                autoFocus
              />
            </div>
            <button
              disabled={searching || !code.trim()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#dcae4d] px-5 text-sm font-bold text-[#103c31] disabled:opacity-60"
            >
              {searching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}{" "}
              Lihat Pengumuman
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        {data && <AnnouncementResult row={data} code={code.trim().toUpperCase()} />}
      </main>
    </div>
  );
}

function AnnouncementResult({ row, code }: { row: LookupRow; code: string }) {
  const contributed = row.donation_status === "paid";
  const resultsPublished = row.essay_published !== false;
  const essayResult: StageStatus = !resultsPublished ? "pending" : row.essay_status;
  const tkaResult: StageStatus = essayResult !== "passed" ? "pending" : row.tka_status;

  return (
    <div className="mt-5 space-y-5">
      <div className="rounded-2xl border-t-[6px] border-[#dcae4d] bg-white p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#75847f]">
              Informasi Peserta
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold mt-1">{row.full_name}</h2>
            <p className="text-sm text-[#61756e] mt-1">
              Berikut hasil tahapan seleksi yang sudah dipublikasikan.
            </p>
          </div>
          <div className="rounded-xl border border-[#dfd4bd] bg-[#f8f5ef] px-4 py-3 sm:min-w-48">
            <div className="text-[9px] uppercase tracking-[0.2em] text-[#75847f]">Kode Token</div>
            <div className="font-mono font-bold mt-1">{code}</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <ResultCard type="essay" state={essayResult} published={resultsPublished} />
        <ResultCard
          type="tka"
          state={tkaResult}
          published={resultsPublished && essayResult === "passed"}
        />
      </div>

      {contributed && essayResult === "failed" && (
        <div className="rounded-2xl border border-[#ddc48b] bg-white p-5 sm:p-7">
          <div className="flex gap-4">
            <div className="size-12 rounded-full bg-[#0d4739] text-[#e8c66e] grid place-items-center shrink-0">
              <Award className="size-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#9a741f]">
                Tetap Semangat
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold mt-1">
                Perjalananmu Tidak Berhenti di Sini
              </h3>
              <p className="text-sm text-[#61756e] leading-relaxed mt-2">
                Tidak ada proses yang sia-sia. Walaupun belum lolos ke tahap berikutnya, Anda tetap
                mendapatkan kelas online, kajian, akses rekaman, dan E-Sertifikat sebagai bentuk
                apresiasi atas usaha yang telah diberikan.
              </p>
            </div>
          </div>
        </div>
      )}

      {contributed && (
        <div className="rounded-2xl border border-[#ddc48b] bg-white p-4 sm:p-6 shadow-sm">
          <ApresiasiPeserta announcement />
        </div>
      )}

      {!contributed && (
        <div className="rounded-xl border border-[#dfd4bd] bg-white p-4 text-sm text-[#61756e]">
          Informasi apresiasi dan benefit tersedia untuk peserta dengan kontribusi yang sudah
          tervalidasi.
        </div>
      )}
    </div>
  );
}

function ResultCard({
  type,
  state,
  published,
}: {
  type: "essay" | "tka";
  state: StageStatus;
  published: boolean;
}) {
  const isEssay = type === "essay";
  const Icon = isEssay ? BookOpenCheck : FileCheck2;
  const title = isEssay ? "Essay & Studi Kasus" : "Tes Kesiapan Awal (TPA)";
  const config =
    !published || state === "pending"
      ? {
          label: "Coming Soon",
          heading: "Pengumuman belum tersedia",
          desc: isEssay
            ? "Hasil penilaian sedang dipersiapkan oleh tim seleksi."
            : "Hasil TPA akan muncul setelah tahapan ini selesai dinilai.",
          cls: "border-amber-300 bg-amber-50",
          icon: <Clock className="size-7" />,
          iconCls: "bg-amber-500 text-white",
        }
      : state === "passed"
        ? {
            label: "Lolos",
            heading: isEssay ? "Lolos Essay & Studi Kasus" : "Lolos Tes Kesiapan Awal (TPA)",
            desc: isEssay
              ? "Selamat, Anda berhak melanjutkan ke Tes Kesiapan Awal."
              : "Selamat, Anda berhasil melewati Tes Kesiapan Awal dan dapat melanjutkan ke tahap berikutnya.",
            cls: "border-emerald-400 bg-emerald-50",
            icon: <CheckCircle2 className="size-7" />,
            iconCls: "bg-[#0d4739] text-white",
          }
        : {
            label: "Belum Lolos",
            heading: isEssay
              ? "Belum Lolos Essay & Studi Kasus"
              : "Belum Lolos Tes Kesiapan Awal (TPA)",
            desc: "Terima kasih telah memberikan usaha terbaik. Tetap semangat dan terus bertumbuh untuk kesempatan berikutnya.",
            cls: "border-red-300 bg-red-50",
            icon: <XCircle className="size-7" />,
            iconCls: "bg-red-500 text-white",
          };

  return (
    <section
      className={`min-h-72 rounded-2xl border-2 p-6 sm:p-8 flex flex-col justify-between ${config.cls}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className={`size-14 rounded-2xl grid place-items-center ${config.iconCls}`}>
          {config.icon}
        </div>
        <span className="rounded-full bg-white/80 border border-current/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">
          {config.label}
        </span>
      </div>
      <div className="mt-8">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold opacity-70">
          <Icon className="size-4" /> {title}
        </div>
        <h3 className="font-display text-2xl sm:text-3xl font-bold mt-2">{config.heading}</h3>
        <p className="text-sm leading-relaxed opacity-75 mt-3">{config.desc}</p>
      </div>
    </section>
  );
}
