import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactElement, type ReactNode } from "react";
import {
  BookOpenCheck,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  FileText,
  GraduationCap,
  IdCard,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Search,
  Save,
  ShieldCheck,
  Star,
  Trophy,
  UserRound,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import logoSafarIman from "@/assets/logo-safar-iman.png";

export const Route = createFileRoute("/interview")({
  head: () => ({
    meta: [
      { title: "Peserta Interview — Safar Iman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: InterviewPage,
});

const INTERVIEW_CANDIDATES = [
  { name: "Abdul Wachid Asyari", code: "HXP-D22C8CD3" },
  { name: "Alen Purnama", code: "HXP-EF20D8B0" },
  { name: "Athallah Rizqi Ditri Arnodi", code: "HXP-F8D9FEF7" },
  { name: "Irsyad Maulana", code: "HXP-C633AB4E" },
  { name: "Muhammad Badrushshalih", code: "HXP-2B4820D0" },
  { name: "Muhammad Yazid Ahda", code: "HXP-A637F534" },
  { name: "NISRINA NADA", code: "HXP-3C53A06B" },
  { name: "Nurul Iffah Amalia", code: "HXP-F0E85D64" },
  { name: "Rifki daffa islami zainuddin", code: "HXP-AD4F867B" },
  { name: "Yogi Sofiyullah", code: "HXP-B47F06A4" },
] as const;

const PARTICIPANT_FIELDS = [
  "id",
  "registration_code",
  "full_name",
  "email",
  "whatsapp",
  "gender",
  "birth_date",
  "city",
  "education",
  "occupation",
  "religion",
  "social_media",
  "has_passport",
  "reason",
  "achievements",
  "organization_experience",
  "category",
  "photo_url",
  "cv_url",
  "essay_worthy",
  "essay_dream",
  "essay_contribution",
  "case_study_1",
  "case_study_2",
  "case_study_3",
  "case_study_4",
  "case_study_5",
  "case_study_6",
  "case_study_7",
  "essay_submitted_at",
  "essay_updated_at",
  "created_at",
] as const;

type Participant = Pick<Tables<"participants">, (typeof PARTICIPANT_FIELDS)[number]>;
type CandidateRow = (typeof INTERVIEW_CANDIDATES)[number] & { participant: Participant | null };
type DetailMode = "identity" | "essay" | "assessment";
type PageTab = "participants" | "results";
type InterviewResponse = { ok: boolean; error?: string; participants?: Participant[] };
type ScoreKey =
  | "motivation_score"
  | "spirituality_score"
  | "character_score"
  | "commitment_score"
  | "contribution_score"
  | "adaptability_score";
type NoteKey =
  "motivation" | "spirituality" | "character" | "commitment" | "contribution" | "adaptability";
type InterviewEvaluation = {
  id: string;
  participant_id: string;
  registration_code: string;
  full_name: string;
  interviewer_name: string | null;
  interview_date: string;
  motivation_score: number | null;
  spirituality_score: number | null;
  character_score: number | null;
  commitment_score: number | null;
  contribution_score: number | null;
  adaptability_score: number | null;
  aspect_notes: Partial<Record<NoteKey, string>>;
  general_notes: string | null;
  decision: string;
  total_score: number | null;
  recommendation: string;
  updated_at: string;
};
type EvaluationResponse = { ok: boolean; error?: string; evaluations?: InterviewEvaluation[] };

const PASSWORD_STORAGE_KEY = "safar_stats_pw";

const CATEGORY_LABEL: Record<string, string> = {
  fully_funded: "Fully Funded",
  partial_funded: "Partial Funded",
  self_funded: "Self Funded",
  gelombang_1: "Fast Track Gelombang 1",
  gelombang_2: "Fast Track Gelombang 2",
};

const ESSAY_QUESTIONS = [
  { key: "essay_worthy", title: "Essay 1 — Kenapa layak dipilih?" },
  { key: "essay_dream", title: "Essay 2 — Impian setelah ke Tanah Suci" },
  { key: "essay_contribution", title: "Essay 3 — Kontribusi untuk program" },
] as const;

const CASE_QUESTIONS = [
  "Menjaga amanah dan kejujuran",
  "Menghadapi perbedaan dalam kelompok",
  "Menentukan prioritas ibadah dan kegiatan",
  "Menolong peserta lain dalam keterbatasan",
  "Menjaga sikap ketika menghadapi masalah",
  "Kontribusi setelah mengikuti program",
  "Komitmen dan kesiapan mengikuti rangkaian program",
] as const;

const ASSESSMENT_ASPECTS: Array<{
  key: NoteKey;
  scoreKey: ScoreKey;
  title: string;
  weight: number;
  question: string;
  probing: string[];
  indicator: string;
}> = [
  {
    key: "motivation",
    scoreKey: "motivation_score",
    title: "Motivasi & Makna Umrah",
    weight: 20,
    question:
      "Apa yang membuat kamu tertarik mengikuti Program Safar Iman, dan apa arti kesempatan untuk berangkat umrah bagi kamu?",
    probing: [
      "Kenapa ingin ikut sekarang?",
      "Kalau mendapat kesempatan umrah, apa yang paling diharapkan?",
      "Apa bedanya sekadar pergi umrah dengan perjalanan menuju Baitullah?",
    ],
    indicator:
      "Motivasi bukan hanya umrah gratis, tetapi memiliki tujuan pribadi, spiritual, dan makna yang jelas.",
  },
  {
    key: "spirituality",
    scoreKey: "spirituality_score",
    title: "Spiritualitas & Penghayatan Keislaman",
    weight: 15,
    question:
      "Adakah ayat Al-Qur'an, hadis, kisah Nabi, atau nilai Islam yang paling membekas bagi kamu, dan bagaimana hal itu memengaruhi kehidupanmu?",
    probing: [
      "Apa contoh penerapannya dalam keseharian?",
      "Apa bagian tersulit saat mencoba menerapkannya?",
      "Apa yang dilakukan ketika hubungan dengan Allah terasa menurun?",
    ],
    indicator:
      "Bukan sekadar hafalan; nilai Islam tercermin dalam cara berpikir, pilihan, dan kehidupan peserta.",
  },
  {
    key: "character",
    scoreKey: "character_score",
    title: "Akhlak & Kedewasaan Diri",
    weight: 20,
    question:
      "Ceritakan satu pengalaman ketika kamu melakukan kesalahan, mengecewakan orang lain, atau mengalami konflik. Bagaimana kamu menyelesaikannya?",
    probing: [
      "Apa kesalahan kamu sendiri dalam situasi tersebut?",
      "Apa yang dilakukan setelah menyadarinya?",
      "Jika terulang, apa yang akan dilakukan berbeda?",
    ],
    indicator:
      "Mampu mengakui kesalahan, introspeksi, menyelesaikan konflik, bertanggung jawab, dan memperbaiki diri.",
  },
  {
    key: "commitment",
    scoreKey: "commitment_score",
    title: "Komitmen & Kedisiplinan",
    weight: 15,
    question:
      "Program ini memiliki rangkaian panjang, tugas, dan aturan. Apa tantangan terbesar yang mungkin kamu hadapi dan bagaimana strategimu menjaganya?",
    probing: [
      "Bagaimana menjaga komitmen jangka panjang?",
      "Bagaimana mengatur waktu saat sibuk atau lelah?",
      "Apa yang dilakukan jika terpaksa tidak hadir?",
    ],
    indicator:
      "Memiliki strategi nyata, manajemen waktu, dan tanggung jawab—bukan sekadar janji akan berkomitmen.",
  },
  {
    key: "contribution",
    scoreKey: "contribution_score",
    title: "Kepedulian & Kontribusi",
    weight: 15,
    question:
      "Ceritakan satu tindakan yang paling bermakna yang pernah kamu lakukan untuk orang lain, komunitas, atau lingkungan.",
    probing: [
      "Apa motivasi dan pelajaran dari tindakan itu?",
      "Adakah bantuan kecil yang rutin dilakukan?",
      "Setelah umrah, bagaimana manfaatnya dapat diteruskan?",
    ],
    indicator:
      "Terlihat orientasi memberi dan kebermanfaatan, bukan hanya ingin menerima manfaat program.",
  },
  {
    key: "adaptability",
    scoreKey: "adaptability_score",
    title: "Kesiapan & Kemampuan Beradaptasi",
    weight: 15,
    question:
      "Bagaimana kamu menghadapi peserta dengan kebiasaan, karakter, atau cara komunikasi yang sangat berbeda dan membuat tidak nyaman?",
    probing: [
      "Apa yang dilakukan jika hubungan tetap sulit?",
      "Bagaimana menyeimbangkan kenyamanan pribadi dan kebutuhan kelompok?",
      "Bagaimana jika justru kamu dianggap sulit oleh peserta lain?",
    ],
    indicator:
      "Menunjukkan fleksibilitas, kerja sama, pengendalian diri, komunikasi, empati, dan pemecahan masalah.",
  },
];

const SCORE_GUIDE = [
  "Sangat Kurang — tidak relevan, tanpa contoh, dan belum memahami konteks",
  "Kurang — jawaban masih umum dan contoh lemah",
  "Cukup — relevan dan ada contoh, tetapi belum mendalam",
  "Baik — jelas, reflektif, relevan, dan memiliki contoh nyata",
  "Sangat Baik — kuat, matang, konsisten, serta menunjukkan dampak nyata",
] as const;

function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return "Belum tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return (
    new Intl.DateTimeFormat("id-ID", {
      dateStyle: "long",
      ...(withTime ? { timeStyle: "short" as const } : {}),
      timeZone: "Asia/Jakarta",
    }).format(date) + (withTime ? " WIB" : "")
  );
}

function valueOrDash(value: string | null | undefined) {
  return value?.trim() || "—";
}

async function fetchInterviewParticipants(password: string) {
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    functionName: string,
    args: { _password: string },
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
  return rpc("get_interview_participants_with_password", { _password: password });
}

async function fetchInterviewEvaluations(password: string) {
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    functionName: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
  return rpc("get_interview_evaluations_with_password", { _password: password });
}

async function saveInterviewEvaluation(password: string, values: Record<string, unknown>) {
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    functionName: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
  return rpc("save_interview_evaluation_with_password", { _password: password, ...values });
}

async function autosaveInterviewScore(
  password: string,
  participantId: string,
  scoreKey: ScoreKey,
  score: number | null,
) {
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    functionName: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
  return rpc("autosave_interview_score_with_password", {
    _password: password,
    _participant_id: participantId,
    _score_key: scoreKey,
    _score: score,
  });
}

function isEvaluationComplete(evaluation: InterviewEvaluation) {
  return ASSESSMENT_ASPECTS.every((aspect) => evaluation[aspect.scoreKey] != null);
}

function calculateTotal(scores: Record<ScoreKey, number>) {
  return ASSESSMENT_ASPECTS.reduce(
    (total, aspect) => total + ((scores[aspect.scoreKey] || 0) / 5) * aspect.weight,
    0,
  );
}

function recommendationFor(total: number) {
  if (total >= 85) return "Sangat Direkomendasikan";
  if (total >= 75) return "Direkomendasikan";
  if (total >= 65) return "Dipertimbangkan";
  return "Belum Direkomendasikan";
}

function InterviewPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [evaluations, setEvaluations] = useState<InterviewEvaluation[]>([]);
  const [accessPassword, setAccessPassword] = useState("");
  const [pageTab, setPageTab] = useState<PageTab>("participants");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CandidateRow | null>(null);
  const [mode, setMode] = useState<DetailMode>("identity");

  const unlock = async (value: string, silent = false) => {
    const cleanPassword = value.trim();
    if (!cleanPassword) return;
    if (!silent) setChecking(true);
    try {
      const [participantResult, evaluationResult] = await Promise.race([
        Promise.all([
          fetchInterviewParticipants(cleanPassword),
          fetchInterviewEvaluations(cleanPassword),
        ]),
        new Promise<never>((_, reject) =>
          window.setTimeout(() => reject(new Error("request_timeout")), 15000),
        ),
      ]);

      if (participantResult.error || evaluationResult.error) {
        if (!silent) setErrorMessage("Gagal menghubungi server. Silakan coba lagi.");
        return;
      }

      const response = participantResult.data as InterviewResponse;
      const evaluationResponse = evaluationResult.data as EvaluationResponse;
      if (!response?.ok) {
        localStorage.removeItem(PASSWORD_STORAGE_KEY);
        setUnlocked(false);
        if (!silent) {
          setErrorMessage(
            response?.error === "not_configured"
              ? "Password statistik belum diatur oleh admin."
              : "Password salah.",
          );
        }
        return;
      }

      localStorage.setItem(PASSWORD_STORAGE_KEY, cleanPassword);
      setParticipants(response.participants ?? []);
      setEvaluations(evaluationResponse?.ok ? (evaluationResponse.evaluations ?? []) : []);
      setAccessPassword(cleanPassword);
      setUnlocked(true);
      setErrorMessage("");
    } catch {
      if (!silent) setErrorMessage("Server tidak merespons. Silakan coba lagi.");
    } finally {
      if (!silent) setChecking(false);
    }
  };

  useEffect(() => {
    const savedPassword = localStorage.getItem(PASSWORD_STORAGE_KEY);
    if (savedPassword) void unlock(savedPassword, true);
  }, []);

  const lockPage = () => {
    localStorage.removeItem(PASSWORD_STORAGE_KEY);
    setParticipants([]);
    setEvaluations([]);
    setAccessPassword("");
    setPassword("");
    setUnlocked(false);
    setSelected(null);
  };

  const rows = useMemo<CandidateRow[]>(() => {
    const participantMap = new Map(
      participants.map((participant) => [participant.registration_code, participant]),
    );
    return INTERVIEW_CANDIDATES.map((candidate) => ({
      ...candidate,
      participant: participantMap.get(candidate.code) ?? null,
    }));
  }, [participants]);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("id-ID");
    if (!term) return rows;
    return rows.filter((row) =>
      [row.name, row.code, row.participant?.occupation, row.participant?.city]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase("id-ID").includes(term)),
    );
  }, [query, rows]);

  const openDetail = (row: CandidateRow, nextMode: DetailMode) => {
    if (!row.participant) {
      toast.error(`Data ${row.code} belum ditemukan di database.`);
      return;
    }
    setSelected(row);
    setMode(nextMode);
  };

  const evaluationByParticipant = useMemo(
    () => new Map(evaluations.map((evaluation) => [evaluation.participant_id, evaluation])),
    [evaluations],
  );

  const handleEvaluationSaved = (evaluation: InterviewEvaluation) => {
    setEvaluations((current) =>
      [
        ...current.filter((item) => item.participant_id !== evaluation.participant_id),
        evaluation,
      ].sort((a, b) => Number(b.total_score) - Number(a.total_score)),
    );
  };

  if (!unlocked) {
    return (
      <main className="grid min-h-screen place-items-center bg-secondary/30 px-4 py-16">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-7 shadow-soft">
          <img src={logoSafarIman} alt="Safar Iman" className="mb-5 h-12 w-auto" />
          <div className="mb-4 grid size-12 place-items-center rounded-xl bg-emerald/10 text-emerald">
            <Lock className="size-5" />
          </div>
          <h1 className="font-display text-xl font-semibold">Akses Interviewer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gunakan password yang sama dengan halaman Statistik Internal untuk melihat data 10
            kandidat interview.
          </p>
          <form
            className="mt-5 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void unlock(password);
            }}
          >
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              autoFocus
            />
            {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
            <button
              type="submit"
              disabled={checking || !password.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {checking ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              Buka Data Interview
            </button>
          </form>
        </div>
      </main>
    );
  }

  const foundCount = rows.filter((row) => row.participant).length;

  return (
    <main className="min-h-screen bg-secondary/30">
      <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 py-2">
          <div className="flex items-center gap-3">
            <img src={logoSafarIman} alt="Safar Iman" className="h-10 w-auto sm:h-11" />
            <div className="hidden h-8 w-px bg-border sm:block" />
            <div className="hidden sm:block">
              <div className="text-sm font-semibold">Panel Interviewer</div>
              <div className="text-[10px] text-muted-foreground">Data kandidat Safar Iman</div>
            </div>
          </div>
          <button
            type="button"
            onClick={lockPage}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold transition hover:border-red-300 hover:text-red-600"
          >
            <LogOut className="size-3.5" /> Kunci Halaman
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:py-8">
        <section className="overflow-hidden rounded-2xl border border-emerald/20 bg-gradient-to-br from-emerald-deep via-emerald to-emerald-light p-5 text-white shadow-emerald sm:p-6">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="max-w-2xl">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
                <UsersRound className="size-3.5" /> 10 Kandidat Interview
              </div>
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                Bahan Pertimbangan Interview
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                Lihat identitas pendaftaran serta jawaban Essay dan Studi Kasus setiap kandidat
                sebelum sesi interview berlangsung.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:min-w-56">
              <Summary label="Data ditemukan" value={foundCount} />
              <Summary
                label="Belum ditemukan"
                value={10 - foundCount}
                warning={foundCount !== 10}
              />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-1.5 sm:w-fit">
          <PageTabButton
            active={pageTab === "participants"}
            onClick={() => setPageTab("participants")}
            icon={<UsersRound className="size-4" />}
            label="Peserta Interview"
            count={rows.length}
          />
          <PageTabButton
            active={pageTab === "results"}
            onClick={() => setPageTab("results")}
            icon={<Trophy className="size-4" />}
            label="Hasil Penilaian"
            count={evaluations.length}
          />
        </div>

        {pageTab === "participants" ? (
          <>
            <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
              <div className="relative max-w-xl">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari nama, kode pendaftaran, pekerjaan, atau kota…"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {filtered.map((row, index) => {
                const participant = row.participant;
                const evaluation = participant
                  ? evaluationByParticipant.get(participant.id)
                  : undefined;
                return (
                  <article
                    key={row.code}
                    className="rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-accent/40 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-sm font-bold text-accent">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold leading-snug text-foreground">
                              {participant?.full_name || row.name}
                            </h3>
                            <div className="mt-1 font-mono text-xs text-muted-foreground">
                              {row.code}
                            </div>
                          </div>
                          {evaluation ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-1 text-[10px] font-semibold text-accent">
                              <Star className="size-3" />
                              {isEvaluationComplete(evaluation)
                                ? `Dinilai ${Number(evaluation.total_score).toFixed(0)}/100`
                                : "Draft tersimpan"}
                            </span>
                          ) : participant ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald/20 bg-emerald/10 px-2 py-1 text-[10px] font-semibold text-emerald">
                              <CheckCircle2 className="size-3" /> Data lengkap
                            </span>
                          ) : (
                            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600">
                              Data belum ditemukan
                            </span>
                          )}
                        </div>

                        <div className="mt-3 grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
                          <span className="inline-flex items-center gap-1.5">
                            <BriefcaseBusiness className="size-3.5" />
                            {valueOrDash(participant?.occupation)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="size-3.5" />
                            {valueOrDash(participant?.city)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        disabled={!participant}
                        onClick={() => openDetail(row, "identity")}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold transition hover:border-accent/50 hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <IdCard className="size-4 text-accent" /> Identitas Pendaftaran
                      </button>
                      <button
                        type="button"
                        disabled={!participant}
                        onClick={() => openDetail(row, "essay")}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gradient-gold px-3 py-2 text-xs font-semibold text-emerald-deep shadow-gold transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <BookOpenCheck className="size-4" /> Essay &amp; Studi Kasus
                      </button>
                      <button
                        type="button"
                        disabled={!participant}
                        onClick={() => openDetail(row, "assessment")}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-light disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FileText className="size-4" />{" "}
                        {evaluation ? "Edit Penilaian" : "Form Penilaian"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-card py-12 text-center text-sm text-muted-foreground">
                Tidak ada peserta yang sesuai dengan pencarian.
              </div>
            )}
          </>
        ) : (
          <EvaluationResults evaluations={evaluations} />
        )}

        <ParticipantDialog
          row={selected}
          mode={mode}
          onModeChange={setMode}
          onClose={() => setSelected(null)}
          evaluation={
            selected?.participant ? evaluationByParticipant.get(selected.participant.id) : undefined
          }
          accessPassword={accessPassword}
          onEvaluationSaved={handleEvaluationSaved}
        />
      </div>
    </main>
  );
}

function PageTabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
        active ? "bg-emerald text-white shadow-sm" : "text-muted-foreground hover:bg-secondary"
      }`}
    >
      {icon} {label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/15" : "bg-secondary"}`}
      >
        {count}
      </span>
    </button>
  );
}

function EvaluationResults({ evaluations }: { evaluations: InterviewEvaluation[] }) {
  const sorted = [...evaluations].sort(
    (a, b) =>
      Number(isEvaluationComplete(b)) - Number(isEvaluationComplete(a)) ||
      Number(b.total_score) - Number(a.total_score),
  );

  if (!sorted.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-14 text-center">
        <BarChart3 className="mx-auto size-9 text-muted-foreground/50" />
        <h3 className="mt-3 font-semibold">Belum ada hasil penilaian</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Isi Form Penilaian pada peserta. Hasil dan peringkat akan muncul otomatis di sini.
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-4 sm:px-5">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Trophy className="size-5 text-accent" /> Peringkat Hasil Interview
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Otomatis diurutkan dari total nilai tertinggi. Nilai aspek ditampilkan sebagai skor 1–5
          dan hasil berbobot.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] text-left text-xs">
          <thead className="bg-secondary/60 text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Peringkat</th>
              <th className="px-4 py-3">Peserta</th>
              {ASSESSMENT_ASPECTS.map((aspect) => (
                <th key={aspect.key} className="px-3 py-3 text-center">
                  {aspect.title}
                  <span className="mt-0.5 block font-normal">Bobot {aspect.weight}%</span>
                </th>
              ))}
              <th className="px-4 py-3 text-center">Total</th>
              <th className="px-4 py-3">Hasil</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((evaluation, index) => (
              <tr key={evaluation.id} className="align-top hover:bg-secondary/25">
                <td className="px-4 py-4">
                  <span
                    className={`grid size-8 place-items-center rounded-full font-bold ${index < 3 ? "bg-gradient-gold text-emerald-deep" : "bg-secondary"}`}
                  >
                    {index + 1}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="min-w-44 font-semibold">{evaluation.full_name}</div>
                  <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {evaluation.registration_code}
                  </div>
                  <div className="mt-2 text-[10px] text-muted-foreground">
                    {evaluation.interviewer_name || "Interviewer belum diisi"} ·{" "}
                    {formatDate(evaluation.interview_date)}
                  </div>
                </td>
                {ASSESSMENT_ASPECTS.map((aspect) => {
                  const rawScore = evaluation[aspect.scoreKey];
                  const score = Number(rawScore || 0);
                  const weighted = (score / 5) * aspect.weight;
                  return (
                    <td key={aspect.key} className="px-3 py-4 text-center">
                      <div className="font-semibold">{rawScore == null ? "—" : `${score}/5`}</div>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {weighted.toFixed(0)}/{aspect.weight}
                      </div>
                    </td>
                  );
                })}
                <td className="px-4 py-4 text-center">
                  <div className="text-lg font-bold text-emerald">
                    {isEvaluationComplete(evaluation)
                      ? Number(evaluation.total_score).toFixed(0)
                      : "—"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">/100</div>
                </td>
                <td className="px-4 py-4">
                  <div className="min-w-40 font-semibold text-emerald">
                    {isEvaluationComplete(evaluation)
                      ? evaluation.recommendation
                      : "Draft Belum Lengkap"}
                  </div>
                  <span className="mt-2 inline-flex rounded-full border border-border bg-secondary px-2 py-1 text-[10px] font-semibold">
                    {evaluation.decision}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Summary({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: number;
  warning?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/10 p-3 text-center backdrop-blur">
      <div className={`text-2xl font-semibold ${warning ? "text-amber-200" : "text-white"}`}>
        {value}
      </div>
      <div className="mt-0.5 text-[10px] leading-tight text-white/70">{label}</div>
    </div>
  );
}

function ParticipantDialog({
  row,
  mode,
  onModeChange,
  onClose,
  evaluation,
  accessPassword,
  onEvaluationSaved,
}: {
  row: CandidateRow | null;
  mode: DetailMode;
  onModeChange: (mode: DetailMode) => void;
  onClose: () => void;
  evaluation?: InterviewEvaluation;
  accessPassword: string;
  onEvaluationSaved: (evaluation: InterviewEvaluation) => void;
}) {
  const participant = row?.participant;
  return (
    <Dialog open={Boolean(participant)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden p-0">
        {participant && (
          <>
            <DialogHeader className="border-b border-border bg-secondary/40 px-5 pb-4 pt-5 text-left sm:px-6">
              <DialogTitle className="pr-8 font-display text-xl">
                {participant.full_name}
              </DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-mono font-semibold text-foreground">
                  {participant.registration_code}
                </span>
                <span aria-hidden="true">|</span>
                <span>
                  Dikirim{" "}
                  {formatDate(participant.essay_submitted_at ?? participant.essay_updated_at, true)}
                </span>
              </DialogDescription>
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-background p-1 sm:inline-grid sm:w-fit">
                <DialogTab
                  active={mode === "identity"}
                  onClick={() => onModeChange("identity")}
                  icon={<IdCard className="size-4" />}
                  label="Identitas Pendaftaran"
                />
                <DialogTab
                  active={mode === "essay"}
                  onClick={() => onModeChange("essay")}
                  icon={<BookOpenCheck className="size-4" />}
                  label="Essay & Studi Kasus"
                />
                <DialogTab
                  active={mode === "assessment"}
                  onClick={() => onModeChange("assessment")}
                  icon={<FileText className="size-4" />}
                  label="Form Penilaian"
                />
              </div>
            </DialogHeader>
            <div className="max-h-[calc(92vh-175px)] overflow-y-auto px-5 py-5 sm:px-6">
              {mode === "identity" ? (
                <IdentityDetail participant={participant} />
              ) : mode === "essay" ? (
                <EssayDetail participant={participant} />
              ) : (
                <AssessmentForm
                  participant={participant}
                  evaluation={evaluation}
                  accessPassword={accessPassword}
                  onSaved={onEvaluationSaved}
                />
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DialogTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
        active ? "bg-emerald text-white shadow-sm" : "text-muted-foreground hover:bg-secondary"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function IdentityDetail({ participant }: { participant: Participant }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <IdentityItem icon={<UserRound />} label="Nama Lengkap" value={participant.full_name} />
      <IdentityItem icon={<Mail />} label="Email" value={participant.email} />
      <IdentityItem icon={<Phone />} label="WhatsApp" value={participant.whatsapp} />
      <IdentityItem
        icon={<CalendarDays />}
        label="Tanggal Lahir"
        value={formatDate(participant.birth_date)}
      />
      <IdentityItem icon={<UserRound />} label="Jenis Kelamin" value={participant.gender} />
      <IdentityItem icon={<MapPin />} label="Kota / Kabupaten" value={participant.city} />
      <IdentityItem icon={<GraduationCap />} label="Pendidikan" value={participant.education} />
      <IdentityItem icon={<BriefcaseBusiness />} label="Pekerjaan" value={participant.occupation} />
      <IdentityItem
        icon={<FileText />}
        label="Kategori"
        value={
          participant.category
            ? (CATEGORY_LABEL[participant.category] ?? participant.category)
            : "Reguler"
        }
      />
      <IdentityItem
        icon={<FileText />}
        label="Instagram"
        value={participant.social_media ? `@${participant.social_media.replace(/^@/, "")}` : "—"}
      />
      <IdentityItem
        icon={<FileText />}
        label="Paspor"
        value={valueOrDash(participant.has_passport)}
      />
      <IdentityItem
        icon={<FileText />}
        label="Tanggal Pendaftaran"
        value={formatDate(participant.created_at, true)}
      />
    </div>
  );
}

function IdentityItem({
  icon,
  label,
  value,
}: {
  icon: ReactElement;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="[&>svg]:size-3.5 [&>svg]:text-accent">{icon}</span>
        {label}
      </div>
      <div className="mt-1.5 break-words text-sm font-medium text-foreground">
        {valueOrDash(value)}
      </div>
    </div>
  );
}

function EssayDetail({ participant }: { participant: Participant }) {
  return (
    <div className="space-y-6">
      <section>
        <SectionHeading number="01" title="Jawaban Essay" />
        <div className="mt-3 space-y-3">
          {ESSAY_QUESTIONS.map((question) => (
            <AnswerCard
              key={question.key}
              title={question.title}
              value={participant[question.key]}
            />
          ))}
        </div>
      </section>
      <section>
        <SectionHeading number="02" title="Jawaban Studi Kasus" />
        <div className="mt-3 space-y-3">
          {CASE_QUESTIONS.map((title, index) => (
            <AnswerCard
              key={title}
              title={`Studi Kasus ${index + 1} — ${title}`}
              value={participant[`case_study_${index + 1}` as keyof Participant] as string | null}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-8 place-items-center rounded-lg bg-gradient-gold text-xs font-bold text-emerald-deep">
        {number}
      </span>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
    </div>
  );
}

function AnswerCard({ title, value }: { title: string; value: string | null }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h4 className="text-sm font-semibold text-accent">{title}</h4>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground/85">
        {valueOrDash(value)}
      </p>
    </div>
  );
}

function AssessmentForm({
  participant,
  evaluation,
  accessPassword,
  onSaved,
}: {
  participant: Participant;
  evaluation?: InterviewEvaluation;
  accessPassword: string;
  onSaved: (evaluation: InterviewEvaluation) => void;
}) {
  const emptyScores = Object.fromEntries(
    ASSESSMENT_ASPECTS.map((aspect) => [aspect.scoreKey, 0]),
  ) as Record<ScoreKey, number>;
  const [scores, setScores] = useState<Record<ScoreKey, number>>(emptyScores);
  const [notes, setNotes] = useState<Partial<Record<NoteKey, string>>>({});
  const [interviewerName, setInterviewerName] = useState("");
  const [interviewDate, setInterviewDate] = useState(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date()),
  );
  const [generalNotes, setGeneralNotes] = useState("");
  const [decision, setDecision] = useState("Belum Diputuskan");
  const [saving, setSaving] = useState(false);
  const [savingScore, setSavingScore] = useState<ScoreKey | null>(null);
  const [lastSavedScore, setLastSavedScore] = useState<ScoreKey | null>(null);

  useEffect(() => {
    setScores(
      evaluation
        ? (Object.fromEntries(
            ASSESSMENT_ASPECTS.map((aspect) => [
              aspect.scoreKey,
              Number(evaluation[aspect.scoreKey]),
            ]),
          ) as Record<ScoreKey, number>)
        : emptyScores,
    );
    setNotes(evaluation?.aspect_notes ?? {});
    setInterviewerName(evaluation?.interviewer_name ?? "");
    setInterviewDate(
      evaluation?.interview_date ??
        new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date()),
    );
    setGeneralNotes(evaluation?.general_notes ?? "");
    setDecision(evaluation?.decision ?? "Belum Diputuskan");
  }, [participant.id, evaluation?.updated_at]);

  const total = calculateTotal(scores);
  const complete = ASSESSMENT_ASPECTS.every((aspect) => scores[aspect.scoreKey] >= 1);

  const handleScoreToggle = async (scoreKey: ScoreKey, value: number) => {
    const previousValue = scores[scoreKey];
    const nextValue = previousValue === value ? 0 : value;
    setScores((current) => ({ ...current, [scoreKey]: nextValue }));
    setSavingScore(scoreKey);
    setLastSavedScore(null);

    try {
      const { data, error } = await autosaveInterviewScore(
        accessPassword,
        participant.id,
        scoreKey,
        nextValue || null,
      );
      if (error) throw new Error(error.message);
      const response = data as { ok: boolean; error?: string; evaluation?: InterviewEvaluation };
      if (!response?.ok || !response.evaluation)
        throw new Error(response?.error || "autosave_failed");

      onSaved({
        ...response.evaluation,
        registration_code: participant.registration_code,
        full_name: participant.full_name,
      });
      setLastSavedScore(scoreKey);
    } catch (error) {
      console.error("Failed to autosave interview score", error);
      setScores((current) => ({ ...current, [scoreKey]: previousValue }));
      toast.error("Skor belum tersimpan. Periksa internet lalu coba lagi.");
    } finally {
      setSavingScore((current) => (current === scoreKey ? null : current));
    }
  };

  const handleSave = async () => {
    if (!complete) {
      toast.error("Lengkapi skor 1–5 untuk seluruh aspek penilaian.");
      return;
    }
    if (interviewerName.trim().length < 2) {
      toast.error("Isi nama interviewer terlebih dahulu.");
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await saveInterviewEvaluation(accessPassword, {
        _participant_id: participant.id,
        _interviewer_name: interviewerName.trim(),
        _interview_date: interviewDate,
        _motivation_score: scores.motivation_score,
        _spirituality_score: scores.spirituality_score,
        _character_score: scores.character_score,
        _commitment_score: scores.commitment_score,
        _contribution_score: scores.contribution_score,
        _adaptability_score: scores.adaptability_score,
        _aspect_notes: notes,
        _general_notes: generalNotes,
        _decision: decision,
      });
      if (error) throw new Error(error.message);
      const response = data as { ok: boolean; error?: string; evaluation?: InterviewEvaluation };
      if (!response?.ok || !response.evaluation) throw new Error(response?.error || "save_failed");

      const saved = {
        ...response.evaluation,
        registration_code: participant.registration_code,
        full_name: participant.full_name,
      };
      onSaved(saved);
      toast.success("Penilaian interview berhasil disimpan.");
    } catch (error) {
      console.error("Failed to save interview evaluation", error);
      toast.error("Penilaian belum dapat disimpan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-2xl border border-border bg-secondary/30 p-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-xs font-semibold">
          Nama Interviewer
          <Input
            value={interviewerName}
            onChange={(event) => setInterviewerName(event.target.value)}
            placeholder="Nama lengkap interviewer"
          />
        </label>
        <label className="space-y-1.5 text-xs font-semibold">
          Tanggal Interview
          <Input
            type="date"
            value={interviewDate}
            onChange={(event) => setInterviewDate(event.target.value)}
          />
        </label>
      </div>

      <div className="rounded-2xl border border-accent/25 bg-accent/5 p-4">
        <h3 className="text-sm font-semibold">Panduan skor 1–5</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-5">
          {SCORE_GUIDE.map((guide, index) => (
            <div
              key={guide}
              className="rounded-xl border border-border bg-card p-2.5 text-[10px] leading-relaxed text-muted-foreground"
            >
              <span className="mb-1 block text-base font-bold text-accent">{index + 1}</span>
              {guide}
            </div>
          ))}
        </div>
      </div>

      {ASSESSMENT_ASPECTS.map((aspect, index) => {
        const score = scores[aspect.scoreKey];
        const weighted = (score / 5) * aspect.weight;
        return (
          <section key={aspect.key} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-gold text-sm font-bold text-emerald-deep">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold">{aspect.title}</h3>
                  <span className="mt-1 inline-flex rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-semibold text-emerald">
                    Bobot {aspect.weight}%
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-emerald">
                  {weighted.toFixed(0)}
                  <span className="text-xs text-muted-foreground">/{aspect.weight}</span>
                </div>
                <div className="text-[10px] text-muted-foreground">Nilai berbobot</div>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-secondary/50 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Pertanyaan utama
              </div>
              <p className="mt-1 text-sm font-medium leading-relaxed">{aspect.question}</p>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-border p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Pertanyaan pendalaman
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-foreground/80">
                  {aspect.probing.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-emerald/20 bg-emerald/5 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald">
                  Yang dinilai
                </div>
                <p className="mt-2 text-xs leading-relaxed text-foreground/80">
                  {aspect.indicator}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold">
                <span>Pilih skor · klik kembali untuk membatalkan</span>
                {savingScore === aspect.scoreKey ? (
                  <span className="inline-flex items-center gap-1 font-normal text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" /> Menyimpan…
                  </span>
                ) : lastSavedScore === aspect.scoreKey ? (
                  <span className="inline-flex items-center gap-1 font-normal text-emerald">
                    <CheckCircle2 className="size-3" /> Tersimpan otomatis
                  </span>
                ) : null}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => void handleScoreToggle(aspect.scoreKey, value)}
                    className={`rounded-xl border px-2 py-2.5 text-sm font-bold transition ${score === value ? "border-emerald bg-emerald text-white shadow-sm" : "border-border bg-background hover:border-emerald/40"}`}
                    aria-label={`Nilai ${value} untuk ${aspect.title}`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <label className="mt-4 block space-y-1.5 text-xs font-semibold">
              Catatan aspek <span className="font-normal text-muted-foreground">(opsional)</span>
              <Textarea
                value={notes[aspect.key] ?? ""}
                onChange={(event) =>
                  setNotes((current) => ({ ...current, [aspect.key]: event.target.value }))
                }
                placeholder="Tuliskan bukti jawaban, kekuatan, atau hal yang perlu dipertimbangkan…"
                className="min-h-20 text-sm"
              />
            </label>
          </section>
        );
      })}

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <label className="block space-y-1.5 text-xs font-semibold">
          Catatan umum interviewer{" "}
          <span className="font-normal text-muted-foreground">(opsional)</span>
          <Textarea
            value={generalNotes}
            onChange={(event) => setGeneralNotes(event.target.value)}
            placeholder="Ringkasan hasil interview dan pertimbangan akhir…"
            className="min-h-24 text-sm"
          />
        </label>
        <label className="mt-4 block space-y-1.5 text-xs font-semibold">
          Keputusan akhir
          <select
            value={decision}
            onChange={(event) => setDecision(event.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option>Belum Diputuskan</option>
            <option>Fully Funded</option>
            <option>Partial Funded</option>
            <option>Tidak Lolos</option>
          </select>
        </label>
      </section>

      <div className="sticky bottom-0 z-10 flex flex-col gap-3 rounded-2xl border border-emerald/20 bg-card/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs text-muted-foreground">Total nilai otomatis</div>
          <div className="text-3xl font-bold text-emerald">
            {total.toFixed(0)}
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
          <div className="text-xs font-semibold text-accent">
            {complete ? recommendationFor(total) : "Lengkapi seluruh aspek"}
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !complete}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-gold px-6 py-3 text-sm font-bold text-emerald-deep shadow-gold transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {evaluation ? "Perbarui Penilaian" : "Simpan Penilaian"}
        </button>
      </div>
    </div>
  );
}
