import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Link2, Loader2, KeyRound, CheckCircle2, Info, HeartHandshake, FileText, Sparkles } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IslamicPattern, GeometricOrnament } from "@/components/IslamicPattern";
import logoSafarIman from "@/assets/logo-safar-iman.png";

const urlSchema = z.string().trim().url("Harus berupa link valid (https://...)").max(500);
const linksSchema = z.object({
  identitas: urlSchema,
  sertifikat: urlSchema,
  portofolio: urlSchema,
});
const textsSchema = z.object({
  pengalaman_sosial: z.string().trim().min(30, "Pengalaman Sosial minimal 30 karakter").max(3000),
  skill: z.string().trim().min(20, "Skill minimal 20 karakter").max(2000),
});

export const Route = createFileRoute("/berkas")({
  head: () => ({
    meta: [
      { title: "Kirim Berkas — Safar Iman" },
      { name: "description", content: "Kirim berkas pendukung program Safar Iman dengan kode pendaftaran." },
    ],
  }),
  component: BerkasPage,
});

type Participant = {
  id: string;
  full_name: string;
  has_berkas: boolean;
  has_essay: boolean;
  status: string;
  payment_status: string;
  category: string | null;
};

const isFastTrack = (cat: string | null | undefined) =>
  cat === "gelombang_1" || cat === "gelombang_2";
const fastTrackLabel = (cat: string | null | undefined) =>
  cat === "gelombang_1" ? "Fast Track Gelombang 1" : "Fast Track Gelombang 2";

function BerkasPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [participant, setParticipant] = useState<Participant | null>(null);

  const [links, setLinks] = useState({ identitas: "", sertifikat: "", portofolio: "" });
  const [texts, setTexts] = useState({ pengalaman_sosial: "", skill: "" });
  const [submitting, setSubmitting] = useState(false);

  const setLink = <K extends keyof typeof links,>(k: K, v: string) => setLinks((x) => ({ ...x, [k]: v }));
  const setText = <K extends keyof typeof texts,>(k: K, v: string) => setTexts((x) => ({ ...x, [k]: v }));

  const verify = async () => {
    const c = code.trim().toUpperCase();
    if (c.length < 4) { toast.error("Masukkan kode pendaftaran"); return; }
    setChecking(true);
    try {
      const [{ data, error }, { data: payData }] = await Promise.all([
        supabase.rpc("lookup_participant_by_code", { p_code: c }),
        supabase.rpc("lookup_payment_status_by_code", { p_code: c }),
      ]);
      if (error) throw error;
      const row = data?.[0];
      if (!row) { toast.error("Kode tidak ditemukan. Pastikan kamu sudah mendaftar."); return; }
      const category = (payData?.[0]?.category as string | null) ?? null;
      setParticipant({ ...(row as Omit<Participant, "category">), category });
    } catch (e) {
      console.error(e);
      toast.error("Gagal memverifikasi kode.");
    } finally {
      setChecking(false);
    }
  };

  const submit = async () => {
    if (!participant) return;
    const parsedTexts = textsSchema.safeParse(texts);
    if (!parsedTexts.success) { toast.error(parsedTexts.error.issues[0].message); return; }
    const parsedLinks = linksSchema.safeParse(links);
    if (!parsedLinks.success) { toast.error("Semua link Google Drive wajib diisi dengan link valid"); return; }

    setSubmitting(true);
    try {
      const cvPayload = JSON.stringify({
        pengalaman_sosial: parsedTexts.data.pengalaman_sosial,
        skill: parsedTexts.data.skill,
        sertifikat: parsedLinks.data.sertifikat,
        portofolio: parsedLinks.data.portofolio,
      });

      const { data: ok, error } = await supabase.rpc("submit_berkas_by_code", {
        p_code: code.trim().toUpperCase(),
        p_cv_url: cvPayload,
        p_photo_url: parsedLinks.data.identitas,
      });
      if (error) throw error;
      if (!ok) throw new Error("Kode tidak valid");

      import("@/lib/wa-notify.functions")
        .then(({ notifyWaEvent }) =>
          notifyWaEvent({ data: { event: "berkas", code: code.trim().toUpperCase() } }),
        )
        .catch(() => {});

      toast.success("Berkas terkirim. Barakallah!");
      navigate({ to: "/sukses" });
    } catch (e) {
      console.error(e);
      toast.error("Gagal mengirim. Coba lagi.");
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
              Kirim <span className="text-gradient-gold">Berkas</span>
            </h1>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Masukkan <strong className="text-foreground">Kode Pendaftaran</strong> yang kamu dapat saat daftar,
              lalu lengkapi berkas pendukungmu.
            </p>
          </div>

          {!participant ? (
            <CodeForm code={code} setCode={setCode} checking={checking} verify={verify} />
          ) : participant.has_berkas ? (
            <AlreadySubmittedCard
              participant={participant}
              code={code.toUpperCase()}
              onReset={() => { setParticipant(null); setCode(""); }}
            />
          ) : isFastTrack(participant.category) ? (
            <FastTrackCard
              participant={participant}
              code={code.toUpperCase()}
              onReset={() => { setParticipant(null); setCode(""); }}
            />
          ) : (
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-soft animate-fade-up space-y-8">
              <div className="flex items-center gap-3 rounded-2xl bg-emerald/10 border border-emerald/30 p-4">
                <CheckCircle2 className="size-5 text-emerald shrink-0" />
                <div className="text-sm">
                  <div className="font-semibold">{participant.full_name}</div>
                  <div className="text-muted-foreground text-xs">Kode: <span className="font-mono">{code.toUpperCase()}</span></div>
                </div>
              </div>

              <Section title="Data & Berkas Pendukung">
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3 text-xs flex gap-2 mb-4">
                  <Info className="size-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    Untuk berkas berupa file, upload dulu ke <strong>Google Drive</strong> kamu lalu paste link nya.
                    Pastikan akses link <strong>"Anyone with the link can view"</strong>.
                  </div>
                </div>
                <div className="grid gap-5">
                  <LinkField label="Identitas Diri" hint="KTP / KTM / Kartu Pelajar" value={links.identitas} onChange={(v) => setLink("identitas", v)} required />
                  <TextAreaField label="Pengalaman Sosial" hint="Ceritakan pengalaman organisasi / kegiatan sosial kamu" value={texts.pengalaman_sosial} onChange={(v) => setText("pengalaman_sosial", v)} rows={4} required />
                  <TextAreaField label="Skill" hint="Sebutkan skill / kemampuan yang kamu kuasai" value={texts.skill} onChange={(v) => setText("skill", v)} rows={3} required />
                  <LinkField label="Sertifikat Pendukung" hint="Folder Google Drive berisi sertifikat-sertifikat kamu" value={links.sertifikat} onChange={(v) => setLink("sertifikat", v)} required />
                  <LinkField label="Portofolio Kegiatan" hint="Folder Google Drive berisi dokumentasi kegiatan kamu" value={links.portofolio} onChange={(v) => setLink("portofolio", v)} required />
                </div>
              </Section>

              <button
                onClick={submit}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-7 py-4 text-base font-bold shadow-gold hover-lift disabled:opacity-60"
              >
                {submitting ? <><Loader2 className="size-4 animate-spin" /> Mengirim...</> : <>Kirim Berkas <ArrowRight className="size-4" /></>}
              </button>
            </div>
          )}
        </main>
      </div>
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
        Belum daftar? <Link to="/daftar" className="text-accent underline">Daftar di sini</Link>.
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

function AlreadySubmittedCard({ participant, code, onReset }: { participant: Participant; code: string; onReset: () => void }) {
  const paid = participant.payment_status === "paid";
  return (
    <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-soft animate-fade-up max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3 rounded-2xl bg-emerald/10 border border-emerald/30 p-4">
        <CheckCircle2 className="size-5 text-emerald shrink-0" />
        <div className="text-sm">
          <div className="font-semibold">{participant.full_name}</div>
          <div className="text-muted-foreground text-xs">Kode: <span className="font-mono">{code}</span></div>
        </div>
      </div>

      <div className="text-center">
        <div className="size-14 rounded-2xl bg-gradient-gold grid place-items-center mx-auto mb-4 shadow-gold">
          <CheckCircle2 className="size-7 text-emerald-deep" />
        </div>
        <h3 className="font-display text-2xl font-semibold">Berkas kamu sudah masuk</h3>
        <p className="text-muted-foreground text-sm mt-2">
          Kami sudah menerima berkas pendukungmu. Berikut langkah selanjutnya:
        </p>
      </div>

      {paid ? (
        participant.has_essay ? (
          <div className="rounded-2xl bg-emerald/10 border border-emerald/30 p-5 text-sm text-center">
            <div className="font-semibold mb-1">Semua tahap sudah selesai</div>
            <p className="text-muted-foreground">
              Berkas, kontribusi, dan essay sudah lengkap. Tunggu pengumuman seleksi berikutnya, ya.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-gradient-emerald p-6 text-center">
              <div className="text-accent text-xs uppercase tracking-[0.2em] font-bold mb-2">Kontribusi sudah tertunai</div>
              <div className="font-display text-white text-xl leading-snug">Lanjut ke tahap pengisian Essay</div>
            </div>
            <Link
              to="/essay"
              search={{ code }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-7 py-4 text-base font-bold shadow-gold hover-lift"
            >
              <FileText className="size-5" /> Isi Essay Sekarang <ArrowRight className="size-4" />
            </Link>
          </>
        )
      ) : (
        <>
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5 text-sm">
            <div className="font-semibold mb-1">Belum bisa lanjut ke Essay</div>
            <p className="text-muted-foreground">
              Tahap Essay terbuka setelah kamu dinyatakan lolos seleksi administrasi
              dan menunaikan <strong className="text-foreground">kontribusi / donasi</strong> terlebih dahulu.
            </p>
          </div>
          <Link
            to="/donasi"
            search={{ code }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-emerald text-accent px-7 py-4 text-base font-bold shadow-emerald hover-lift"
          >
            <HeartHandshake className="size-5" /> Tunaikan Kontribusi <ArrowRight className="size-4" />
          </Link>
        </>
      )}

      <button onClick={onReset} className="w-full text-xs text-muted-foreground hover:text-foreground underline">
        Cek kode lain
      </button>
    </div>
  );
}

function FastTrackCard({ participant, code, onReset }: { participant: Participant; code: string; onReset: () => void }) {
  const paid = participant.payment_status === "paid";
  return (
    <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-soft animate-fade-up max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3 rounded-2xl bg-emerald/10 border border-emerald/30 p-4">
        <CheckCircle2 className="size-5 text-emerald shrink-0" />
        <div className="text-sm">
          <div className="font-semibold">{participant.full_name}</div>
          <div className="text-muted-foreground text-xs">Kode: <span className="font-mono">{code}</span></div>
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-gold border border-accent/40 p-5 shadow-gold">
        <div className="flex items-start gap-3">
          <Sparkles className="size-5 text-emerald-deep shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-emerald-deep/80">
              Jalur {fastTrackLabel(participant.category)}
            </div>
            <div className="font-display text-lg font-semibold text-emerald-deep leading-snug">
              Alhamdulillah, kamu masuk jalur Fast Track.
            </div>
            <p className="text-sm text-emerald-deep/90">
              Tidak perlu mengirim berkas. {paid
                ? <>Kontribusimu sudah tertunai — silakan lanjut langsung ke tahap <strong>Essay</strong>.</>
                : <>Pastikan kamu sudah menunaikan <strong>kontribusi / donasi</strong> terlebih dahulu, lalu lanjut ke tahap <strong>Essay</strong>.</>}
            </p>
          </div>
        </div>
      </div>

      {paid ? (
        <Link
          to="/essay"
          search={{ code }}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-7 py-4 text-base font-bold shadow-gold hover-lift"
        >
          <FileText className="size-5" /> Isi Essay Sekarang <ArrowRight className="size-4" />
        </Link>
      ) : (
        <Link
          to="/donasi"
          search={{ code }}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-emerald text-accent px-7 py-4 text-base font-bold shadow-emerald hover-lift"
        >
          <HeartHandshake className="size-5" /> Tunaikan Kontribusi Dulu <ArrowRight className="size-4" />
        </Link>
      )}

      <button onClick={onReset} className="w-full text-xs text-muted-foreground hover:text-foreground underline">
        Cek kode lain
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-accent" /> {title}
      </h2>
      {children}
    </div>
  );
}
function FieldShell({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        {hint && <span className="text-xs text-muted-foreground">— {hint}</span>}
      </div>
      {children}
    </div>
  );
}
function LinkField({ label, hint, value, onChange, required }: { label: string; hint?: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <FieldShell label={label} hint={hint} required={required}>
      <div className="relative">
        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input type="url" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Link Google Drive" className="pl-9" required={required} />
      </div>
    </FieldShell>
  );
}
function TextAreaField({ label, hint, value, onChange, rows = 4, required }: { label: string; hint?: string; value: string; onChange: (v: string) => void; rows?: number; required?: boolean }) {
  return (
    <FieldShell label={label} hint={hint} required={required}>
      <Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </FieldShell>
  );
}
