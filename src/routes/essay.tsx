import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, KeyRound, CheckCircle2, HeartHandshake, FileText, ClipboardList, Sparkles } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IslamicPattern, GeometricOrnament } from "@/components/IslamicPattern";
import logoSafarIman from "@/assets/logo-safar-iman.png";

const MIN_ESSAY_WORDS = 50;
const MIN_CASE_WORDS = 30;
const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const essayField = (label: string, min = MIN_ESSAY_WORDS) =>
  z.string().trim().max(3000).refine((v) => countWords(v) >= min, {
    message: `${label} minimal ${min} kata`,
  });
const essaySchema = z.object({
  essay_worthy: essayField("Essay 'Kenapa kamu layak dipilih'"),
  essay_dream: essayField("Essay 'Apa impianmu setelah ke Tanah Suci'"),
  essay_contribution: essayField("Essay 'Bagaimana kontribusimu untuk umat'"),
  case_study_1: essayField("Studi Kasus 1", MIN_CASE_WORDS),
  case_study_2: essayField("Studi Kasus 2", MIN_CASE_WORDS),
});


const searchSchema = z.object({ code: z.string().optional() });

export const Route = createFileRoute("/essay")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Kirim Essay dan Study Kasus — Safar Iman" },
      { name: "description", content: "Kirim essay dan study kasus program Safar Iman setelah menunaikan kontribusi." },
    ],
  }),

  component: EssayPage,
});

type Participant = {
  id: string;
  full_name: string;
  has_berkas: boolean;
  has_essay: boolean;
  status: string;
  payment_status: string;
  donation_status: string;
  category: string | null;
};

const isFastTrack = (cat: string | null | undefined) =>
  cat === "gelombang_1" || cat === "gelombang_2";
const fastTrackLabel = (cat: string | null | undefined) =>
  cat === "gelombang_1" ? "Fast Track Gelombang 1" : "Fast Track Gelombang 2";

function EssayPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [code, setCode] = useState((search.code ?? "").toUpperCase());
  const [checking, setChecking] = useState(false);
  const [participant, setParticipant] = useState<Participant | null>(null);

  const [d, setD] = useState({ essay_worthy: "", essay_dream: "", essay_contribution: "", case_study_1: "", case_study_2: "" });
  const [submitting, setSubmitting] = useState(false);
  const set = <K extends keyof typeof d,>(k: K, v: (typeof d)[K]) => setD((x) => ({ ...x, [k]: v }));


  const verify = async (autoCode?: string) => {
    const c = (autoCode ?? code).trim().toUpperCase();
    if (c.length < 4) { toast.error("Masukkan kode pendaftaran"); return; }
    setChecking(true);
    try {
      const [{ data, error }, { data: payData }] = await Promise.all([
        supabase.rpc("lookup_participant_by_code", { p_code: c }),
        supabase.rpc("lookup_payment_status_by_code", { p_code: c }),
      ]);
      if (error) throw error;
      const row = data?.[0];
      if (!row) { toast.error("Kode tidak ditemukan."); return; }
      const category = (payData?.[0]?.category as string | null) ?? null;
      setParticipant({ ...(row as Omit<Participant, "category">), category });
    } catch (e) {
      console.error(e);
      toast.error("Gagal memverifikasi kode.");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (search.code && !participant) verify(search.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    if (!participant) return;
    const parsed = essaySchema.safeParse(d);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

    setSubmitting(true);
    try {
      const { data: ok, error } = await supabase.rpc("submit_essay_by_code", {
        p_code: code.trim().toUpperCase(),
        p_essay_worthy: parsed.data.essay_worthy,
        p_essay_dream: parsed.data.essay_dream,
        p_essay_contribution: parsed.data.essay_contribution,
        p_case_study_1: parsed.data.case_study_1,
        p_case_study_2: parsed.data.case_study_2,
      });

      if (error) throw error;
      if (!ok) throw new Error("Kontribusi belum tercatat atau kode tidak valid");

      import("@/lib/api")
        .then(({ notifyWa, notifyEmail }) => {
          const c = code.trim().toUpperCase();
          notifyWa("essay", c).catch(() => {});
          notifyEmail("essay", c).catch(() => {});
        })
        .catch(() => {});

      toast.success("Essay terkirim. Barakallah!");
      navigate({ to: "/sukses" });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Gagal mengirim. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/40 via-background to-secondary/30 relative">
      <IslamicPattern className="absolute inset-0 size-full text-emerald/5" />
      <div className="relative">
        <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img src={logoSafarIman} alt="Safar Iman" className="h-10 sm:h-11 w-auto" />
            </Link>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="size-4" /> Beranda
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-16">
          <div className="text-center mb-10 animate-fade-up">
            <div className="flex justify-center mb-8">
              <Link
                to="/kontribusi"
                className="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 backdrop-blur px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-accent/50 hover:bg-card transition-all shadow-sm hover:shadow-md"
              >
                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" /> Kembali
              </Link>
            </div>
            <GeometricOrnament className="w-32 h-8 text-accent mx-auto mb-3 opacity-70" />
            <h1 className="font-display text-3xl sm:text-5xl font-semibold leading-tight">
              Kirim <span className="text-gradient-gold">Essay dan Study Kasus</span>
            </h1>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Tahap Essay & Study Kasus terbuka setelah kamu menunaikan kontribusi. Masukkan kode pendaftaranmu untuk melanjutkan.
            </p>

          </div>

          {!participant ? (
            <CodeForm code={code} setCode={setCode} checking={checking} verify={() => verify()} />
          ) : (
            <BodyByStatus
              participant={participant}
              code={code.toUpperCase()}
              d={d}
              set={set}
              submit={submit}
              submitting={submitting}
              onReset={() => { setParticipant(null); setCode(""); }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function BodyByStatus({
  participant, code, d, set, submit, submitting, onReset,
}: {
  participant: Participant;
  code: string;
  d: { essay_worthy: string; essay_dream: string; essay_contribution: string; case_study_1: string; case_study_2: string };
  set: <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => void;

  submit: () => void;
  submitting: boolean;
  onReset: () => void;
}) {
  const header = (
    <div className="flex items-center gap-3 rounded-2xl bg-emerald/10 border border-emerald/30 p-4">
      <CheckCircle2 className="size-5 text-emerald shrink-0" />
      <div className="text-sm">
        <div className="font-semibold">{participant.full_name}</div>
        <div className="text-muted-foreground text-xs">Kode: <span className="font-mono">{code}</span></div>
      </div>
    </div>
  );

  const fastTrack = isFastTrack(participant.category);
  const paid = participant.donation_status === "paid";
  const fastTrackBanner = fastTrack ? (
    <div className="rounded-2xl bg-gradient-gold border border-accent/40 p-5 shadow-gold">
      <div className="flex items-start gap-3">
        <Sparkles className="size-5 text-emerald-deep shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-emerald-deep/80">
            Jalur {fastTrackLabel(participant.category)}
          </div>
          <div className="font-display text-lg font-semibold text-emerald-deep leading-snug">
            Berkas otomatis terkonfirmasi.
          </div>
          <p className="text-sm text-emerald-deep/90">
            {paid
              ? "Kontribusi sudah tercatat. Silakan lanjut isi essay di bawah."
              : "Sebelum mengisi essay, kamu wajib menunaikan kontribusi / donasi terlebih dahulu — sama seperti jalur reguler."}
          </p>
        </div>
      </div>
    </div>
  ) : null;

  if (!fastTrack && !participant.has_berkas) {
    return (
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-soft animate-fade-up max-w-xl mx-auto space-y-6">
        {header}
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5 text-sm">
          <div className="font-semibold mb-1">Kirim berkas dulu</div>
          <p className="text-muted-foreground">Kamu belum mengirim berkas pendukung. Silakan lengkapi tahap berkas terlebih dahulu.</p>
        </div>
        <Link to="/berkas" className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-emerald text-accent px-7 py-4 text-base font-bold shadow-emerald hover-lift">
          <ClipboardList className="size-5" /> Kirim Berkas <ArrowRight className="size-4" />
        </Link>
        <button onClick={onReset} className="w-full text-xs text-muted-foreground hover:text-foreground underline">Cek kode lain</button>
      </div>
    );
  }

  if (!paid) {
    return (
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-soft animate-fade-up max-w-xl mx-auto space-y-6">
        {header}
        {fastTrackBanner}
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5 text-sm">
          <div className="font-semibold mb-1">Belum bisa mengisi Essay</div>
          <p className="text-muted-foreground">
            Tahap Essay terbuka setelah kamu menunaikan <strong className="text-foreground">kontribusi / donasi</strong>.
            Silakan selesaikan donasi terlebih dahulu, kemudian kembali ke halaman ini.
          </p>
        </div>
        <Link to="/kontribusi" className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-7 py-4 text-base font-bold shadow-gold hover-lift">
          <HeartHandshake className="size-5" /> Tunaikan Kontribusi <ArrowRight className="size-4" />
        </Link>
        <button onClick={onReset} className="w-full text-xs text-muted-foreground hover:text-foreground underline">Cek kode lain</button>
      </div>
    );
  }

  if (participant.has_essay) {
    return (
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-soft animate-fade-up max-w-xl mx-auto space-y-6 text-center">
        {header}
        <div className="size-14 rounded-2xl bg-gradient-gold grid place-items-center mx-auto shadow-gold">
          <CheckCircle2 className="size-7 text-emerald-deep" />
        </div>
        <h3 className="font-display text-2xl font-semibold">Essay kamu sudah masuk</h3>
        <p className="text-muted-foreground text-sm">Semua tahap sudah lengkap. Tunggu pengumuman seleksi berikutnya, ya.</p>
        <button onClick={onReset} className="w-full text-xs text-muted-foreground hover:text-foreground underline">Cek kode lain</button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-soft animate-fade-up space-y-8">
      {header}
      {fastTrackBanner}
      <div className="rounded-2xl bg-emerald/5 border border-emerald/20 p-4 text-sm">
        Tulis essay & jawaban studi kasusmu dengan jujur dan reflektif. Semua bagian <strong>wajib diisi</strong> — essay minimal{" "}
        <strong>{MIN_ESSAY_WORDS} kata</strong>, studi kasus minimal <strong>{MIN_CASE_WORDS} kata</strong>.
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="size-5 text-accent" /> Essay Singkat
        </h2>
        <div className="grid gap-5">
          <EssayField label="Kenapa kamu layak dipilih?" value={d.essay_worthy} onChange={(v) => set("essay_worthy", v)} />
          <EssayField label="Apa impianmu setelah ke Tanah Suci?" value={d.essay_dream} onChange={(v) => set("essay_dream", v)} />
          <EssayField label="Bagaimana kontribusimu untuk umat?" value={d.essay_contribution} onChange={(v) => set("essay_contribution", v)} />
        </div>
      </div>

      <div className="pt-2 border-t border-border/60">
        <h2 className="font-display text-xl font-semibold mb-2 flex items-center gap-2">
          <ClipboardList className="size-5 text-accent" /> Studi Kasus
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Bagian terpisah dari essay. Jawab kedua studi kasus berikut dengan jelas dan reflektif.
        </p>
        <div className="grid gap-5">
          <EssayField
            label="Studi Kasus 1: Saat di Tanah Suci, kamu kehilangan rombongan dan tidak membawa ponsel. Apa langkah pertama yang akan kamu lakukan?"
            value={d.case_study_1}
            onChange={(v) => set("case_study_1", v)}
            min={MIN_CASE_WORDS}
          />
          <EssayField
            label="Studi Kasus 2: Seorang jamaah lansia dalam rombongan terlihat kelelahan dan enggan melanjutkan ibadah. Bagaimana sikap dan tindakanmu?"
            value={d.case_study_2}
            onChange={(v) => set("case_study_2", v)}
            min={MIN_CASE_WORDS}
          />
        </div>
      </div>

      <button
        onClick={submit}
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-7 py-4 text-base font-bold shadow-gold hover-lift disabled:opacity-60"
      >
        {submitting ? <><Loader2 className="size-4 animate-spin" /> Mengirim...</> : <>Kirim Essay & Studi Kasus <ArrowRight className="size-4" /></>}
      </button>

    </div>
  );
}

function CodeForm({ code, setCode, checking, verify }: { code: string; setCode: (v: string) => void; checking: boolean; verify: () => void }) {
  return (
    <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-soft animate-fade-up max-w-xl mx-auto">
      <div className="size-14 rounded-2xl bg-gradient-emerald grid place-items-center mx-auto mb-5 shadow-emerald">
        <KeyRound className="size-6 text-accent" />
      </div>
      <h2 className="font-display text-2xl font-semibold text-center mb-2">Masukkan Kode Pendaftaran</h2>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Sudah donasi tapi belum kirim berkas? <Link to="/berkas" className="text-accent underline">Ke halaman berkas</Link>.
      </p>
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === "Enter" && verify()}
        placeholder="CONTOH: HXP-A1B2C3D4"
        className="text-center font-mono text-lg tracking-[0.15em] h-14 uppercase"
        maxLength={16}
      />
      <button
        onClick={verify}
        disabled={checking}
        className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-emerald text-accent px-7 py-3.5 text-sm font-bold shadow-emerald hover-lift disabled:opacity-60"
      >
        {checking ? <><Loader2 className="size-4 animate-spin" /> Memverifikasi...</> : <>Verifikasi Kode <ArrowRight className="size-4" /></>}
      </button>
    </div>
  );
}

function EssayField({ label, value, onChange, min = MIN_ESSAY_WORDS }: { label: string; value: string; onChange: (v: string) => void; min?: number }) {
  const words = countWords(value);
  const ok = words >= min;
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label} <span className="text-destructive">*</span></Label>
      <Textarea rows={5} value={value} onChange={(e) => onChange(e.target.value)} required />
      <div className={`text-xs mt-1 ${ok ? "text-emerald" : "text-muted-foreground"}`}>
        {words} / {min} kata {ok && "✓"}
      </div>
    </div>
  );
}

