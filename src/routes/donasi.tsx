import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, ArrowRight, KeyRound, Loader2, HeartHandshake, CheckCircle2, Sparkles,
  BookOpen, Utensils, Users, GraduationCap, MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { IslamicPattern, GeometricOrnament } from "@/components/IslamicPattern";

export const Route = createFileRoute("/donasi")({
  head: () => ({
    meta: [
      { title: "Kontribusi Kebaikan — Safar Iman" },
      { name: "description", content: "Tunaikan kontribusi peserta Safar Iman untuk mendukung kegiatan sosial, wakaf Al-Qur'an, dan keberlangsungan program." },
    ],
  }),
  component: DonasiPage,
});

type Lookup = {
  id: string;
  full_name: string;
  status: string;
  payment_status: string;
  payment_url: string | null;
  paid_at: string | null;
};

function DonasiPage() {
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const [code, setCode] = useState((search?.get("code") ?? "").toUpperCase());
  const [checking, setChecking] = useState(false);
  const [paying, setPaying] = useState(false);
  const [info, setInfo] = useState<Lookup | null>(null);

  const verify = async () => {
    const c = code.trim().toUpperCase();
    if (c.length < 4) { toast.error("Masukkan kode pendaftaran"); return; }
    setChecking(true);
    try {
      const { data, error } = await supabase.rpc("lookup_payment_status_by_code", { p_code: c });
      if (error) throw error;
      const row = data?.[0];
      if (!row) { toast.error("Kode tidak ditemukan"); return; }
      setInfo(row as Lookup);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memverifikasi kode");
    } finally {
      setChecking(false);
    }
  };

  const startPayment = async () => {
    setPaying(true);
    try {
      const res = await fetch("/api/public/mayar-create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Gagal membuat invoice");
      if (json.alreadyPaid) { toast.success("Alhamdulillah, kontribusi sudah tercatat"); await verify(); return; }
      if (json.url) window.location.href = json.url;
    } catch (e: any) {
      toast.error(e.message || "Gagal memulai pembayaran");
    } finally {
      setPaying(false);
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
                <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Kontribusi Kebaikan</div>
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
              Tunaikan <span className="text-gradient-gold">Kontribusi Kebaikan</span>
            </h1>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Kontribusi peserta akan digunakan untuk mendukung <strong className="text-foreground">operasional program, kegiatan sosial, berbagi makanan, wakaf Al-Qur'an</strong>, dan keberlangsungan dakwah <strong className="text-foreground">Safar Iman</strong>. Bukan keuntungan — semata wujud kolaborasi pemuda dalam kebaikan.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mb-8">
            {[
              { i: BookOpen, t: "Wakaf Al-Qur'an", d: "Setiap mushaf yang dibagikan menjadi amal jariyah." },
              { i: Utensils, t: "Berbagi Makanan", d: "Menjangkau saudara yang membutuhkan." },
              { i: Users, t: "Operasional Program", d: "Mendukung keberlangsungan kegiatan dakwah." },
            ].map((b) => (
              <div key={b.t} className="rounded-2xl bg-card border border-border p-4">
                <div className="size-9 rounded-xl bg-emerald/10 grid place-items-center mb-2">
                  <b.i className="size-4 text-emerald" />
                </div>
                <div className="font-semibold text-sm">{b.t}</div>
                <div className="text-xs text-muted-foreground mt-1">{b.d}</div>
              </div>
            ))}
          </div>

          {!info ? (
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-soft animate-fade-up max-w-xl mx-auto">
              <div className="size-14 rounded-2xl bg-gradient-emerald grid place-items-center mx-auto mb-5 shadow-emerald">
                <KeyRound className="size-6 text-accent" />
              </div>
              <h2 className="font-display text-2xl font-semibold text-center mb-2">Masukkan Kode Pendaftaran</h2>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Hanya peserta yang telah <strong className="text-foreground">lolos seleksi berkas administrasi</strong> yang dapat melanjutkan ke tahap kontribusi.
              </p>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && verify()}
                placeholder="CONTOH: HXP-A1B2C3D4"
                className="text-center font-display text-xl tracking-[0.2em] h-14"
                maxLength={16}
              />
              <button
                onClick={verify}
                disabled={checking}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-emerald text-accent px-7 py-3.5 text-sm font-bold shadow-emerald hover-lift disabled:opacity-60"
              >
                {checking ? <><Loader2 className="size-4 animate-spin" /> Memverifikasi...</> : <>Cek Status <ArrowRight className="size-4" /></>}
              </button>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-soft animate-fade-up max-w-xl mx-auto space-y-6">
              <div className="flex items-center gap-3 rounded-2xl bg-emerald/10 border border-emerald/30 p-4">
                <CheckCircle2 className="size-5 text-emerald shrink-0" />
                <div className="text-sm">
                  <div className="font-semibold">{info.full_name}</div>
                  <div className="text-muted-foreground text-xs">Kode: <span className="font-mono">{code}</span></div>
                </div>
              </div>

              {info.payment_status === "paid" ? (
                <div className="text-center py-8">
                  <div className="size-16 rounded-full bg-gradient-gold grid place-items-center mx-auto mb-4 shadow-gold">
                    <HeartHandshake className="size-8 text-emerald-deep" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold">Barakallahu fiik!</h3>
                  <p className="text-muted-foreground text-sm mt-2">
                    Kontribusi kebaikanmu sudah tercatat pada {info.paid_at ? new Date(info.paid_at).toLocaleString("id-ID") : "-"}.
                  </p>
                </div>
              ) : info.status !== "accepted" ? (
                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5 text-sm">
                  <div className="font-semibold mb-1">Belum dapat melanjutkan</div>
                  <p className="text-muted-foreground">
                    Status berkas kamu saat ini: <strong className="text-foreground">{info.status}</strong>.
                    Tahap kontribusi terbuka setelah kamu dinyatakan lolos berkas administrasi oleh tim seleksi.
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl bg-gradient-emerald p-5 text-center">
                    <div className="text-accent/80 text-xs uppercase tracking-[0.25em] mb-1">Selamat, kamu lolos!</div>
                    <div className="font-display text-white text-xl">Lanjutkan ke tahap kontribusi</div>
                  </div>
                  <button
                    onClick={startPayment}
                    disabled={paying}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-7 py-4 text-base font-bold shadow-gold hover-lift disabled:opacity-60"
                  >
                    {paying ? <><Loader2 className="size-4 animate-spin" /> Memproses...</> : (
                      <><HeartHandshake className="size-5" /> {info.payment_url ? "Lanjutkan Pembayaran" : "Tunaikan Kontribusi"} <ArrowRight className="size-4" /></>
                    )}
                  </button>
                  <p className="text-xs text-muted-foreground text-center">
                    Pembayaran diproses aman melalui Mayar.
                  </p>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
