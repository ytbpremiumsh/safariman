import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Upload, Sparkles, Loader2, KeyRound, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IslamicPattern, GeometricOrnament } from "@/components/IslamicPattern";
import logoSafarIman from "@/assets/logo-safar-iman.png";

const essaySchema = z.object({
  essay_worthy: z.string().trim().min(50, "Essay minimal 50 karakter").max(3000),
  essay_dream: z.string().trim().min(50, "Essay minimal 50 karakter").max(3000),
  essay_contribution: z.string().trim().min(50, "Essay minimal 50 karakter").max(3000),
});

export const Route = createFileRoute("/berkas")({
  head: () => ({
    meta: [
      { title: "Kirim Berkas & Essay — Safar Iman" },
      { name: "description", content: "Kirim berkas program & essay Safar Iman dengan kode pendaftaran." },
    ],
  }),
  component: BerkasPage,
});

type Participant = { id: string; full_name: string; has_berkas: boolean };

function BerkasPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [participant, setParticipant] = useState<Participant | null>(null);

  const [d, setD] = useState({
    essay_worthy: "", essay_dream: "", essay_contribution: "",
  });
  const [cv, setCv] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => setD((x) => ({ ...x, [k]: v }));

  const verify = async () => {
    const c = code.trim().toUpperCase();
    if (c.length < 4) { toast.error("Masukkan kode pendaftaran"); return; }
    setChecking(true);
    try {
      const { data, error } = await supabase.rpc("lookup_participant_by_code", { p_code: c });
      if (error) throw error;
      const row = data?.[0];
      if (!row) { toast.error("Kode tidak ditemukan. Pastikan kamu sudah mendaftar."); return; }
      if (row.has_berkas) { toast.error("Berkas dengan kode ini sudah pernah dikirim."); return; }
      setParticipant(row as Participant);
      toast.success(`Halo ${row.full_name.split(" ")[0]}! Silakan lanjut isi berkas & essay.`);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memverifikasi kode.");
    } finally {
      setChecking(false);
    }
  };

  const submit = async () => {
    if (!participant) return;
    const parsed = essaySchema.safeParse(d);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!cv) { toast.error("CV wajib diupload"); return; }
    if (!photo) { toast.error("Foto wajib diupload"); return; }
    if (cv.size > 5 * 1024 * 1024) { toast.error("CV maksimal 5MB"); return; }
    if (photo.size > 5 * 1024 * 1024) { toast.error("Foto maksimal 5MB"); return; }

    setSubmitting(true);
    try {
      const stamp = Date.now();
      const cvPath = `${participant.id}/${stamp}-${cv.name}`;
      const photoPath = `${participant.id}/${stamp}-${photo.name}`;

      const { error: e1 } = await supabase.storage.from("participant-cv").upload(cvPath, cv);
      if (e1) throw e1;
      const { error: e2 } = await supabase.storage.from("participant-photo").upload(photoPath, photo);
      if (e2) throw e2;
      const photoUrl = supabase.storage.from("participant-photo").getPublicUrl(photoPath).data.publicUrl;

      const { data: ok, error: e3 } = await supabase.rpc("submit_berkas_by_code", {
        p_code: code.trim().toUpperCase(),
        p_cv_url: cvPath,
        p_photo_url: photoUrl,
        p_essay_worthy: parsed.data.essay_worthy,
        p_essay_dream: parsed.data.essay_dream,
        p_essay_contribution: parsed.data.essay_contribution,
      });
      if (e3) throw e3;
      if (!ok) throw new Error("Kode tidak valid");

      // Auto-kirim notifikasi WhatsApp konfirmasi berkas diterima
      fetch("/api/public/wa-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "berkas", code: code.trim().toUpperCase() }),
      }).catch(() => {});

      toast.success("Berkas & essay terkirim. Barakallah!");
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
              Kirim <span className="text-gradient-gold">Berkas & Essay</span>
            </h1>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Masukkan <strong className="text-foreground">Kode Pendaftaran</strong> yang kamu dapat saat daftar,
              lalu lengkapi berkas & essay programmu.
            </p>
          </div>

          {!participant ? (
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
          ) : (
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-soft animate-fade-up space-y-8">
              <div className="flex items-center gap-3 rounded-2xl bg-emerald/10 border border-emerald/30 p-4">
                <CheckCircle2 className="size-5 text-emerald shrink-0" />
                <div className="text-sm">
                  <div className="font-semibold">{participant.full_name}</div>
                  <div className="text-muted-foreground text-xs">Kode: <span className="font-mono">{code.toUpperCase()}</span></div>
                </div>
              </div>

              <div className="rounded-2xl bg-emerald/5 border border-emerald/20 p-4 text-sm">
                Kategori program kamu sudah ditentukan saat pendaftaran. Lengkapi berkas & essay di bawah.
              </div>

              <Section title="Upload Berkas">
                <div className="grid sm:grid-cols-2 gap-5">
                  <FileField label="CV (PDF, max 5MB)" file={cv} setFile={setCv} accept="application/pdf" />
                  <FileField label="Foto (JPG/PNG, max 5MB)" file={photo} setFile={setPhoto} accept="image/*" />
                </div>
              </Section>

              <Section title="Essay Singkat">
                <div className="grid gap-5">
                  <F label="Kenapa kamu layak dipilih?"><Textarea rows={4} value={d.essay_worthy} onChange={(e) => set("essay_worthy", e.target.value)} /></F>
                  <F label="Apa impianmu setelah ke Tanah Suci?"><Textarea rows={4} value={d.essay_dream} onChange={(e) => set("essay_dream", e.target.value)} /></F>
                  <F label="Bagaimana kontribusimu untuk umat?"><Textarea rows={4} value={d.essay_contribution} onChange={(e) => set("essay_contribution", e.target.value)} /></F>
                </div>
              </Section>

              <button
                onClick={submit}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-7 py-4 text-base font-bold shadow-gold hover-lift disabled:opacity-60"
              >
                {submitting ? <><Loader2 className="size-4 animate-spin" /> Mengirim...</> : <>Kirim Berkas & Essay <ArrowRight className="size-4" /></>}
              </button>
            </div>
          )}
        </main>
      </div>
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
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-sm font-medium">{label}</Label>{children}</div>;
}
function FileField({ label, file, setFile, accept }: { label: string; file: File | null; setFile: (f: File | null) => void; accept: string }) {
  return (
    <F label={label}>
      <label className="cursor-pointer block rounded-2xl border-2 border-dashed border-border hover:border-accent p-5 text-center transition">
        <Upload className="size-5 mx-auto text-muted-foreground mb-2" />
        <div className="text-sm">
          {file ? <span className="text-emerald font-medium break-all">{file.name}</span> : <span className="text-muted-foreground">Klik untuk pilih file</span>}
        </div>
        <input type="file" accept={accept} className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
    </F>
  );
}
