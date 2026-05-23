import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Loader2, Copy, FileText, Image as ImageIcon } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { IslamicPattern } from "@/components/IslamicPattern";

export const Route = createFileRoute("/daftar")({
  head: () => ({
    meta: [
      { title: "Pendaftaran Reguler — Safar Iman" },
      { name: "description", content: "Daftarkan diri untuk Program Umrah Gratis Safar Iman (Reguler / Fully Funded)." },
    ],
  }),
  component: () => <RegisterPage kind="fully_funded" />,
});

type Kind = "fully_funded" | "self_funded";

type FormData = {
  full_name: string; email: string; whatsapp: string; gender: string;
  birth_date: string; city: string; education: string; occupation: string;
  agree: boolean;
};

const initial: FormData = {
  full_name: "", email: "", whatsapp: "", gender: "", birth_date: "",
  city: "", education: "", occupation: "", agree: false,
};

const schema = z.object({
  full_name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().trim().email("Email tidak valid").max(255),
  whatsapp: z.string().trim().min(8, "Nomor WA tidak valid").max(20),
  gender: z.string().min(1, "Wajib dipilih"),
  birth_date: z.string().min(1, "Wajib diisi"),
  city: z.string().trim().min(2).max(100),
  education: z.string().trim().min(2).max(100),
  occupation: z.string().trim().min(2).max(100),
});

export function RegisterPage({ kind }: { kind: Kind }) {
  const KIND_META = kind === "self_funded"
    ? { title: "Pendaftaran Self Funded", tagline: "Jalur Mandiri", note: "Kategori program: Self Funded (mandiri)." }
    : { title: "Pendaftaran Reguler", tagline: "Fully Funded", note: "Kategori program: Reguler (Fully Funded — gratis bagi yang lolos seleksi)." };
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const next = () => {
    const r = schema.safeParse(data);
    if (!r.success) { toast.error(r.error.issues[0].message); return; }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const back = () => { setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const submit = async () => {
    if (!data.agree) { toast.error("Harap setujui syarat & ketentuan"); return; }
    const parsed = schema.safeParse(data);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

    setSubmitting(true);
    try {
      const { data: rows, error } = await supabase.rpc("register_participant", {
        p_full_name: parsed.data.full_name,
        p_email: parsed.data.email,
        p_whatsapp: parsed.data.whatsapp,
        p_gender: parsed.data.gender,
        p_birth_date: parsed.data.birth_date,
        p_city: parsed.data.city,
        p_education: parsed.data.education,
        p_occupation: parsed.data.occupation,
        p_category: kind,
      });
      if (error) throw error;
      const row = rows?.[0];
      if (!row) throw new Error("Tidak ada respons dari server");
      setCode(row.registration_code);
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.success("Pendaftaran berhasil! Simpan kode pendaftaranmu ✨");
    } catch (e) {
      console.error(e);
      toast.error("Terjadi kesalahan. Coba lagi.");
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
                <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">{KIND_META.tagline}</div>
              </div>
            </Link>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="size-4" /> Beranda
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-16">
          {code ? (
            <SuccessCard code={code} name={data.full_name} />
          ) : (
            <>
              <div className="mb-10">
                <div className="flex items-center justify-between mb-3">
                  {[1, 2].map((n) => (
                    <div key={n} className="flex-1 flex items-center">
                      <div className={`size-9 sm:size-10 rounded-full grid place-items-center font-semibold text-sm transition ${
                        step >= n ? "bg-gradient-emerald text-accent shadow-emerald" : "bg-secondary text-muted-foreground"
                      }`}>
                        {step > n ? <CheckCircle2 className="size-5" /> : n}
                      </div>
                      {n < 2 && (
                        <div className={`flex-1 h-0.5 mx-2 transition ${step > n ? "bg-emerald" : "bg-border"}`} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs text-muted-foreground text-center">
                  <span>Data Diri</span>
                  <span>Review</span>
                </div>
              </div>

              <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-soft animate-fade-up">
                {step === 1 && <Step1 data={data} set={set} />}
                {step === 2 && <Step2Review data={data} />}

                <div className="mt-10 flex items-center justify-between gap-3">
                  {step > 1 ? (
                    <button onClick={back} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                      <ArrowLeft className="size-4" /> Kembali
                    </button>
                  ) : <span />}

                  {step < 2 ? (
                    <button onClick={next} className="inline-flex items-center gap-2 rounded-full bg-gradient-emerald text-accent px-6 py-3 text-sm font-semibold shadow-emerald hover-lift">
                      Lanjut <ArrowRight className="size-4" />
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3 items-end w-full">
                      <label className="flex items-start gap-2.5 text-sm cursor-pointer">
                        <Checkbox checked={data.agree} onCheckedChange={(c) => set("agree", !!c)} className="mt-0.5" />
                        <span className="text-muted-foreground">Saya menyetujui syarat & ketentuan program Safar Iman.</span>
                      </label>
                      <button onClick={submit} disabled={submitting} className="inline-flex items-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-7 py-3.5 text-sm font-bold shadow-gold hover-lift disabled:opacity-60">
                        {submitting ? <><Loader2 className="size-4 animate-spin" /> Mengirim...</> : <>Daftar Sekarang <ArrowRight className="size-4" /></>}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function SuccessCard({ code, name }: { code: string; name: string }) {
  const copy = () => {
    navigator.clipboard.writeText(code);
    toast.success("Kode disalin");
  };
  return (
    <div className="animate-fade-up">
      <div className="text-center mb-8">
        <div className="size-16 rounded-full bg-gradient-emerald grid place-items-center mx-auto mb-4 shadow-emerald">
          <CheckCircle2 className="size-8 text-accent" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">
          Barakallah, <span className="text-gradient-gold">{name.split(" ")[0]}</span>!
        </h1>
        <p className="text-muted-foreground mt-3 max-w-md mx-auto">
          Pendaftaranmu berhasil tercatat. Simpan <strong>Kode Pendaftaran</strong> di bawah ini —
          kamu wajib memasukkannya saat mengirim berkas & essay.
        </p>
      </div>

      <div className="bg-gradient-emerald rounded-3xl p-8 text-center shadow-emerald mb-8">
        <div className="text-xs uppercase tracking-[0.3em] text-accent/80 mb-3">Kode Pendaftaran</div>
        <div className="font-display text-4xl sm:text-6xl font-bold text-gradient-gold tracking-[0.2em] mb-4">
          {code}
        </div>
        <button onClick={copy} className="inline-flex items-center gap-2 text-sm text-accent/90 hover:text-accent">
          <Copy className="size-4" /> Salin Kode
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link to="/twibbon" className="group bg-card border border-border rounded-2xl p-5 hover-lift flex items-start gap-4">
          <div className="size-12 rounded-xl bg-accent/20 grid place-items-center shrink-0">
            <ImageIcon className="size-5 text-accent" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold">Bagikan Twibbon</div>
            <div className="text-sm text-muted-foreground mt-0.5">Download frame & share di sosmed</div>
          </div>
        </Link>
        <Link to="/berkas" className="group bg-card border border-accent rounded-2xl p-5 hover-lift flex items-start gap-4 shadow-gold/50">
          <div className="size-12 rounded-xl bg-gradient-gold grid place-items-center shrink-0">
            <FileText className="size-5 text-emerald-deep" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold">Kirim Berkas & Essay</div>
            <div className="text-sm text-muted-foreground mt-0.5">Gunakan kode pendaftaran di atas</div>
          </div>
        </Link>
      </div>

      <div className="mt-8 text-center">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Kembali ke Beranda</Link>
      </div>
    </div>
  );
}

function StepHeader({ n, t, d }: { n: number; t: string; d: string }) {
  return (
    <div className="mb-7">
      <div className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">Step {n} / 2</div>
      <h2 className="font-display text-2xl sm:text-3xl font-semibold mt-1">{t}</h2>
      <p className="text-sm text-muted-foreground mt-1">{d}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

function Step1({ data, set }: { data: FormData; set: <K extends keyof FormData>(k: K, v: FormData[K]) => void }) {
  return (
    <div>
      <StepHeader n={1} t="Data Diri" d="Ceritakan tentang dirimu — semua data dijaga kerahasiaannya." />
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Nama Lengkap">
          <Input value={data.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Nama sesuai KTP" />
        </Field>
        <Field label="Email">
          <Input type="email" value={data.email} onChange={(e) => set("email", e.target.value)} placeholder="nama@email.com" />
        </Field>
        <Field label="Nomor WhatsApp">
          <Input value={data.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="08xxxxxxxxxx" />
        </Field>
        <Field label="Jenis Kelamin">
          <RadioGroup value={data.gender} onValueChange={(v) => set("gender", v)} className="flex gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <RadioGroupItem value="Laki-laki" /> Laki-laki
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <RadioGroupItem value="Perempuan" /> Perempuan
            </label>
          </RadioGroup>
        </Field>
        <Field label="Tanggal Lahir">
          <Input type="date" value={data.birth_date} onChange={(e) => set("birth_date", e.target.value)} />
        </Field>
        <Field label="Kota Asal">
          <Input value={data.city} onChange={(e) => set("city", e.target.value)} placeholder="Jakarta" />
        </Field>
        <Field label="Pendidikan Terakhir">
          <Input value={data.education} onChange={(e) => set("education", e.target.value)} placeholder="S1 / SMA / dll" />
        </Field>
        <Field label="Pekerjaan / Status">
          <Input value={data.occupation} onChange={(e) => set("occupation", e.target.value)} placeholder="Mahasiswa, Karyawan, dll" />
        </Field>
      </div>
    </div>
  );
}

function Step2Review({ data }: { data: FormData }) {
  return (
    <div>
      <StepHeader n={2} t="Review & Submit" d="Periksa kembali data kamu sebelum mengirim." />
      <div className="space-y-1 text-sm">
        <ReviewRow label="Nama" v={data.full_name} />
        <ReviewRow label="Email" v={data.email} />
        <ReviewRow label="WhatsApp" v={data.whatsapp} />
        <ReviewRow label="Jenis Kelamin" v={data.gender} />
        <ReviewRow label="Tanggal Lahir" v={data.birth_date} />
        <ReviewRow label="Kota" v={data.city} />
        <ReviewRow label="Pendidikan" v={data.education} />
        <ReviewRow label="Pekerjaan" v={data.occupation} />
      </div>
      <div className="mt-6 rounded-2xl bg-accent/10 border border-accent/30 p-4 text-sm text-muted-foreground">
        Setelah daftar, kamu akan mendapatkan <strong className="text-foreground">Kode Pendaftaran</strong>.
        Gunakan kode itu untuk akses halaman <strong className="text-foreground">Kirim Berkas & Essay</strong>.
      </div>
    </div>
  );
}

function ReviewRow({ label, v }: { label: string; v: string }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2.5 border-b border-border last:border-0">
      <div className="text-muted-foreground">{label}</div>
      <div className="col-span-2 font-medium">{v || "—"}</div>
    </div>
  );
}
