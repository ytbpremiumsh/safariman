import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { IslamicPattern, GeometricOrnament } from "@/components/IslamicPattern";
import heroImg from "@/assets/hero-kaaba.jpg";

export const Route = createFileRoute("/sukses")({
  head: () => ({ meta: [{ title: "Pendaftaran Berhasil — Safar Iman" }] }),
  component: SuccessPage,
});

function SuccessPage() {
  return (
    <div className="relative min-h-screen overflow-hidden grid place-items-center px-4">
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
          <span className="text-gradient-gold">Pendaftaran terkirim</span>
        </h1>

        <p className="mt-6 text-lg text-white/85 leading-relaxed">
          Terima kasih telah mendaftar program <strong>Safar Iman</strong>.
          Tim kami akan menghubungi kamu melalui email atau WhatsApp dalam 3–5 hari kerja.
        </p>

        <div className="mt-10 flex flex-wrap gap-3 justify-center">
          <Link
            to="/donasi"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-7 py-4 font-bold shadow-gold hover-lift"
          >
            Lanjut ke Kontribusi <ArrowRight className="size-5" />
          </Link>
          <a
            href="https://wa.me/6281234567890"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full glass text-white px-7 py-4 font-medium hover:bg-white/20"
          >
            <MessageCircle className="size-5" /> Gabung Grup WhatsApp
          </a>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full glass text-white px-7 py-4 font-medium hover:bg-white/20"
          >
            Kembali ke Beranda <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-12 flex items-center justify-center gap-2 text-white/60 text-sm">
          <Sparkles className="size-4 text-accent" />
          Hasanah × Prestasi Kita
        </div>
      </div>
    </div>
  );
}
