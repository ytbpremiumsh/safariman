import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, KeyRound, CheckCircle2, HeartHandshake, FileText, ClipboardList } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IslamicPattern, GeometricOrnament } from "@/components/IslamicPattern";
import logoSafarIman from "@/assets/logo-safar-iman.png";

const MIN_ESSAY_WORDS = 50;
const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const essayField = (label: string) =>
  z.string().trim().max(3000).refine((v) => countWords(v) >= MIN_ESSAY_WORDS, {
    message: `${label} minimal ${MIN_ESSAY_WORDS} kata`,
  });
const essaySchema = z.object({
  essay_worthy: essayField("Essay 'Kenapa kamu layak dipilih'"),
  essay_dream: essayField("Essay 'Apa impianmu setelah ke Tanah Suci'"),
  essay_contribution: essayField("Essay 'Bagaimana kontribusimu untuk umat'"),
});

const searchSchema = z.object({ code: z.string().optional() });

export const Route = createFileRoute("/essay")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Kirim Essay — Safar Iman" },
      { name: "description", content: "Kirim essay program Safar Iman setelah menunaikan kontribusi." },
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
};

function EssayPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [code, setCode] = useState((search.code ?? "").toUpperCase());
  const [checking, setChecking] = useState(false);
  const [participant, setParticipant] = useState<Participant | null>(null);

  const [d, setD] = useState({ essay_worthy: "", essay_dream: "", essay_contribution: "" });
  const [submitting, setSubmitting] = useState(false);
  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => setD((x) => ({ ...x, [k]: v }));

  const verify = async (autoCode?: string) => {
    const c = (autoCode ?? code).trim().toUpperCase();
    if (c.length < 4) { toast.error("Masukkan kode pendaftaran"); return; }
    setChecking(true);
    try {
      const { data, error } = await supabase.rpc("lookup_participant_by_code", { p_code: c });
      if (error) throw error;
      const row = data?.[0];
      if (!row) { toast.error("Kode tidak ditemukan."); return; }
      setParticipant(row as Participant);
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
      });
      if (error) throw error;
      if (!ok) throw new Error("Kontribusi belum tercatat atau kode tidak valid");

      import("@/lib/wa-notify.functions")
        .then(({ notifyWaEvent }) =>
          notifyWaEvent({ data: { event: "essay", code: code.trim().toUpperCase() } }),
        )
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
            <GeometricOrnament className="w-32 h-8 text-accent mx-auto mb-3 opacity-70" />
            <h1 className="font-display text-3xl sm:text-5xl font-semibold leading-tight">
              Kirim <span className="text-gradient-gold">Essay</span>
            </h1>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Tahap Essay terbuka setelah kamu menunaikan kontribusi. Masukkan kode pendaftaranmu untuk melanjutkan.
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
  d: { essay_worthy: string; essay_dream: string; essay_contribution: string };
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

  if (!participant.has_berkas) {
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

  if (participant.payment_status !== "paid") {
    return (
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-soft animate-fade-up max-w-xl mx-auto space-y-6">
        {header}
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5 text-sm">
          <div className="font-semibold mb-1">Belum bisa mengisi Essay</div>
          <p className="text-muted-foreground">
            Tahap Essay terbuka setelah kamu menunaikan <strong className="text-foreground">kontribusi / donasi</strong>.
            Silakan selesaikan donasi terlebih dahulu, kemudian kembali ke halaman ini.
          </p>
        </div>
        <Link to="/donasi" className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-7 py-4 text-base font-bold shadow-gold hover-lift">
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
      <div className="rounded-2xl bg-emerald/5 border border-emerald/20 p-4 text-sm">
        Tulis essaymu dengan jujur dan reflektif. Semua essay <strong>wajib diisi</strong>, minimal{" "}
        <strong>{MIN_ESSAY_WORDS} kata</strong> per essay.
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

      <button
        onClick={submit}
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-7 py-4 text-base font-bold shadow-gold hover-lift disabled:opacity-60"
      >
        {submitting ? <><Loader2 className="size-4 animate-spin" /> Mengirim...</> : <>Kirim Essay <ArrowRight className="size-4" /></>}
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

function EssayField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const words = countWords(value);
  const ok = words >= MIN_ESSAY_WORDS;
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label} <span className="text-destructive">*</span></Label>
      <Textarea rows={5} value={value} onChange={(e) => onChange(e.target.value)} required />
      <div className={`text-xs mt-1 ${ok ? "text-emerald" : "text-muted-foreground"}`}>
        {words} / {MIN_ESSAY_WORDS} kata {ok && "✓"}
      </div>
    </div>
  );
}
