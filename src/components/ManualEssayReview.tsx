import { CheckCircle2, Loader2, RotateCcw, Sparkles, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export type ReviewDecision = "reviewed" | "interview" | "rejected";
export type ReviewScores = Record<string, number>;
export type ReviewChecks = Record<string, number[]>;

type Criterion = { label: string; point: number };
export type AiCriterionRecommendation = { index: number; matched: boolean; confidence: "high" | "medium" | "low"; evidence: string };
export type AiReviewRecommendation = { recommendations: Record<string, AiCriterionRecommendation[]>; scores: ReviewScores; total_score: number; model: string };

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
    title: "Essay 2 — Impian setelah ke Tanah Suci",
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
      { label: "Mencari tempat duduk /  teduh", point: 2 },
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
      { label: "Mengajak berdiskusi", point: 2 },
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
const emptyChecks = () => Object.fromEntries(QUESTIONS.map((q) => [q.key, [] as number[]])) as ReviewChecks;

function checksFromSavedScores(savedScores?: ReviewScores | null): ReviewChecks {
  const restored = emptyChecks();
  if (!savedScores) return restored;
  for (const question of QUESTIONS) {
    const target = savedScores[question.key] ?? 0;
    for (let mask = 0; mask < (1 << question.criteria.length); mask += 1) {
      const indices = question.criteria.map((_, index) => index).filter((index) => (mask & (1 << index)) !== 0);
      const total = indices.reduce((sum, index) => sum + question.criteria[index].point, 0);
      if (total === target) { restored[question.key] = indices; break; }
    }
  }
  return restored;
}

type Props = {
  answers: Record<string, string | null>;
  initialScores?: ReviewScores | null;
  initialChecks?: ReviewChecks | null;
  initialNotes?: string | null;
  currentDecision: ReviewDecision;
  busy?: boolean;
  onSave: (decision: ReviewDecision, scores: ReviewScores, reviewerNotes: string, criteriaChecks: ReviewChecks) => Promise<void> | void;
  onReset?: () => Promise<void> | void;
  onAnalyze?: () => Promise<AiReviewRecommendation | null>;
  analyzing?: boolean;
};

export function ManualEssayReview({ answers, initialScores, initialChecks, initialNotes, currentDecision, busy, onSave, onReset, onAnalyze, analyzing }: Props) {
  const [checks, setChecks] = useState<ReviewChecks>(emptyChecks);
  const [recommendations, setRecommendations] = useState<Record<string, AiCriterionRecommendation[]>>({});
  const [reviewerNotes, setReviewerNotes] = useState(initialNotes ?? "");

  useEffect(() => {
    setChecks(initialChecks ? { ...emptyChecks(), ...initialChecks } : checksFromSavedScores(initialScores));
    setRecommendations({});
    setReviewerNotes(initialNotes ?? "");
  }, [initialScores, initialChecks, initialNotes]);

  const scores = useMemo(() => {
    const next: ReviewScores = { ...EMPTY_SCORES };
    for (const q of QUESTIONS) {
      const picked = checks[q.key] ?? [];
      next[q.key] = Math.min(10, picked.reduce((sum, index) => sum + (q.criteria[index]?.point ?? 0), 0));
    }
    return next;
  }, [checks]);

  const total = useMemo(() => QUESTIONS.reduce((sum, q) => sum + (scores[q.key] ?? 0), 0), [scores]);

  const toggle = (key: string, index: number) =>
    setChecks((previous) => {
      const current = previous[key] ?? [];
      return { ...previous, [key]: current.includes(index) ? current.filter((i) => i !== index) : [...current, index] };
    });

  const handleReset = async () => {
    setChecks(emptyChecks());
    setRecommendations({});
    setReviewerNotes("");
    await onReset?.();
  };

  const handleAnalyze = async () => {
    const result = await onAnalyze?.();
    if (!result) return;
    setRecommendations(result.recommendations);
    setChecks(Object.fromEntries(QUESTIONS.map((question) => [question.key,
      (result.recommendations[question.key] ?? []).filter((item) => item.matched && item.confidence === "high").map((item) => item.index),
    ])));
  };

  return <div className="space-y-5">
    {onAnalyze && <div className="rounded-lg border bg-secondary/20 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div><div className="text-sm font-semibold">Rekomendasi penilaian dengan AI</div><div className="text-xs text-muted-foreground">AI hanya mengusulkan centang berdasarkan bukti. Periksa kembali sebelum menyimpan.</div></div>
      <Button type="button" variant="outline" disabled={busy || analyzing} onClick={() => void handleAnalyze()}>
        {analyzing ? <Loader2 className="animate-spin" /> : <Sparkles />} {analyzing ? "Menganalisis..." : "Analisis dengan AI"}
      </Button>
    </div>}
    {QUESTIONS.map((q) => <section key={q.key} className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold text-accent">{q.title}</h3>
        <span className="text-xs font-bold">{scores[q.key] ?? 0}<span className="text-muted-foreground">/10</span></span>
      </div>
      <div className="rounded-lg border bg-secondary/20 p-4 whitespace-pre-wrap text-sm leading-relaxed">{answers[q.key] || "—"}</div>
      <div className="grid sm:grid-cols-2 gap-1.5 rounded-lg border border-dashed p-3">
        {q.criteria.map((criterion, index) => {
          const checked = (checks[q.key] ?? []).includes(index);
          const suggestion = (recommendations[q.key] ?? []).find((item) => item.index === index && item.matched);
          return <label key={criterion.label} className={`flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5 text-xs cursor-pointer ${checked ? "bg-emerald/10 font-semibold" : "hover:bg-secondary/40"}`}>
            <input type="checkbox" className="size-4 accent-current" checked={checked} onChange={() => toggle(q.key, index)} />
            <span className="flex-1">{criterion.label}</span>
            <span className="font-bold text-muted-foreground">+{criterion.point}</span>
            {suggestion && <span className={`basis-full ml-6 rounded-md px-2 py-1 text-[11px] ${suggestion.confidence === "high" ? "bg-emerald/10 text-emerald" : "bg-amber-100 text-amber-800"}`}>
              {suggestion.confidence === "high" ? "Bukti kuat" : "Perlu diperiksa"}: “{suggestion.evidence}”
            </span>}
          </label>;
        })}
      </div>
    </section>)}
    <section className="space-y-2 rounded-lg border bg-secondary/20 p-4">
      <label htmlFor="reviewer-notes" className="text-sm font-bold">Keterangan Pengoreksi <span className="font-normal text-muted-foreground">(Opsional)</span></label>
      <textarea id="reviewer-notes" value={reviewerNotes} onChange={(event) => setReviewerNotes(event.target.value)} maxLength={2000} rows={4}
        placeholder="Tambahkan catatan, pertimbangan, atau hal yang perlu diperhatikan tentang peserta ini..."
        className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      <div className="text-right text-[11px] text-muted-foreground">{reviewerNotes.length}/2000 karakter</div>
    </section>
    <div className="sticky bottom-0 rounded-lg border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div><div className="text-xs font-semibold text-muted-foreground">Total Nilai</div><div className="text-3xl font-bold">{total}<span className="text-sm text-muted-foreground">/100</span></div></div>
        <div className="text-xs text-right text-muted-foreground">Keputusan akhir tetap ditentukan panitia.</div>
      </div>
      <div className="grid sm:grid-cols-3 gap-2">
        <button disabled={busy} onClick={() => void onSave("interview", scores, reviewerNotes.trim(), checks)} className={`rounded-lg py-2.5 font-bold inline-flex justify-center items-center gap-2 ${currentDecision === "interview" ? "bg-emerald text-primary-foreground" : "border border-emerald text-emerald"}`}><CheckCircle2 className="size-4"/>Lolos ke TKA</button>
        <button disabled={busy} onClick={() => void onSave("rejected", scores, reviewerNotes.trim(), checks)} className={`rounded-lg py-2.5 font-bold inline-flex justify-center items-center gap-2 ${currentDecision === "rejected" ? "bg-destructive text-destructive-foreground" : "border border-destructive text-destructive"}`}><XCircle className="size-4"/>Tidak Lolos</button>
        <button disabled={busy} onClick={() => void onSave("reviewed", scores, reviewerNotes.trim(), checks)} className="rounded-lg border py-2.5 font-semibold">Simpan, Belum Diputuskan</button>
      </div>
      {onReset && <button disabled={busy} onClick={() => void handleReset()}
        className="mt-2 w-full rounded-lg border border-dashed py-2.5 text-sm font-semibold text-muted-foreground inline-flex justify-center items-center gap-2 hover:text-foreground">
        <RotateCcw className="size-4" />Reset Penilaian Peserta Ini
      </button>}
    </div>
  </div>;
}
