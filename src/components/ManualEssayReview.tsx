import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

export type ReviewDecision = "reviewed" | "interview" | "rejected";
export type ReviewScores = Record<string, number>;

const QUESTIONS = [
  ["essay_1", "Essay 1 — Kenapa layak dipilih?"],
  ["essay_2", "Essay 2 — Mimpi setelah Umrah"],
  ["essay_3", "Essay 3 — Kontribusi untuk umat"],
  ["case_1", "Studi Kasus 1"], ["case_2", "Studi Kasus 2"],
  ["case_3", "Studi Kasus 3"], ["case_4", "Studi Kasus 4"],
  ["case_5", "Studi Kasus 5"], ["case_6", "Studi Kasus 6"],
  ["case_7", "Studi Kasus 7"],
] as const;

const EMPTY_SCORES = Object.fromEntries(QUESTIONS.map(([key]) => [key, 0])) as ReviewScores;

type Props = {
  answers: Record<string, string | null>;
  initialScores?: ReviewScores | null;
  currentDecision: ReviewDecision;
  busy?: boolean;
  onSave: (decision: ReviewDecision, scores: ReviewScores) => Promise<void> | void;
  onReset?: () => Promise<void> | void;
};

export function ManualEssayReview({ answers, initialScores, currentDecision, busy, onSave, onReset }: Props) {
  const [scores, setScores] = useState<ReviewScores>(EMPTY_SCORES);
  useEffect(() => setScores({ ...EMPTY_SCORES, ...(initialScores ?? {}) }), [initialScores]);
  const total = useMemo(() => QUESTIONS.reduce((sum, [key]) => sum + (scores[key] ?? 0), 0), [scores]);
  const setScore = (key: string, raw: string) => {
    const parsed = Number(raw);
    setScores((previous) => ({ ...previous, [key]: Number.isFinite(parsed) ? Math.min(10, Math.max(0, Math.trunc(parsed))) : 0 }));
  };
  const handleReset = async () => {
    setScores({ ...EMPTY_SCORES });
    await onReset?.();
  };

  return <div className="space-y-5">
    {QUESTIONS.map(([key, title]) => <section key={key} className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold text-accent">{title}</h3>
        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          Poin
          <Input aria-label={`Poin ${title}`} type="number" min={0} max={10} step={1} value={scores[key] ?? 0}
            onChange={(event) => setScore(key, event.target.value)} className="h-9 w-20 text-center" />
          <span>/10</span>
        </label>
      </div>
      <div className="rounded-lg border bg-secondary/20 p-4 whitespace-pre-wrap text-sm leading-relaxed">{answers[key] || "—"}</div>
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
