import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowLeft, ArrowRight, KeyRound, Loader2, HeartHandshake, CheckCircle2, Sparkles,
  BookOpen, Utensils, Users, ShieldCheck, Lock, FileText,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { IslamicPattern } from "@/components/IslamicPattern";
import { ApresiasiPeserta } from "@/components/ApresiasiPeserta";
import donasiHeader from "@/assets/donasi-header.jpg";
import logoSafarIman from "@/assets/logo-safar-iman.png";
import cardKaabaUrl from "@/assets/donasi-card-kaaba.jpg";
import cardNabawiUrl from "@/assets/donasi-card-nabawi.jpg";
import cardHaramUrl from "@/assets/donasi-card-haram.jpg";
const cardKaabaAsset = { url: cardKaabaUrl };
const cardNabawiAsset = { url: cardNabawiUrl };
const cardHaramAsset = { url: cardHaramUrl };

export const Route = createFileRoute("/kontribusi")({
  validateSearch: z.object({ code: z.string().optional() }),
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
  category: string | null;
  donation_status: string;
  donation_url: string | null;
  donation_paid_at: string | null;
};

function DonasiPage() {
  const navigate = useNavigate();
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const [code, setCode] = useState((search?.get("code") ?? "").toUpperCase());
  const [checking, setChecking] = useState(false);
  const [paying, setPaying] = useState(false);
  const [info, setInfo] = useState<Lookup | null>(null);

  const verify = async (autoCode?: string) => {
    const c = (autoCode ?? code).trim().toUpperCase();
    if (c.length < 4) { toast.error("Masukkan kode pendaftaran"); return; }
    setChecking(true);
    try {
      const { data, error } = await supabase.rpc("lookup_payment_status_by_code", { p_code: c });
      if (error) throw error;
      const row = data?.[0];
      if (!row) { toast.error("Kode tidak ditemukan"); return; }
      setInfo(row as Lookup);
      if (row.donation_status === "paid") {
        toast.success("Donasi sudah valid, silakan lanjut ke Essay");
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal memverifikasi kode");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    const urlCode = search?.get("code");
    if (urlCode && urlCode.length >= 4 && !info) {
      verify(urlCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startPayment = async () => {
    setPaying(true);
    try {
      const { mayarCreateInvoice } = await import("@/lib/api");
      const json = await mayarCreateInvoice(code.trim().toUpperCase(), true);
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
            <Link to="/" className="flex items-center">
              <img src={logoSafarIman} alt="Safar Iman" className="h-10 sm:h-11 w-auto" />
            </Link>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="size-4" /> Beranda
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-16">
          <div className="mb-12 animate-fade-up text-center">
            <div className="flex justify-center mb-8">
              <Link
                to="/berkas"
                className="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 backdrop-blur px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-accent/50 hover:bg-card transition-all shadow-sm hover:shadow-md"
              >
                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" /> Kembali
              </Link>
            </div>
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-emerald font-bold bg-emerald/10 border border-emerald/20 px-4 py-1.5 rounded-full">
              <HeartHandshake className="size-3.5" /> Kontribusi Kebaikan
            </span>
            <h1 className="mt-5 font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight">
              Tunaikan Kebaikan,<br />
              <span className="text-emerald">Raih Berkah</span> di Tanah Suci
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Kontribusi peserta digunakan untuk mendukung <strong className="text-foreground">kegiatan sosial, berbagi makanan, dan wakaf mushaf Al-Qur'an di Makkah dan Madinah</strong> — wujud kolaborasi pemuda dalam kebaikan bersama <strong className="text-foreground">Safar Iman</strong>.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 mb-12">
            {[
              { i: BookOpen, t: "Wakaf Al-Qur'an", d: "Wakaf mushaf di Makkah dan Madinah sebagai amal jariyah.", bg: cardKaabaAsset.url, dark: false },
              { i: Utensils, t: "Berbagi Makanan", d: "Menjangkau saudara yang membutuhkan di Makkah dan Madinah.", bg: cardNabawiAsset.url, dark: true },
              { i: Users, t: "Kegiatan Safar Iman", d: "Mendukung keberlangsungan kegiatan Safar Iman.", bg: cardHaramAsset.url, dark: false },
            ].map((b) => (
              <div
                key={b.t}
                className={`relative rounded-[28px] overflow-hidden p-[2px] hover-lift shadow-soft ${
                  b.dark
                    ? "bg-gradient-to-br from-accent/70 via-accent/30 to-accent/70"
                    : "bg-gradient-to-br from-accent/40 via-border to-accent/30"
                }`}
              >
                <div
                  className={`relative rounded-[26px] overflow-hidden h-full flex flex-col items-center text-center px-6 pt-8 pb-7 ${
                    b.dark ? "bg-emerald-deep" : "bg-gradient-to-b from-[hsl(40_40%_97%)] to-[hsl(40_30%_94%)]"
                  }`}
                >
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-cover bg-center opacity-55"
                    style={{
                      backgroundImage: `url(${b.bg})`,
                      maskImage: "linear-gradient(to bottom, transparent 0%, transparent 30%, black 75%, black 100%)",
                      WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, transparent 30%, black 75%, black 100%)",
                    }}
                  />
                  <div className="relative z-10 flex flex-col items-center w-full">
                    <div className="relative mb-5">
                      <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-accent via-accent/40 to-accent blur-[1px]" />
                      <div className="relative size-14 rounded-full bg-emerald-deep grid place-items-center ring-2 ring-accent shadow-[0_4px_14px_rgba(0,0,0,0.25)]">
                        <b.i className="size-6 text-accent" strokeWidth={1.75} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="h-px w-8 bg-accent/50" />
                      <span className="text-accent text-xs">✦</span>
                      <span className="h-px w-8 bg-accent/50" />
                    </div>
                    <h3 className={`font-display text-xl sm:text-2xl font-semibold tracking-tight mb-3 ${b.dark ? "text-white" : "text-emerald-deep"}`}>
                      {b.t}
                    </h3>
                    <p className={`text-sm leading-relaxed max-w-[22ch] ${b.dark ? "text-white/75" : "text-foreground/65"}`}>
                      {b.d}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Apresiasi Peserta */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white font-bold bg-gradient-emerald px-4 py-2 rounded-full shadow-emerald">
                <Sparkles className="size-3.5" /> Apresiasi Peserta — Sudah Termasuk
              </span>
              <h3 className="mt-5 font-display text-2xl sm:text-3xl font-bold leading-tight max-w-2xl mx-auto">
                Sebagai bentuk apresiasi, peserta akan mendapatkan kesempatan mengikuti{" "}
                <span className="text-accent">Kelas Online</span> &amp;{" "}
                <span className="text-accent">Kajian Sirah</span>
              </h3>
              <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
                Seluruh peserta yang berkontribusi mendapatkan akses Eksklusif ke pembelajaran berkualitas bersama pembimbing terpilih.
              </p>
            </div>

            <ApresiasiPeserta compact />


          </div>


          {!info ? (
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-soft animate-fade-up">
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
                className="text-center font-mono text-lg tracking-[0.15em] h-14 uppercase"
                maxLength={16}
              />
              <button
                onClick={() => verify()}
                disabled={checking}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-emerald text-accent px-7 py-3.5 text-sm font-bold shadow-emerald hover-lift disabled:opacity-60"
              >
                {checking ? <><Loader2 className="size-4 animate-spin" /> Memverifikasi...</> : <>Cek Status <ArrowRight className="size-4" /></>}
              </button>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-soft animate-fade-up space-y-6">
              <div className="flex items-center gap-3 rounded-2xl bg-emerald/10 border border-emerald/30 p-4">
                <CheckCircle2 className="size-5 text-emerald shrink-0" />
                <div className="text-sm">
                  <div className="font-semibold">{info.full_name}</div>
                  <div className="text-muted-foreground text-xs">Kode: <span className="font-mono">{code}</span></div>
                </div>
              </div>

              {info.category === "self_funded" ? (
                <div className="text-center py-4">
                  <div className="size-16 rounded-full bg-gradient-gold grid place-items-center mx-auto mb-4 shadow-gold">
                    <Sparkles className="size-8 text-emerald-deep" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold">Jalur Self Funded</h3>
                  <p className="text-muted-foreground text-sm mt-2 mb-6 max-w-md mx-auto">
                    Peserta jalur <strong className="text-foreground">Self Funded</strong> tidak diwajibkan menunaikan donasi.
                    Silakan menunggu informasi selanjutnya dari tim Safar Iman melalui WhatsApp.
                  </p>
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-emerald text-accent px-7 py-3.5 text-sm font-bold shadow-emerald hover-lift"
                  >
                    Kembali ke Beranda
                  </Link>
                </div>
              ) : info.donation_status === "paid" ? (
                <div className="text-center py-4">
                  <div className="size-16 rounded-full bg-gradient-gold grid place-items-center mx-auto mb-4 shadow-gold">
                    <HeartHandshake className="size-8 text-emerald-deep" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold">Barakallahu fiik!</h3>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald/10 border border-emerald/30 px-4 py-2 text-sm font-semibold text-emerald">
                    <CheckCircle2 className="size-4" /> Pembayaran Donasi Sudah Valid
                  </div>
                  <p className="text-muted-foreground text-sm mt-3 mb-2">
                    Kontribusi kebaikanmu sudah tercatat pada {info.donation_paid_at ? new Date(info.donation_paid_at).toLocaleString("id-ID") : "-"}.
                  </p>
                  <p className="text-sm text-foreground/80 mb-6 max-w-md mx-auto">
                    Kamu tidak perlu melakukan pembayaran lagi. Silakan lanjutkan ke tahap berikutnya: <strong>Penulisan Essay & Studi Kasus</strong>.
                  </p>
                  <Link
                    to="/essay"
                    search={{ code: code.trim().toUpperCase() }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-emerald text-accent px-7 py-4 text-base font-bold shadow-emerald hover-lift"
                  >
                    <FileText className="size-5" /> Lanjut ke Tahap Essay & Studi Kasus <ArrowRight className="size-4" />
                  </Link>
                </div>
              ) : info.category !== "gelombang_1" && info.category !== "gelombang_2" && info.status !== "accepted" ? (
                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5 text-sm">
                  <div className="font-semibold mb-1">Belum dapat melanjutkan</div>
                  <p className="text-muted-foreground">
                    Status berkas kamu saat ini: <strong className="text-foreground">{info.status}</strong>.
                    Tahap kontribusi terbuka setelah kamu dinyatakan lolos berkas administrasi oleh tim seleksi.
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl bg-gradient-emerald p-6 sm:p-8 text-center">
                    <div className="text-accent text-sm sm:text-base uppercase tracking-[0.2em] font-bold mb-3">
                      {info.category === "gelombang_1" || info.category === "gelombang_2"
                        ? "Jalur Fast Track"
                        : "Selamat, kamu lolos berkas!"}
                    </div>
                    <div className="font-display text-white text-2xl sm:text-3xl leading-snug">
                      Selangkah lagi menuju tahap Essay
                    </div>
                    <p className="text-accent/95 text-base sm:text-lg mt-4 leading-relaxed font-medium">
                      Tunaikan donasi terlebih dahulu untuk membuka akses ke tahap penulisan Essay.
                    </p>
                  </div>
                  <button
                    onClick={startPayment}
                    disabled={paying}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-7 py-4 text-base font-bold shadow-gold hover-lift disabled:opacity-60"
                  >
                    {paying ? <><Loader2 className="size-4 animate-spin" /> Memproses...</> : (
                      <><HeartHandshake className="size-5" /> {info.donation_url ? "Lanjutkan Donasi" : "Tunaikan Donasi"} <ArrowRight className="size-4" /></>
                    )}
                  </button>
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ShieldCheck className="size-4 text-emerald" /> Pembayaran Aman
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Lock className="size-3.5 text-emerald" /> Terenkripsi SSL
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="size-4 text-emerald" /> Diproses oleh Mayar
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
