import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft, ArrowRight, ShieldCheck, Award, Users, Globe2, HeartHandshake,
  BadgeCheck, Sparkles, Building2, GraduationCap, Plane, Star,
} from "lucide-react";
import { IslamicPattern, GeometricOrnament } from "@/components/IslamicPattern";
import logoSafarIman from "@/assets/logo-safar-iman.png";
import logoHasanah from "@/assets/logo-hasanah.png";
import logoPrestasiKita from "@/assets/logo-prestasi-kita.png";

export const Route = createFileRoute("/tentang")({
  head: () => ({
    meta: [
      { title: "Tentang Safar Iman — Hasanah × Prestasi Kita" },
      { name: "description", content: "Mengenal lebih dekat program Safar Iman: kolaborasi Hasanah Tour & Travel dan Prestasi Kita untuk pemuda Indonesia berprestasi." },
      { property: "og:title", content: "Tentang Safar Iman — Hasanah × Prestasi Kita" },
      { property: "og:description", content: "Kolaborasi tepercaya Hasanah Tour & Travel dan Prestasi Kita menghadirkan program Umrah gratis untuk generasi muda Indonesia." },
    ],
  }),
  component: TentangPage,
});

function TentangPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/40 via-background to-secondary/30 relative">
      <IslamicPattern className="absolute inset-0 size-full text-emerald/5" />
      <div className="relative">
        {/* Header */}
        <header className="border-b border-border bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-sm">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img src={logoSafarIman} alt="Safar Iman" className="h-10 sm:h-11 w-auto" />
            </Link>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="size-4" /> Beranda
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
          {/* Hero */}
          <section className="text-center mb-16 animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 border border-accent/30 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] uppercase text-emerald-deep mb-6">
              <Sparkles className="size-3.5" /> Tentang Program
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight">
              Kolaborasi <span className="text-gradient-gold">Tepercaya</span> untuk
              <br className="hidden sm:block" /> Generasi Berprestasi
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              <strong className="text-foreground">Safar Iman</strong> lahir dari kolaborasi dua institusi tepercaya — menghadirkan program Umrah gratis bagi pemuda-pemudi Indonesia yang siap menempuh perjalanan keimanan dan prestasi.
            </p>

            {/* Logos showcase */}
            <div className="mt-12 flex flex-col items-center gap-8">
              <div className="flex items-center justify-center gap-6 sm:gap-12 flex-wrap">
                <div className="bg-white rounded-2xl px-6 py-4 shadow-lg ring-1 ring-black/5">
                  <img src={logoHasanah} alt="Hasanah Tour & Travel" className="h-14 sm:h-16 w-auto" />
                </div>
                <div className="text-gradient-gold font-display text-3xl sm:text-4xl font-bold">×</div>
                <div className="bg-white rounded-2xl px-6 py-4 shadow-lg ring-1 ring-black/5">
                  <img src={logoPrestasiKita} alt="Prestasi Kita" className="h-14 sm:h-16 w-auto" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-px w-12 bg-accent/40" />
                <img src={logoSafarIman} alt="Safar Iman" className="h-12 sm:h-14 w-auto" />
                <div className="h-px w-12 bg-accent/40" />
              </div>
            </div>
          </section>

          {/* Trust Stats */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {[
              { icon: Users, value: "10.000+", label: "Jamaah Terlayani" },
              { icon: Award, value: "15+", label: "Tahun Pengalaman" },
              { icon: BadgeCheck, value: "100%", label: "Berizin Resmi" },
              { icon: Globe2, value: "20+", label: "Kota di Indonesia" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-card border border-border p-5 text-center hover-lift">
                <s.icon className="size-6 text-accent mx-auto mb-2" />
                <div className="font-display text-2xl sm:text-3xl font-bold text-emerald-deep">{s.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </section>

          {/* Partner: Hasanah */}
          <section className="grid md:grid-cols-[260px_1fr] gap-8 items-start mb-16 rounded-3xl bg-card border border-border p-6 sm:p-10 shadow-sm">
            <div className="flex justify-center md:justify-start">
              <div className="bg-white rounded-2xl px-6 py-6 shadow-lg ring-1 ring-black/5 inline-block">
                <img src={logoHasanah} alt="Hasanah Tour & Travel" className="h-20 w-auto" />
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-deep/10 px-3 py-1 text-xs font-semibold text-emerald-deep mb-3">
                <Plane className="size-3.5" /> Mitra Penyelenggara Umrah
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-3">Hasanah Tour & Travel</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Hasanah Tour & Travel adalah biro perjalanan umrah dan haji <strong className="text-foreground">berizin resmi Kementerian Agama RI</strong>, dengan pengalaman lebih dari satu dekade melayani ribuan jamaah Indonesia menunaikan ibadah ke Tanah Suci dengan amanah, nyaman, dan khusyuk.
              </p>
              <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                {[
                  "Berizin resmi PPIU Kemenag",
                  "Pembimbing ibadah berpengalaman",
                  "Akomodasi hotel dekat Haram",
                  "Tim Muthawif profesional",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <BadgeCheck className="size-4 text-accent shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Partner: Prestasi Kita */}
          <section className="grid md:grid-cols-[1fr_260px] gap-8 items-start mb-16 rounded-3xl bg-card border border-border p-6 sm:p-10 shadow-sm">
            <div className="md:order-1 order-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-deep/10 px-3 py-1 text-xs font-semibold text-emerald-deep mb-3">
                <GraduationCap className="size-3.5" /> Mitra Pengembangan Pemuda
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-3">Prestasi Kita</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Prestasi Kita adalah komunitas dan platform pengembangan pemuda Indonesia yang fokus pada <strong className="text-foreground">leadership, prestasi akademik, dan kontribusi sosial</strong>. Telah membina ribuan pemuda berprestasi dari Sabang hingga Merauke melalui beragam program seminar, mentoring, dan kompetisi.
              </p>
              <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                {[
                  "Komunitas pemuda nasional",
                  "Program mentoring & leadership",
                  "Seminar nasional & internasional",
                  "Jaringan alumni berprestasi",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <BadgeCheck className="size-4 text-accent shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center md:justify-end md:order-2 order-1">
              <div className="bg-white rounded-2xl px-6 py-6 shadow-lg ring-1 ring-black/5 inline-block">
                <img src={logoPrestasiKita} alt="Prestasi Kita" className="h-20 w-auto" />
              </div>
            </div>
          </section>

          {/* Why Trust Us */}
          <section className="mb-16">
            <div className="text-center mb-10">
              <GeometricOrnament className="mx-auto text-accent mb-4" />
              <h2 className="font-display text-3xl sm:text-4xl font-semibold">
                Mengapa <span className="text-gradient-emerald">Safar Iman</span> Dipercaya?
              </h2>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                Komitmen amanah, transparansi, dan profesionalisme adalah pondasi setiap program yang kami selenggarakan.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  icon: ShieldCheck,
                  title: "Legal & Berizin",
                  desc: "Diselenggarakan oleh biro perjalanan resmi berizin Kementerian Agama RI dengan track record yang jelas.",
                },
                {
                  icon: HeartHandshake,
                  title: "Transparan & Amanah",
                  desc: "Setiap kontribusi peserta dialokasikan secara transparan untuk operasional program dan kegiatan sosial.",
                },
                {
                  icon: Building2,
                  title: "Institusi Tepercaya",
                  desc: "Kolaborasi dua institusi mapan dengan rekam jejak melayani jamaah dan membina pemuda Indonesia.",
                },
                {
                  icon: Star,
                  title: "Seleksi Profesional",
                  desc: "Proses seleksi dilakukan secara objektif, adil, dan bebas dari segala bentuk kecurangan.",
                },
                {
                  icon: Users,
                  title: "Komunitas Berprestasi",
                  desc: "Bergabung dengan jaringan pemuda-pemudi Indonesia terbaik yang siap berkontribusi untuk negeri.",
                },
                {
                  icon: Award,
                  title: "Pengalaman Terbukti",
                  desc: "Ribuan jamaah telah merasakan layanan terbaik kami dalam menunaikan ibadah ke Tanah Suci.",
                },
              ].map((f) => (
                <div key={f.title} className="rounded-2xl bg-card border border-border p-6 hover-lift">
                  <div className="size-11 rounded-xl bg-gradient-gold grid place-items-center shadow-gold mb-4">
                    <f.icon className="size-5 text-emerald-deep" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Visi Misi */}
          <section className="grid md:grid-cols-2 gap-6 mb-16">
            <div className="rounded-3xl bg-gradient-emerald p-8 text-primary-foreground shadow-emerald">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold mb-4">
                <Sparkles className="size-3.5" /> Visi
              </div>
              <h3 className="font-display text-2xl font-semibold mb-3">Menjadi Jembatan Hasanah</h3>
              <p className="text-white/90 leading-relaxed">
                Menjembatani pemuda-pemudi Indonesia berprestasi untuk menunaikan ibadah ke Baitullah, sekaligus melahirkan generasi pemimpin yang berakhlak mulia dan berdampak bagi umat.
              </p>
            </div>
            <div className="rounded-3xl bg-card border border-border p-8 shadow-sm">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-emerald-deep mb-4">
                <HeartHandshake className="size-3.5" /> Misi
              </div>
              <h3 className="font-display text-2xl font-semibold mb-3">Membina dengan Amanah</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><BadgeCheck className="size-4 text-accent shrink-0 mt-0.5" /><span>Membuka akses Umrah bagi pemuda berprestasi tanpa hambatan biaya.</span></li>
                <li className="flex gap-2"><BadgeCheck className="size-4 text-accent shrink-0 mt-0.5" /><span>Menyelenggarakan program pengembangan kepemimpinan berbasis nilai Islam.</span></li>
                <li className="flex gap-2"><BadgeCheck className="size-4 text-accent shrink-0 mt-0.5" /><span>Mendorong kontribusi sosial dan wakaf sebagai budaya generasi muda.</span></li>
              </ul>
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-3xl bg-gradient-emerald p-8 sm:p-12 text-center text-primary-foreground shadow-emerald relative overflow-hidden">
            <IslamicPattern className="absolute inset-0 size-full text-white/5" />
            <div className="relative">
              <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-3">
                Siap Memulai <span className="text-gradient-gold">Safar Iman</span>-mu?
              </h2>
              <p className="text-white/90 max-w-xl mx-auto mb-8">
                Bergabunglah bersama generasi muda Indonesia terbaik dalam perjalanan keimanan dan prestasi.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/daftar"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-6 py-3 font-semibold shadow-gold hover-lift"
                >
                  Daftar Sekarang <ArrowRight className="size-4" />
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/30 px-6 py-3 font-semibold hover:bg-white/20 transition-colors"
                >
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-border bg-background/60 mt-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Safar Iman — Hasanah Tour & Travel × Prestasi Kita. Semua hak dilindungi.
          </div>
        </footer>
      </div>
    </div>
  );
}
