import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type ReviewDecision = "reviewed" | "interview" | "rejected";
export type ReviewScores = Record<string, number>;

type Criterion = { label: string; point: number };

const QUESTIONS: { key: string; title: string; criteria: Criterion[] }[] = [
  {
    key: "essay_1",
    title: "Essay 1 — Kenapa layak dipilih?",
    criteria: [
      { label: "Niat ibadah yang kuat", point: 4 },
      { label: "Komitmen mengikuti program", point: 2 },
      { label: "Bersyukur atas kesempatan", point: 2 },
      { label: "Menjadi inspirasi orang lain", point: 1 },
      { label: "Kerendahan hati", point: 1 },
    ],
  },
  {
    key: "essay_2",
    title: "Essay 2 — Mimpi setelah Umrah",
    criteria: [
      { label: "Menjadi pribadi lebih baik", point: 2 },
      { label: "Menjaga ibadah setelah pulang", point: 2 },
      { label: "Berbagi pengalaman", point: 2 },
      { label: "Berdakwah / mengajak kebaikan", point: 2 },
      { label: "Kontribusi sosial", point: 2 },
    ],
  },
  {
    key: "essay_3",
    title: "Essay 3 — Kontribusi untuk umat",
    criteria: [
      { label: "Dakwah", point: 2 },
      { label: "Pendidikan", point: 2 },
      { label: "Sosial / kemanusiaan", point: 2 },
      { label: "Membantu masyarakat sekitar", point: 2 },
      { label: "Program nyata yang pernah dilakukan", point: 2 },
    ],
  },
  {
    key: "case_1",
    title: "Studi Kasus 1 — Kehilangan rombongan tanpa ponsel",
    criteria: [
      { label: "Tetap tenang", point: 4 },
      { label: "Tidak panik", point: 2 },
      { label: "Menuju titik kumpul", point: 2 },
      { label: "Menghubungi petugas", point: 1 },
      { label: "Menunggu instruksi", point: 1 },
    ],
  },
  {
    key: "case_2",
    title: "Studi Kasus 2 — Jamaah lansia kelelahan",
    criteria: [
      { label: "Empati & kepedulian", point: 2 },
      { label: "Membantu secara fisik", point: 2 },
      { label: "Memberi minum ", point: 2 },
      { label: "Mengajak istirahat", point: 2 },
      { label: "Menghubungi pembimbing / ketua rombongan", point: 2 },
    ],
  },
  {
    key: "case_3",
    title: "Studi Kasus 3 — Jamaah kelelahan berat / kondisi darurat",
    criteria: [
      { label: "Prioritaskan kesehatan", point: 2 },
      { label: "Mencari tempat teduh", point: 2 },
      { label: "Meminta bantuan petugas", point: 2 },
      { label: "Mendampingi jamaah", point: 2 },
      { label: "Informasikan ke ketua rombongan", point: 2 },
    ],
  },
  {
    key: "case_4",
    title: "Studi Kasus 4 — Perbedaan pendapat jadwal ziarah",
    criteria: [
      { label: "Musyawarah", point: 2 },
      { label: "Menghargai pendapat orang lain", point: 2 },
      { label: "Menjaga ukhuwah", point: 2 },
      { label: "Menghindari konflik", point: 2 },
      { label: "Mengikuti keputusan bersama", point: 2 },
    ],
  },
  {
    key: "case_5",
    title: "Studi Kasus 5 — Menemukan dompet jamaah lain",
    criteria: [
      { label: "Tidak mengambil untuk kepentingan pribadi", point: 2 },
      { label: "Menyerahkan ke petugas resmi", point: 4 },
      { label: "Melaporkan kehilangan", point: 2 },
      { label: "Menjaga amanah", point: 1 },
      { label: "Mencari pemilik dompet dari identitas ", point: 1 },
    ],
  },
  {
    key: "case_6",
    title: "Studi Kasus 6 — Terpisah saat tawaf, kondisi padat",
    criteria: [
      { label: "Tetap tenang", point: 2 },
      { label: "Fokus pada ibadah", point: 2 },
      { label: "Tidak melawan arus", point: 2 },
      { label: "Menuju titik temu", point: 3 },
      { label: "Menghubungi pendamping setelah aman", point: 1 },
    ],
  },
  {
    key: "case_7",
    title: "Studi Kasus 7 — Cuaca ekstrem & dehidrasi",
    criteria: [
      { label: "Edukasi tentang bahaya dehidrasi", point: 2 },
      { label: "Menjelaskan dengan bijak", point: 2 },
      { label: "Mengajak minum secukupnya", point: 2 },
      { label: "Utamakan keselamatan", point: 2 },
      { label: "Memberikan contoh yang baik", point: 2 },
    ],
  },
];

const EMPTY_SCORES = Object.fromEntries(QUESTIONS.map((q) => [q.key, 0])) as ReviewScores;
const emptyChecks = () => Object.fromEntries(QUESTIONS.map((q) => [q.key, [] as number[]])) as Record<string, number[]>;

type Props = {
  answers: Record<string, string | null>;
  initialScores?: ReviewScores | null;
  currentDecision: ReviewDecision;
  busy?: boolean;
  onSave: (decision: ReviewDecision, scores: ReviewScores) => Promise<void> | void;
  onReset?: () => Promise<void> | void;
};

export function ManualEssayReview({ answers, initialScores, currentDecision, busy, onSave, onReset }: Props) {
  const [checks, setChecks] = useState<Record<string, number[]>>(emptyChecks);
  const [saved, setSaved] = useState<ReviewScores>(EMPTY_SCORES);

  useEffect(() => {
    setChecks(emptyChecks());
    setSaved({ ...EMPTY_SCORES, ...(initialScores ?? {}) });
  }, [initialScores]);

  const scores = useMemo(() => {
    const next: ReviewScores = { ...EMPTY_SCORES };
    for (const q of QUESTIONS) {
      const picked = checks[q.key] ?? [];
      next[q.key] = picked.length
        ? Math.min(10, picked.reduce((sum, index) => sum + (q.criteria[index]?.point ?? 0), 0))
        : (saved[q.key] ?? 0);
    }
    return next;
  }, [checks, saved]);

  const total = useMemo(() => QUESTIONS.reduce((sum, q) => sum + (scores[q.key] ?? 0), 0), [scores]);

  const toggle = (key: string, index: number) =>
    setChecks((previous) => {
      const current = previous[key] ?? [];
      return { ...previous, [key]: current.includes(index) ? current.filter((i) => i !== index) : [...current, index] };
    });

  const handleReset = async () => {
    setChecks(emptyChecks());
    setSaved({ ...EMPTY_SCORES });
    await onReset?.();
  };

  return <div className="space-y-5">
    {QUESTIONS.map((q) => <section key={q.key} className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold text-accent">{q.title}</h3>
        <span className="text-xs font-bold">{scores[q.key] ?? 0}<span className="text-muted-foreground">/10</span></span>
      </div>
      <div className="rounded-lg border bg-secondary/20 p-4 whitespace-pre-wrap text-sm leading-relaxed">{answers[q.key] || "—"}</div>
      <div className="grid sm:grid-cols-2 gap-1.5 rounded-lg border border-dashed p-3">
        {q.criteria.map((criterion, index) => {
          const checked = (checks[q.key] ?? []).includes(index);
          return <label key={criterion.label} className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs cursor-pointer ${checked ? "bg-emerald/10 font-semibold" : "hover:bg-secondary/40"}`}>
            <input type="checkbox" className="size-4 accent-current" checked={checked} onChange={() => toggle(q.key, index)} />
            <span className="flex-1">{criterion.label}</span>
            <span className="font-bold text-muted-foreground">+{criterion.point}</span>
          </label>;
        })}
      </div>
    </section>)}
    <div className="sticky bottom-0 rounded-lg border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div><div className="text-xs font-semibold text-muted-foreground">Total Nilai</div><div className="text-3xl font-bold">{total}<span className="text-sm text-muted-foreground">/100</span></div></div>
        <div className="text-xs text-right text-muted-foreground">Keputusan akhir tetap ditentukan panitia.</div>
      </div>
      <div className="grid sm:grid-cols-3 gap-2">
        <button disabled={busy} onClick={() => void onSave("interview", scores)} className={`rounded-lg py-2.5 font-bold inline-flex justify-center items-center gap-2 ${currentDecision === "interview" ? "bg-emerald text-primary-foreground" : "border border-emerald text-emerald"}`}><CheckCircle2 className="size-4"/>Lolos ke TKA</button>
        <button disabled={busy} onClick={() => void onSave("rejected", scores)} className={`rounded-lg py-2.5 font-bold inline-flex justify-center items-center gap-2 ${currentDecision === "rejected" ? "bg-destructive text-destructive-foreground" : "border border-destructive text-destructive"}`}><XCircle className="size-4"/>Tidak Lolos</button>
        <button disabled={busy} onClick={() => void onSave("reviewed", scores)} className="rounded-lg border py-2.5 font-semibold">Simpan, Belum Diputuskan</button>
      </div>
      {onReset && <button disabled={busy} onClick={() => void handleReset()}
        className="mt-2 w-full rounded-lg border border-dashed py-2.5 text-sm font-semibold text-muted-foreground inline-flex justify-center items-center gap-2 hover:text-foreground">
        <RotateCcw className="size-4" />Reset Penilaian Peserta Ini
      </button>}
    </div>
  </div>;
}
