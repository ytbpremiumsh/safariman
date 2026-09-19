import { Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarX2 } from "lucide-react";

export function SubmissionClosedCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card border border-amber-300 rounded-3xl p-7 sm:p-10 shadow-soft text-center max-w-xl mx-auto animate-fade-up">
      <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-300 grid place-items-center mx-auto mb-5">
        <CalendarX2 className="size-8 text-amber-700" />
      </div>
      <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-amber-700 mb-2">Tahapan Ditutup</div>
      <h1 className="font-display text-2xl sm:text-3xl font-semibold">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{description}</p>
      <Link
        to="/"
        className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-emerald text-accent px-6 py-3 text-sm font-semibold shadow-emerald hover-lift"
      >
        <ArrowLeft className="size-4" /> Kembali ke Beranda
      </Link>
    </div>
  );
}
