import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { CheckCircle2, ArrowRight, Sparkles, HeartHandshake, FileText, Info } from "lucide-react";
import { IslamicPattern, GeometricOrnament } from "@/components/IslamicPattern";
import { WhatsAppChannelCTA } from "@/components/WhatsAppChannelCTA";
import heroImg from "@/assets/hero-kaaba.jpg";

const searchSchema = z.object({ code: z.string().optional() });

export const Route = createFileRoute("/sukses")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, follow" },
      { title: "Pendaftaran Berhasil — Safar Iman" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { code } = Route.useSearch();
  const essaySearch = code ? { code } : undefined;

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
          <span className="text-gradient-gold">Berkas kamu terkirim</span>
        </h1>

        <p className="mt-6 text-lg text-white/85 leading-relaxed">
          Alhamdulillah, berkas program <strong>Safar Iman</strong> berhasil diterima.
          Tahap berikutnya adalah mengirim <strong>Essay & Studi Kasus</strong>.
        </p>

        {/* Alur berikutnya */}
        <div className="mt-8 glass rounded-2xl p-5 sm:p-6 text-left border border-accent/30">
          <div className="flex items-center gap-2 text-accent font-semibold mb-3">
            <Info className="size-4" /> Alur tahap berikutnya
          </div>
          <ol className="space-y-3 text-sm text-white/90">
            <li className="flex gap-3">
              <span className="shrink-0 size-6 rounded-full bg-accent/20 text-accent grid place-items-center text-xs font-bold">1</span>
              <span><strong>Tunaikan kontribusi</strong> terlebih dahulu sebagai syarat mengakses form Essay & Studi Kasus.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 size-6 rounded-full bg-accent/20 text-accent grid place-items-center text-xs font-bold">2</span>
              <span>Setelah kontribusi terverifikasi, buka halaman <strong>Essay & Studi Kasus</strong> dan lengkapi jawabannya.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 size-6 rounded-full bg-accent/20 text-accent grid place-items-center text-xs font-bold">3</span>
              <span>Pantau progres seleksi di halaman <strong>Cek Tahapan</strong>.</span>
            </li>
          </ol>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link
            to="/essay"
            search={essaySearch as any}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-7 py-4 font-bold shadow-gold hover-lift"
          >
            <FileText className="size-5" /> Lanjut Essay & Studi Kasus <ArrowRight className="size-5" />
          </Link>
          <Link
            to="/kontribusi"
            search={essaySearch as any}
            className="inline-flex items-center gap-2 rounded-full glass text-white px-7 py-4 font-medium hover:bg-white/20"
          >
            <HeartHandshake className="size-5 text-accent" /> Tunaikan Kontribusi
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          <Link
            to="/cek-tahapan"
            search={essaySearch as any}
            className="inline-flex items-center gap-2 rounded-full glass text-white/90 px-5 py-3 text-sm hover:bg-white/20"
          >
            Cek Tahapan <ArrowRight className="size-4" />
          </Link>
          <WhatsAppChannelCTA variant="glass" />
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full glass text-white/90 px-5 py-3 text-sm hover:bg-white/20"
          >
            Beranda
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
