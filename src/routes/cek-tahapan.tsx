import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search, Loader2, ArrowLeft, CheckCircle2, XCircle, Clock, Sparkles,
  FileCheck2, BookOpenCheck, Brain, MessagesSquare, Heart, HandCoins, ChevronDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { ApresiasiPeserta } from "@/components/ApresiasiPeserta";

export const Route = createFileRoute("/cek-tahapan")({
  head: () => ({
    meta: [
      { title: "Cek Tahapan Seleksi — Safar Iman" },
      { name: "description", content: "Lacak tahapan seleksi Safar Iman kamu — Berkas, Essay & Studi Kasus, TKA, dan Interview — dengan kode pendaftaran." },
    ],
  }),
  component: CekTahapanPage,
});

type Category = "fully_funded" | "partial_funded" | "self_funded" | "gelombang_1" | "gelombang_2";
type ParticipantStatus = "pending" | "reviewed" | "interview" | "accepted" | "rejected";
type StageStatus = "pending" | "passed" | "failed";

type LookupRow = {
  found: boolean;
  full_name: string;
  category: Category | null;
  status: ParticipantStatus;
  has_berkas: boolean;
  has_essay: boolean;
  donation_status: string;
  payment_status: string;
  tka_status: StageStatus;
  interview_status: StageStatus;
};

type StageState = "passed" | "failed" | "pending" | "locked" | "skipped";

type Stage = {
  key: string;
  title: string;
  icon: typeof FileCheck2;
  state: StageState;
  note?: string;
};

const ENCOURAGE =
  "Tetap semangat, jangan menyerah! Setiap langkah yang kamu ambil sudah luar biasa. Pintu kebaikan masih terbuka — pantau program kami selanjutnya dan ikuti gelombang berikutnya. Doa kami menyertaimu. 🌙";

function CekTahapanPage() {
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [data, setData] = useState<LookupRow | null>(null);
  const [notFound, setNotFound] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim();
    if (!c) return;
    setSearching(true);
    setData(null);
    setNotFound(false);
    const { data: rows, error } = await supabase.rpc("lookup_tahapan_by_code", { p_code: c });
    setSearching(false);
    if (error) { setNotFound(true); return; }
    const row = (rows ?? [])[0] as LookupRow | undefined;
    if (!row) setNotFound(true);
    else setData(row);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/40 via-background to-emerald/5">
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="size-4" /> Beranda
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="size-3" /> Pelacak Tahapan Seleksi
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">Cek Tahapan Seleksi</h1>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            Pantau perjalanan seleksi kamu di Safar Iman — mulai dari berkas, essay & studi kasus, TKA, sampai interview.
          </p>
        </div>

        <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
          <label className="block text-sm font-medium mb-2">Kode Pendaftaran</label>
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Contoh: HXP-AB12CD34"
              className="font-mono"
              required
              autoFocus
            />
            <button
              type="submit"
              disabled={searching || !code.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-gradient-emerald text-accent px-4 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60"
            >
              {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Cek
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Gunakan kode pendaftaran yang dikirim setelah kamu mendaftar.
          </p>
        </form>

        {notFound && (
          <div className="mt-5 bg-card border border-red-200 dark:border-red-900/50 rounded-2xl p-5 text-center">
            <p className="text-sm text-red-600">
              Kode <span className="font-mono font-semibold">{code}</span> tidak ditemukan.
            </p>
          </div>
        )}

        {data && <TahapanResult row={data} />}
      </div>
    </div>
  );
}

function buildStages(row: LookupRow): Stage[] {
  const cat = row.category;
  const isFastTrack = cat === "gelombang_1" || cat === "gelombang_2";
  const isSelfFunded = cat === "self_funded";

  const rejected = row.status === "rejected";

  // Stage 1: Berkas
  let berkas: StageState;
  let berkasNote: string | undefined;
  if (isFastTrack) {
    berkas = "passed";
    berkasNote = "Auto Lolos — Fast Track Gelombang";
  } else if (isSelfFunded) {
    berkas = "passed";
    berkasNote = "Self Funded — tidak melalui seleksi berkas";
  } else if (row.has_berkas) {
    berkas = rejected && !row.has_essay ? "failed" : "passed";
  } else {
    berkas = rejected ? "failed" : "pending";
    berkasNote = "Lengkapi pengiriman berkas (CV & foto)";
  }

  // Stage 2: Kontribusi
  let kontribusi: StageState;
  let kontribusiNote: string | undefined;
  if (isFastTrack || isSelfFunded) {
    kontribusi = "skipped";
    kontribusiNote = "Tidak ada tahap kontribusi untuk kategori ini";
  } else if (berkas !== "passed") {
    kontribusi = "locked";
  } else if (row.donation_status === "paid") {
    kontribusi = "passed";
    kontribusiNote = "Kontribusi sudah diterima — Jazakallahu khairan 🌙";
  } else if (rejected) {
    kontribusi = "failed";
  } else {
    kontribusi = "pending";
    kontribusiNote = "Selesaikan pembayaran kontribusi untuk lanjut ke tahap essay";
  }

  // Stage 3: Essay & Studi Kasus
  let essay: StageState;
  let essayNote: string | undefined;
  if (isFastTrack || isSelfFunded) {
    essay = "skipped";
    essayNote = "Tidak ada tahap essay untuk kategori ini";
  } else if (kontribusi !== "passed") {
    essay = "locked";
  } else if (!row.has_essay) {
    essay = rejected ? "failed" : "pending";
    essayNote = "Kirim essay & studi kasus untuk lanjut";
  } else if (row.status === "rejected") {
    essay = "failed";
  } else if (row.status === "interview" || row.status === "accepted" || row.tka_status !== "pending") {
    essay = "passed";
  } else {
    essay = "pending";
    essayNote = "Essay sedang dinilai tim penilai";
  }

  // Stage 3: TKA
  let tka: StageState;
  let tkaNote: string | undefined;
  if (isFastTrack || isSelfFunded) {
    tka = "skipped";
    tkaNote = "Tidak ada tahap TKA untuk kategori ini";
  } else if (essay !== "passed") {
    tka = "locked";
  } else if (row.tka_status === "passed") {
    tka = "passed";
  } else if (row.tka_status === "failed") {
    tka = "failed";
  } else {
    tka = "pending";
    tkaNote = "Menunggu pelaksanaan & penilaian TKA";
  }

  // Stage 4: Interview
  let interview: StageState;
  let interviewNote: string | undefined;
  if (isFastTrack || isSelfFunded) {
    interview = "skipped";
    interviewNote = "Tidak ada tahap interview untuk kategori ini";
  } else if (tka !== "passed") {
    interview = "locked";
  } else if (row.interview_status === "passed" || row.status === "accepted") {
    interview = "passed";
  } else if (row.interview_status === "failed") {
    interview = "failed";
  } else {
    interview = "pending";
    interviewNote = "Menunggu jadwal & hasil interview";
  }

  return [
    { key: "berkas", title: "Seleksi Berkas", icon: FileCheck2, state: berkas, note: berkasNote },
    { key: "kontribusi", title: "Kontribusi", icon: HandCoins, state: kontribusi, note: kontribusiNote },
    { key: "essay", title: "Seleksi Essay & Studi Kasus", icon: BookOpenCheck, state: essay, note: essayNote },
    { key: "tka", title: "Seleksi TKA (Tes Kemampuan Akademik)", icon: Brain, state: tka, note: tkaNote },
    { key: "interview", title: "Seleksi Interview", icon: MessagesSquare, state: interview, note: interviewNote },
  ];
}

function TahapanResult({ row }: { row: LookupRow }) {
  const stages = buildStages(row);
  const activeStages = stages.filter((s) => s.state !== "skipped");
  const passedCount = activeStages.filter((s) => s.state === "passed").length;
  const totalActive = activeStages.length;
  const percent = Math.round((passedCount / totalActive) * 100);

  const failedStage = stages.find((s) => s.state === "failed");
  const interviewStage = stages.find((s) => s.key === "interview");
  const allPassed = interviewStage?.state === "passed" && activeStages.every((s) => s.state === "passed");

  return (
    <div className="mt-5 space-y-5">
      {/* Header card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
        <div className="bg-gradient-to-br from-emerald to-emerald-deep text-white p-6">
          <div className="text-xs uppercase tracking-[0.25em] text-white/80">Peserta</div>
          <div className="font-display text-2xl sm:text-3xl font-bold mt-1">{row.full_name}</div>
          {row.category && (
            <div className="inline-flex mt-2 text-[10px] font-semibold uppercase tracking-wider bg-white/15 px-2 py-1 rounded">
              {labelKategori(row.category)}
            </div>
          )}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/80 mb-1.5">
              <span>Progress Tahapan</span>
              <span>{passedCount}/{totalActive} tahap</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-gold transition-all" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Stages timeline */}
      <ol className="relative space-y-3">
        {stages.map((s, i) => (
          <li key={s.key}>
            <StageItem stage={s} index={i + 1} />
            {s.key === "kontribusi" && s.state === "passed" && (
              <ApresiasiCollapsible />
            )}
          </li>
        ))}
      </ol>

      {/* Final message */}
      {failedStage ? (
        <EncourageCard failedTitle={failedStage.title} />
      ) : allPassed ? (
        <div className="bg-gradient-to-br from-emerald to-emerald-deep text-white rounded-2xl p-6 text-center shadow-emerald">
          <CheckCircle2 className="size-10 mx-auto mb-3" />
          <h3 className="font-display text-xl font-bold">Alhamdulillah, kamu lolos seluruh tahapan!</h3>
          <p className="text-sm text-white/90 mt-2">
            Selamat! Tim kami akan menghubungi kamu untuk langkah selanjutnya. Barakallahu fiik 🌙
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ApresiasiCollapsible() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 rounded-2xl border border-emerald/20 bg-gradient-to-br from-emerald/5 to-accent/5 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-emerald/5 transition"
      >
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-emerald font-bold bg-emerald/10 px-2.5 py-1 rounded-full">
            <Sparkles className="size-3" /> Apresiasi untukmu
          </span>
          <span className="text-xs text-muted-foreground">{open ? "Sembunyikan" : "Lihat detail"}</span>
        </span>
        <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 border-t border-emerald/10 pt-4">
          <ApresiasiPeserta compact />
        </div>
      )}
    </div>
  );
}

function StageItem({ stage, index }: { stage: Stage; index: number }) {
  const Icon = stage.icon;
  const cfg = STATE_STYLES[stage.state];
  return (
    <div
      className={`bg-card border rounded-2xl p-4 flex items-start gap-4 ${cfg.border} ${
        stage.state === "locked" || stage.state === "skipped" ? "opacity-60" : ""
      }`}
    >
      <div className={`shrink-0 size-12 rounded-xl grid place-items-center ${cfg.iconBg}`}>
        <Icon className={`size-6 ${cfg.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Tahap {index}</span>
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${cfg.chip}`}>
            {cfg.label}
          </span>
        </div>
        <h3 className="font-display text-base sm:text-lg font-semibold mt-1">{stage.title}</h3>
        {stage.note && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{stage.note}</p>}
      </div>
      <div className={`shrink-0 size-7 rounded-full grid place-items-center ${cfg.markBg}`}>
        {cfg.mark}
      </div>
    </div>
  );
}

function EncourageCard({ failedTitle }: { failedTitle: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
      <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white p-6 text-center">
        <Heart className="size-10 mx-auto mb-3" />
        <div className="text-xs uppercase tracking-[0.25em] text-white/80">Pesan untukmu</div>
        <h3 className="font-display text-xl sm:text-2xl font-bold mt-1">Belum di tahap {failedTitle}</h3>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-sm leading-relaxed text-foreground/90">{ENCOURAGE}</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            to="/pendaftaran"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-emerald text-accent px-5 py-3 text-sm font-semibold shadow-emerald hover-lift"
          >
            Lihat Program Selanjutnya
          </Link>
          <Link
            to="/faq"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-secondary"
          >
            Baca FAQ
          </Link>
        </div>
      </div>
    </div>
  );
}

const STATE_STYLES: Record<StageState, {
  label: string;
  chip: string;
  border: string;
  iconBg: string;
  iconColor: string;
  markBg: string;
  mark: React.ReactNode;
}> = {
  passed: {
    label: "Lolos",
    chip: "bg-emerald/15 text-emerald",
    border: "border-emerald/40",
    iconBg: "bg-emerald/15",
    iconColor: "text-emerald",
    markBg: "bg-emerald text-white",
    mark: <CheckCircle2 className="size-4" />,
  },
  failed: {
    label: "Belum Lolos",
    chip: "bg-red-100 text-red-700 dark:bg-red-950/40",
    border: "border-red-300 dark:border-red-900/50",
    iconBg: "bg-red-100 dark:bg-red-950/30",
    iconColor: "text-red-600",
    markBg: "bg-red-500 text-white",
    mark: <XCircle className="size-4" />,
  },
  pending: {
    label: "Dalam Proses",
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-900/40",
    iconBg: "bg-amber-100 dark:bg-amber-950/30",
    iconColor: "text-amber-600",
    markBg: "bg-amber-500 text-white",
    mark: <Clock className="size-4" />,
  },
  locked: {
    label: "Belum Dibuka",
    chip: "bg-secondary text-muted-foreground",
    border: "border-border",
    iconBg: "bg-secondary",
    iconColor: "text-muted-foreground",
    markBg: "bg-secondary text-muted-foreground",
    mark: <Clock className="size-4" />,
  },
  skipped: {
    label: "Belum Dilakukan",
    chip: "bg-secondary text-muted-foreground",
    border: "border-border",
    iconBg: "bg-secondary",
    iconColor: "text-muted-foreground",
    markBg: "bg-secondary text-muted-foreground",
    mark: <span className="text-xs">—</span>,
  },
};

function labelKategori(c: Category) {
  switch (c) {
    case "fully_funded": return "Fully Funded";
    case "partial_funded": return "Partial Funded";
    case "self_funded": return "Self Funded";
    case "gelombang_1": return "Fast Track Gelombang 1";
    case "gelombang_2": return "Fast Track Gelombang 2";
  }
}
