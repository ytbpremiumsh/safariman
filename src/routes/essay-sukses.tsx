import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { CheckCircle2, ArrowRight, Sparkles, Info, Heart, Star } from "lucide-react";
import { IslamicPattern, GeometricOrnament } from "@/components/IslamicPattern";
import { WhatsAppChannelCTA } from "@/components/WhatsAppChannelCTA";
import heroImg from "@/assets/hero-kaaba.jpg";

const searchSchema = z.object({ code: z.string().optional() });

export const Route = createFileRoute("/essay-sukses")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, follow" },
      { title: "Essay & Studi Kasus Terkirim — Safar Iman" },
    ],
  }),
  component: EssaySuccessPage,
});

function EssaySuccessPage() {
  const { code } = Route.useSearch();
  const cekSearch = code ? { code } : undefined;

  return (
    <div className="relative min-h-screen overflow-hidden grid place-items-center px-4 py-16">
      <img src={heroImg} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-deep/90 via-emerald-deep/95 to-emerald-deep" />
      <IslamicPattern className="absolute inset-0 size-full text-accent/10" />
      <div className="absolute top-20 left-1/4 size-40 rounded-full bg-accent/20 blur-3xl animate-float" />
      <div className="absolute bottom-20 right-1/4 size-48 rounded-full bg-emerald/40 blur-3xl animate-float" />

      <div className="relative z-10 text-center max-w-2xl animate-fade-up">
        <div className="relative inline-block mb-7">
          <div className="absolute inset-0 bg-accent/40 rounded-full blur-2xl animate-glow-pulse" />
          <div className="relative size-24 rounded-full bg-gradient-gold grid place-items-center shadow-gold">
            <CheckCircle2 className="size-12 text-emerald-deep" />
          </div>
        </div>

        <GeometricOrnament className="w-32 h-8 text-accent mx-auto mb-4 opacity-70" />

        <h1 className="font-display text-4xl sm:text-6xl font-semibold text-white leading-tight">
          Barakallahu fiik!<br />
          <span className="text-gradient-gold">Pengiriman Essay dan Studi Kasus Terkirim</span>
        </h1>

        <p className="mt-6 text-lg text-white/85 leading-relaxed">
          Alhamdulillah, jawaban Essay & Studi Kasus kamu telah kami terima.
          Semoga Allah mudahkan langkahmu hingga menjadi peraih <strong>Fully Funded</strong>. Aamiin.
        </p>


        {/* Info Cek Tahapan */}
        <div className="mt-8 glass rounded-2xl p-5 sm:p-6 text-left border border-accent/30">
          <div className="flex items-center gap-2 text-accent font-semibold mb-3">
            <Info className="size-4" /> Pantau seluruh tahapan
          </div>
          <p className="text-sm text-white/90 leading-relaxed">
            Gunakan <strong>kode pendaftaran</strong> kamu untuk mengecek progres seleksi di halaman{" "}
            <Link to="/cek-tahapan" className="underline decoration-accent/60 hover:text-accent">
              Cek Tahapan
            </Link>. Hasil penilaian akan diumumkan setelah seluruh jawaban selesai dinilai tim juri.
          </p>
        </div>

        {/* Kata-kata penyemangat */}
        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-5 text-left border border-emerald/30">
            <div className="flex items-center gap-2 text-emerald-200 font-semibold mb-2">
              <Star className="size-4 text-accent" /> Jika kamu lolos
            </div>
            <p className="text-sm text-white/85 leading-relaxed">
              Alhamdulillah, ini adalah amanah baru. Jaga niat, teruskan ikhtiar, dan siapkan diri
              untuk tahap berikutnya dengan sebaik-baiknya. Semoga Allah mudahkan setiap langkahmu
              menuju <em>Baitullah</em>. 🌙
            </p>
          </div>
          <div className="glass rounded-2xl p-5 text-left border border-accent/30">
            <div className="flex items-center gap-2 text-accent font-semibold mb-2">
              <Heart className="size-4" /> Jika belum lolos
            </div>
            <p className="text-sm text-white/85 leading-relaxed">
              Tetap semangat! Setiap ikhtiar yang kamu tempuh tidak pernah sia-sia di sisi Allah.
              Pintu gelombang dan program kami selanjutnya senantiasa terbuka. Barakallahu fiik.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link
            to="/cek-tahapan"
            search={cekSearch as any}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-7 py-4 font-bold shadow-gold hover-lift"
          >
            Cek Tahapan <ArrowRight className="size-5" />
          </Link>
          <WhatsAppChannelCTA variant="glass" />
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full glass text-white/90 px-5 py-3 text-sm hover:bg-white/20"
          >
            Kembali ke Beranda <ArrowRight className="size-4" />
          </Link>
        </div>

        {code && (
          <p className="mt-6 text-xs text-white/70">
            Kode pendaftaran kamu: <span className="font-mono font-semibold text-accent">{code}</span>
          </p>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-white/60 text-sm">
          <Sparkles className="size-4 text-accent" />
          Hasanah × Prestasi Kita
        </div>
      </div>
    </div>
  );
}
