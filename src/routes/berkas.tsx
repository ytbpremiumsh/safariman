import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Upload, Sparkles, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IslamicPattern, GeometricOrnament } from "@/components/IslamicPattern";

type Cat = "fully_funded" | "partial_funded" | "self_funded";

const CATS: { v: Cat; t: string; d: string }[] = [
  { v: "fully_funded", t: "Fully Funded", d: "Gratis total — 3 kuota" },
  { v: "partial_funded", t: "Partial Funded", d: "Subsidi Rp2.000.000 — 30 kuota" },
  { v: "self_funded", t: "Self Funded", d: "Jalur mandiri — 10 kuota" },
];

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  whatsapp: z.string().trim().min(8).max(20),
  gender: z.string().min(1),
  birth_date: z.string().min(1),
  city: z.string().trim().min(2).max(100),
  education: z.string().trim().min(2).max(100),
  occupation: z.string().trim().min(2).max(100),
  category: z.enum(["fully_funded", "partial_funded", "self_funded"]),
  essay_worthy: z.string().trim().min(50, "Essay minimal 50 karakter").max(3000),
  essay_dream: z.string().trim().min(50, "Essay minimal 50 karakter").max(3000),
  essay_contribution: z.string().trim().min(50, "Essay minimal 50 karakter").max(3000),
});

export const Route = createFileRoute("/berkas")({
  head: () => ({
    meta: [
      { title: "Kirim Berkas — Safar Iman" },
      { name: "description", content: "Kirim berkas program Safar Iman: CV, foto, dan essay." },
    ],
  }),
  component: BerkasPage,
});

function BerkasPage() {
  const navigate = useNavigate();
  const [d, setD] = useState({
    full_name: "", email: "", whatsapp: "", gender: "", birth_date: "",
    city: "", education: "", occupation: "", category: "" as Cat | "",
    essay_worthy: "", essay_dream: "", essay_contribution: "",
  });
  const [cv, setCv] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => setD((x) => ({ ...x, [k]: v }));

  const submit = async () => {
    const parsed = schema.safeParse(d);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!cv) { toast.error("CV wajib diupload"); return; }
    if (!photo) { toast.error("Foto wajib diupload"); return; }
    if (cv.size > 5 * 1024 * 1024) { toast.error("CV maksimal 5MB"); return; }
    if (photo.size > 5 * 1024 * 1024) { toast.error("Foto maksimal 5MB"); return; }

    setSubmitting(true);
    try {
      const stamp = Date.now();
      const cvPath = `${stamp}-${cv.name}`;
      const photoPath = `${stamp}-${photo.name}`;

      const { error: e1 } = await supabase.storage.from("participant-cv").upload(cvPath, cv);
      if (e1) throw e1;
      const { error: e2 } = await supabase.storage.from("participant-photo").upload(photoPath, photo);
      if (e2) throw e2;
      const photoUrl = supabase.storage.from("participant-photo").getPublicUrl(photoPath).data.publicUrl;

      const { error: e3 } = await supabase.from("participants").insert({
        ...parsed.data, cv_url: cvPath, photo_url: photoUrl,
      });
      if (e3) throw e3;

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
            <Link to="/" className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-gradient-emerald grid place-items-center">
                <Sparkles className="size-4 text-accent" />
              </div>
              <div>
                <div className="font-display text-lg font-semibold leading-none">Safar Iman</div>
                <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Kirim Berkas</div>
              </div>
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
              Kirim <span className="text-gradient-gold">Berkas Program</span>
            </h1>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Lengkapi data dirimu, pilih jalur program, upload CV & foto, dan tulis essay singkat.
              Bisa dilakukan langsung tanpa perlu mendaftar dulu.
            </p>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-soft animate-fade-up space-y-8">
            <Section title="Data Diri">
              <div className="grid sm:grid-cols-2 gap-5">
                <F label="Nama Lengkap"><Input value={d.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Nama sesuai KTP" /></F>
                <F label="Email"><Input type="email" value={d.email} onChange={(e) => set("email", e.target.value)} placeholder="nama@email.com" /></F>
                <F label="WhatsApp"><Input value={d.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="08xxxxxxxxxx" /></F>
                <F label="Jenis Kelamin">
                  <select value={d.gender} onChange={(e) => set("gender", e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Pilih...</option>
                    <option>Laki-laki</option>
                    <option>Perempuan</option>
                  </select>
                </F>
                <F label="Tanggal Lahir"><Input type="date" value={d.birth_date} onChange={(e) => set("birth_date", e.target.value)} /></F>
                <F label="Kota Asal"><Input value={d.city} onChange={(e) => set("city", e.target.value)} placeholder="Jakarta" /></F>
                <F label="Pendidikan Terakhir"><Input value={d.education} onChange={(e) => set("education", e.target.value)} placeholder="S1 / SMA / dll" /></F>
                <F label="Pekerjaan / Status"><Input value={d.occupation} onChange={(e) => set("occupation", e.target.value)} placeholder="Mahasiswa, dll" /></F>
              </div>
            </Section>

            <Section title="Pilih Kategori Program">
              <div className="grid sm:grid-cols-3 gap-3">
                {CATS.map((c) => (
                  <button
                    key={c.v} type="button"
                    onClick={() => set("category", c.v)}
                    className={`text-left rounded-2xl border-2 p-4 transition ${
                      d.category === c.v
                        ? "border-accent bg-accent/10 shadow-gold"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    <div className="font-display text-lg font-semibold">{c.t}</div>
                    <div className="text-xs text-muted-foreground mt-1">{c.d}</div>
                  </button>
                ))}
              </div>
            </Section>

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
              {submitting ? <><Loader2 className="size-4 animate-spin" /> Mengirim...</> : <>Kirim Berkas <ArrowRight className="size-4" /></>}
            </button>
          </div>
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
