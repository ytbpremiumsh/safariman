import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactElement, type ReactNode } from "react";
import {
  BookOpenCheck,
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
  ShieldCheck,
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
type DetailMode = "identity" | "essay";
type InterviewResponse = { ok: boolean; error?: string; participants?: Participant[] };

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

function InterviewPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CandidateRow | null>(null);
  const [mode, setMode] = useState<DetailMode>("identity");

  const unlock = async (value: string, silent = false) => {
    const cleanPassword = value.trim();
    if (!cleanPassword) return;
    if (!silent) setChecking(true);
    try {
      const { data, error } = await Promise.race([
        fetchInterviewParticipants(cleanPassword),
        new Promise<never>((_, reject) =>
          window.setTimeout(() => reject(new Error("request_timeout")), 15000),
        ),
      ]);

      if (error) {
        if (!silent) setErrorMessage("Gagal menghubungi server. Silakan coba lagi.");
        return;
      }

      const response = data as InterviewResponse;
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
                      {participant ? (
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

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
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

        <ParticipantDialog
          row={selected}
          mode={mode}
          onModeChange={setMode}
          onClose={() => setSelected(null)}
        />
      </div>
    </main>
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
}: {
  row: CandidateRow | null;
  mode: DetailMode;
  onModeChange: (mode: DetailMode) => void;
  onClose: () => void;
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
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-background p-1 sm:inline-grid sm:w-fit">
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
              </div>
            </DialogHeader>
            <div className="max-h-[calc(92vh-175px)] overflow-y-auto px-5 py-5 sm:px-6">
              {mode === "identity" ? (
                <IdentityDetail participant={participant} />
              ) : (
                <EssayDetail participant={participant} />
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
        <IdentityItem
          icon={<BriefcaseBusiness />}
          label="Pekerjaan"
          value={participant.occupation}
        />
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
