import { CheckCircle2, Loader2, RotateCcw, Sparkles, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export type ReviewDecision = "reviewed" | "interview" | "rejected";
export type ReviewScores = Record<string, number>;
export type ReviewChecks = Record<string, number[]>;

type Criterion = { label: string; point: number };
export type AiCriterionRecommendation = { index: number; matched: boolean; confidence: "high" | "medium" | "low"; evidence: string };
export type AiAuthorshipAssessment = { verdict: "likely_human" | "likely_ai" | "uncertain"; confidence: "high" | "medium" | "low"; reason: string };
export type AiReviewRecommendation = { recommendations: Record<string, AiCriterionRecommendation[]>; authorship: Record<string, AiAuthorshipAssessment>; scores: ReviewScores; total_score: number; model: string };

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

type EvidenceHighlight = {
  start: number;
  end: number;
  criterionIndex: number;
  criterionLabel: string;
  confidence: AiCriterionRecommendation["confidence"];
};

function normalizeEvidenceText(value: string) {
  return value
    .trim()
    .replace(/^[\s"'“”‘’`]+|[\s"'“”‘’`]+$/g, "")
    .replace(/^\.{3}|\.{3}$/g, "")
    .trim();
}

function normalizedTextWithSourceMap(value: string) {
  let normalized = "";
  const sourceIndices: number[] = [];
  let previousWasSpace = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (/\s/.test(character)) {
      if (!previousWasSpace) {
        normalized += " ";
        sourceIndices.push(index);
        previousWasSpace = true;
      }
      continue;
    }

    const comparableCharacter = character
      .toLocaleLowerCase("id-ID")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[–—]/g, "-");
    normalized += comparableCharacter;
    sourceIndices.push(index);
    previousWasSpace = false;
  }

  return { normalized, sourceIndices };
}

function compactTextWithSourceMap(value: string) {
  let normalized = "";
  const sourceIndices: number[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const comparableCharacter = value[index]
      .toLocaleLowerCase("id-ID")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (!/[a-z0-9]/.test(comparableCharacter)) continue;
    normalized += comparableCharacter;
    sourceIndices.push(index);
  }

  return { normalized, sourceIndices };
}

function findEvidenceHighlights(answer: string, recommendations: AiCriterionRecommendation[], criteria: Criterion[]) {
  const answerMap = normalizedTextWithSourceMap(answer);
  const highlights: EvidenceHighlight[] = [];

  for (const recommendation of recommendations) {
    if (!recommendation.matched) continue;
    const evidence = normalizeEvidenceText(recommendation.evidence ?? "");
    // Jangan menyorot satu keyword pendek. AI harus memberikan potongan narasi yang cukup untuk dinilai konteksnya.
    if (evidence.length < 12 || evidence.split(/\s+/).length < 3) continue;

    const normalizedEvidence = normalizedTextWithSourceMap(evidence).normalized;
    let normalizedStart = answerMap.normalized.indexOf(normalizedEvidence);
    let sourceMap = answerMap.sourceIndices;
    let evidenceLength = normalizedEvidence.length;

    // Cadangan untuk perbedaan kecil seperti "di sana" vs "disana" atau tanda baca dari respons AI.
    if (normalizedStart < 0) {
      const compactAnswerMap = compactTextWithSourceMap(answer);
      const compactEvidence = compactTextWithSourceMap(evidence).normalized;
      normalizedStart = compactAnswerMap.normalized.indexOf(compactEvidence);
      sourceMap = compactAnswerMap.sourceIndices;
      evidenceLength = compactEvidence.length;
    }
    if (normalizedStart < 0) continue;

    const start = sourceMap[normalizedStart];
    const lastNormalizedIndex = normalizedStart + evidenceLength - 1;
    const end = (sourceMap[lastNormalizedIndex] ?? start) + 1;
    if (start == null || end <= start) continue;

    highlights.push({
      start,
      end,
      criterionIndex: recommendation.index,
      criterionLabel: criteria[recommendation.index]?.label ?? `Kriteria ${recommendation.index + 1}`,
      confidence: recommendation.confidence,
    });
  }

  return highlights;
}

function HighlightedAnswer({ answer, questionKey, recommendations, criteria, focusedEvidence }: {
  answer: string;
  questionKey: string;
  recommendations: AiCriterionRecommendation[];
  criteria: Criterion[];
  focusedEvidence: string | null;
}) {
  const highlights = findEvidenceHighlights(answer, recommendations, criteria);
  if (highlights.length === 0) return <>{answer || "—"}</>;

  const boundaries = Array.from(new Set([0, answer.length, ...highlights.flatMap((item) => [item.start, item.end])])).sort((a, b) => a - b);
  return <>{boundaries.slice(0, -1).map((start, segmentIndex) => {
    const end = boundaries[segmentIndex + 1];
    const active = highlights.filter((item) => item.start <= start && item.end >= end);
    const segment = answer.slice(start, end);
    if (active.length === 0) return <span key={`${start}-${end}`}>{segment}</span>;

    const strongest = active.some((item) => item.confidence === "high") ? "high" : active.some((item) => item.confidence === "medium") ? "medium" : "low";
    const evidenceIds = active.map((item) => `${questionKey}-${item.criterionIndex}`);
    const isFocused = evidenceIds.includes(focusedEvidence ?? "");
    const title = active.map((item) => `${item.criterionLabel} · keyakinan ${item.confidence === "high" ? "tinggi" : item.confidence === "medium" ? "sedang" : "rendah"}`).join("\n");
    const backgroundColor = strongest === "high" ? "#bbf7d0" : strongest === "medium" ? "#fde68a" : "#fef9c3";

    return <mark
      key={`${start}-${end}`}
      data-evidence-ids={evidenceIds.join(" ")}
      title={title}
      style={{ backgroundColor, color: "#052e16", boxShadow: isFocused ? "0 0 0 3px #f59e0b" : undefined }}
      className="rounded-sm px-0.5 font-medium transition-all [box-decoration-break:clone]"
    >{segment}</mark>;
  })}</>;
}

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
  initialAiRecommendation?: AiReviewRecommendation | null;
  initialScores?: ReviewScores | null;
  initialChecks?: ReviewChecks | null;
  initialNotes?: string | null;
  initialMethod?: "manual" | "ai" | null;
  currentDecision: ReviewDecision;
  busy?: boolean;
  onSave: (decision: ReviewDecision, scores: ReviewScores, reviewerNotes: string, criteriaChecks: ReviewChecks, reviewMethod: "manual" | "ai") => Promise<void> | void;
  onReset?: () => Promise<void> | void;
  onAnalyze?: () => Promise<AiReviewRecommendation | null>;
  analyzing?: boolean;
};

export function ManualEssayReview({ answers, initialAiRecommendation, initialScores, initialChecks, initialNotes, initialMethod, currentDecision, busy, onSave, onReset, onAnalyze, analyzing }: Props) {
  const [checks, setChecks] = useState<ReviewChecks>(emptyChecks);
  const [recommendations, setRecommendations] = useState<Record<string, AiCriterionRecommendation[]>>({});
  const [authorship, setAuthorship] = useState<Record<string, AiAuthorshipAssessment>>({});
  const [reviewerNotes, setReviewerNotes] = useState(initialNotes ?? "");
  const [reviewMethod, setReviewMethod] = useState<"manual" | "ai">(initialMethod ?? "manual");
  const [focusedEvidence, setFocusedEvidence] = useState<string | null>(null);

  useEffect(() => {
    const savedRecommendations=initialAiRecommendation?.recommendations??{};
    const recommendedChecks=Object.fromEntries(QUESTIONS.map((question)=>[question.key,
      (savedRecommendations[question.key]??[]).filter((item)=>item.matched&&item.confidence==="high").map((item)=>item.index),
    ])) as ReviewChecks;
    setChecks(initialChecks ? { ...emptyChecks(), ...initialChecks } : initialAiRecommendation ? recommendedChecks : checksFromSavedScores(initialScores));
    setRecommendations(savedRecommendations);
    setAuthorship(initialAiRecommendation?.authorship??{});
    setReviewerNotes(initialNotes ?? "");
    setReviewMethod(initialMethod ?? (initialAiRecommendation?"ai":"manual"));
    setFocusedEvidence(null);
  }, [initialAiRecommendation, initialScores, initialChecks, initialNotes, initialMethod]);

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
    setAuthorship({});
    setReviewerNotes("");
    setReviewMethod("manual");
    setFocusedEvidence(null);
    await onReset?.();
  };

  const handleAnalyze = async () => {
    const result = await onAnalyze?.();
    if (!result) return;
    setRecommendations(result.recommendations);
    setAuthorship(result.authorship ?? {});
    setReviewMethod("ai");
    setChecks(Object.fromEntries(QUESTIONS.map((question) => [question.key,
      (result.recommendations[question.key] ?? []).filter((item) => item.matched && item.confidence === "high").map((item) => item.index),
    ])));
  };

  const focusEvidence = (questionKey: string, criterionIndex: number) => {
    const evidenceId = `${questionKey}-${criterionIndex}`;
    const target = document.querySelector<HTMLElement>(`mark[data-evidence-ids~="${evidenceId}"]`);
    if (!target) return;
    setFocusedEvidence(evidenceId);
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => setFocusedEvidence((current) => current === evidenceId ? null : current), 2200);
  };

  return <div className="space-y-5">
    {onAnalyze && <div className="space-y-2">
      <div className="rounded-lg border bg-secondary/20 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><div className="text-sm font-semibold">Rekomendasi penilaian dengan AI</div><div className="text-xs text-muted-foreground">AI mengusulkan poin dan memperkirakan pola penulisan jawaban. Hasil deteksi AI hanya indikasi, bukan bukti mutlak.</div></div>
        <Button type="button" disabled={busy || analyzing} onClick={() => void handleAnalyze()} className="bg-accent text-primary-foreground shadow-gold hover:bg-accent/90">
          {analyzing ? <Loader2 className="animate-spin" /> : <Sparkles />} {analyzing ? "Menganalisis..." : "Analisis dengan AI"}
        </Button>
      </div>
    </div>}
    {QUESTIONS.map((q) => <section key={q.key} className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold text-accent">{q.title}</h3>
        <span className="text-xs font-bold">{scores[q.key] ?? 0}<span className="text-muted-foreground">/10</span></span>
      </div>
      <div className="rounded-lg border bg-secondary/20 p-4 whitespace-pre-wrap text-sm leading-relaxed">
        <HighlightedAnswer
          answer={answers[q.key] || ""}
          questionKey={q.key}
          recommendations={recommendations[q.key] ?? []}
          criteria={q.criteria}
          focusedEvidence={focusedEvidence}
        />
      </div>
      {authorship[q.key] && <div className={`rounded-md border px-2.5 py-1.5 text-[11px] ${authorship[q.key].verdict === "likely_ai" ? "border-violet-200 bg-violet-50 text-violet-700" : authorship[q.key].verdict === "likely_human" ? "border-emerald/20 bg-emerald/10 text-emerald" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
        <span className="font-bold">{authorship[q.key].verdict === "likely_ai" ? "Indikasi kemungkinan dibantu AI" : authorship[q.key].verdict === "likely_human" ? "Indikasi kemungkinan ditulis sendiri" : "Asal penulisan belum dapat dipastikan"}</span>
        <span className="ml-1 opacity-80">· Keyakinan {authorship[q.key].confidence === "high" ? "tinggi" : authorship[q.key].confidence === "medium" ? "sedang" : "rendah"}</span>
        {authorship[q.key].reason && <div className="mt-0.5 opacity-80">{authorship[q.key].reason}</div>}
      </div>}
      <div className="grid sm:grid-cols-2 gap-1.5 rounded-lg border border-dashed p-3">
        {q.criteria.map((criterion, index) => {
          const checked = (checks[q.key] ?? []).includes(index);
          const suggestion = (recommendations[q.key] ?? []).find((item) => item.index === index && item.matched);
          const hasHighlight = suggestion
            ? findEvidenceHighlights(answers[q.key] || "", [suggestion], q.criteria).length > 0
            : false;
          return <div key={criterion.label} className={`rounded-md px-2 py-1.5 text-xs ${checked ? "bg-emerald/10 font-semibold" : "hover:bg-secondary/40"}`}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="size-4 accent-current" checked={checked} onChange={() => toggle(q.key, index)} />
              <span className="flex-1">{criterion.label}</span>
              <span className="font-bold text-muted-foreground">+{criterion.point}</span>
            </label>
            {suggestion && <button
              type="button"
              disabled={!hasHighlight}
              onClick={() => focusEvidence(q.key, index)}
              title={hasHighlight ? "Klik untuk melihat bagian jawaban yang disorot" : "Kutipan AI tidak ditemukan persis pada jawaban"}
              className={`mt-1 ml-6 block w-[calc(100%-1.5rem)] rounded-md px-2 py-1 text-left text-[11px] ${suggestion.confidence === "high" ? "bg-emerald/10 text-emerald" : "bg-amber-100 text-amber-800"} ${hasHighlight ? "cursor-pointer hover:ring-1 hover:ring-current" : "cursor-default opacity-80"}`}
            >
              {suggestion.confidence === "high" ? "Bukti kuat" : "Perlu diperiksa"}: “{suggestion.evidence}”{hasHighlight && <span className="ml-1 font-semibold">· Lihat highlight</span>}
            </button>}
          </div>;
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
        <button disabled={busy} onClick={() => void onSave("interview", scores, reviewerNotes.trim(), checks, reviewMethod)} className={`rounded-lg py-2.5 font-bold inline-flex justify-center items-center gap-2 ${currentDecision === "interview" ? "bg-emerald text-primary-foreground" : "border border-emerald text-emerald"}`}><CheckCircle2 className="size-4"/>Lolos ke TKA</button>
        <button disabled={busy} onClick={() => void onSave("rejected", scores, reviewerNotes.trim(), checks, reviewMethod)} className={`rounded-lg py-2.5 font-bold inline-flex justify-center items-center gap-2 ${currentDecision === "rejected" ? "bg-destructive text-destructive-foreground" : "border border-destructive text-destructive"}`}><XCircle className="size-4"/>Tidak Lolos</button>
        <button disabled={busy} onClick={() => void onSave("reviewed", scores, reviewerNotes.trim(), checks, reviewMethod)} className="rounded-lg border py-2.5 font-semibold">Simpan, Belum Diputuskan</button>
      </div>
      {onReset && <button disabled={busy} onClick={() => void handleReset()}
        className="mt-2 w-full rounded-lg border border-dashed py-2.5 text-sm font-semibold text-muted-foreground inline-flex justify-center items-center gap-2 hover:text-foreground">
        <RotateCcw className="size-4" />Reset Penilaian Peserta Ini
      </button>}
    </div>
  </div>;
}
