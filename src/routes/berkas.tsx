import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Upload, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { IslamicPattern, GeometricOrnament } from "@/components/IslamicPattern";

export const Route = createFileRoute("/berkas")({
  head: () => ({
    meta: [
      { title: "Upload Berkas — Safar Iman" },
      { name: "description", content: "Upload berkas program Safar Iman." },
    ],
  }),
  component: BerkasPage,
});

type Stored = { id: string; token: string; name: string };
type Cat = "fully_funded" | "partial_funded" | "self_funded";

const CATS: { v: Cat; t: string; d: string }[] = [
  { v: "fully_funded", t: "Fully Funded", d: "Gratis total — 3 kuota" },
  { v: "partial_funded", t: "Partial Funded", d: "Subsidi Rp2.000.000 — 30 kuota" },
  { v: "self_funded", t: "Self Funded", d: "Jalur mandiri — 10 kuota" },
];

function BerkasPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<Stored | null>(null);
  const [category, setCategory] = useState<Cat | "">("");
  const [cv, setCv] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("safariman_participant");
    if (!raw) { navigate({ to: "/daftar" }); return; }
    try { setMe(JSON.parse(raw)); } catch { navigate({ to: "/daftar" }); }
  }, [navigate]);

  const submit = async () => {
    if (!me) return;
    if (!category) { toast.error("Pilih kategori program"); return; }
    if (!cv) { toast.error("CV wajib diupload"); return; }
    if (!photo) { toast.error("Foto wajib diupload"); return; }
    if (cv.size > 5 * 1024 * 1024) { toast.error("CV maksimal 5MB"); return; }
    if (photo.size > 5 * 1024 * 1024) { toast.error("Foto maksimal 5MB"); return; }

    setSubmitting(true);
    try {
      const stamp = Date.now();
      const cvPath = `${me.id}/${stamp}-${cv.name}`;
      const photoPath = `${me.id}/${stamp}-${photo.name}`;

      const { error: e1 } = await supabase.storage.from("participant-cv").upload(cvPath, cv, { upsert: true });
      if (e1) throw e1;

      const { error: e2 } = await supabase.storage.from("participant-photo").upload(photoPath, photo, { upsert: true });
      if (e2) throw e2;
      const photoUrl = supabase.storage.from("participant-photo").getPublicUrl(photoPath).data.publicUrl;

      const { error: e3 } = await supabase.rpc("update_participant_with_token", {
        p_id: me.id, p_token: me.token,
        p_category: category, p_cv_url: cvPath, p_photo_url: photoUrl,
      });
      if (e3) throw e3;

      localStorage.removeItem("safariman_participant");
      toast.success("Berkas terkirim. Barakallah!");
      navigate({ to: "/sukses" });
    } catch (e) {
      console.error(e);
      toast.error("Gagal upload. Coba lagi.");
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
                <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Step 3 · Berkas</div>
              </div>
            </Link>
            <Link to="/twibbon" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="size-4" /> Kembali ke Twibbon
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-16">
          <div className="text-center mb-10 animate-fade-up">
            <GeometricOrnament className="w-32 h-8 text-accent mx-auto mb-3 opacity-70" />
            <h1 className="font-display text-3xl sm:text-5xl font-semibold leading-tight">
              Upload <span className="text-gradient-gold">Berkas Program</span>
            </h1>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Langkah terakhir! Pilih jalur program dan upload berkasmu untuk diseleksi tim Safar Iman.
            </p>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-soft animate-fade-up space-y-7">
            <div>
              <Label className="text-sm font-medium">Pilih Kategori Program</Label>
              <div className="grid sm:grid-cols-3 gap-3 mt-2">
                {CATS.map((c) => (
                  <button
                    key={c.v} type="button"
                    onClick={() => setCategory(c.v)}
                    className={`text-left rounded-2xl border-2 p-4 transition ${
                      category === c.v
                        ? "border-accent bg-accent/10 shadow-gold"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    <div className="font-display text-lg font-semibold">{c.t}</div>
                    <div className="text-xs text-muted-foreground mt-1">{c.d}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <FileField label="Upload CV (PDF, max 5MB)" file={cv} setFile={setCv} accept="application/pdf" />
              <FileField label="Upload Foto (JPG/PNG, max 5MB)" file={photo} setFile={setPhoto} accept="image/*" />
            </div>

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

function FileField({ label, file, setFile, accept }: { label: string; file: File | null; setFile: (f: File | null) => void; accept: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <label className="cursor-pointer block rounded-2xl border-2 border-dashed border-border hover:border-accent p-5 text-center transition">
        <Upload className="size-5 mx-auto text-muted-foreground mb-2" />
        <div className="text-sm">
          {file ? <span className="text-emerald font-medium break-all">{file.name}</span> : <span className="text-muted-foreground">Klik untuk pilih file</span>}
        </div>
        <input type="file" accept={accept} className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
    </div>
  );
}
