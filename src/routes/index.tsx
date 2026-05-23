import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles, Globe2, Award, BookOpen, Users, Building2, GraduationCap, Heart,
  Plane, Hotel, Wallet, Star, CheckCircle2, ArrowRight, MapPin,
  CalendarCheck, ClipboardList, MessageSquare, Megaphone, Users2, Rocket,
  Briefcase, UtensilsCrossed, Bus, BadgeCheck, UserCheck, Compass, Luggage, ShoppingBag,
  Instagram, Mail, Phone, MapPinned,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Countdown } from "@/components/Countdown";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { IslamicPattern, GeometricOrnament } from "@/components/IslamicPattern";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

import heroImg from "@/assets/hero-kaaba.jpg";
import madinahImg from "@/assets/madinah.jpg";
import dubaiImg from "@/assets/dubai.jpg";
import cappadociaImg from "@/assets/cappadocia.jpg";
import seminarImg from "@/assets/seminar.jpg";
import sharingImg from "@/assets/sharing.jpg";
import persyaratanPoster from "@/assets/persyaratan-poster.jpg";
import logoSafarIman from "@/assets/logo-safar-iman.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Safar Iman — Umrah Gratis Fully Funded untuk Anak Muda Berprestasi" },
      { name: "description", content: "Program Umrah Gratis untuk generasi muda berprestasi: Umrah, Leadership, Seminar Internasional, Wakaf & Islamic Journey Experience." },
    ],
  }),
  component: Landing,
});

function Nav() {
  const [open, setOpen] = useState(false);
  const links = [
    { href: "#program", label: "Program" },
    { href: "#kuota", label: "Kuota" },
    { href: "#timeline", label: "Timeline" },
    { href: "#galeri", label: "Galeri" },
    { href: "#faq", label: "FAQ" },
    { href: "/tentang", label: "Tentang" },
  ];
  return (
    <header className="fixed top-0 inset-x-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-4">
        <div className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-lg ring-1 ring-black/5">
          <Link to="/" className="flex items-center">
            <img src={logoSafarIman} alt="Safar Iman" className="h-9 sm:h-10 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-foreground/80">
            {links.map((l) =>
              l.href.startsWith("/") ? (
                <Link key={l.href} to={l.href} className="hover:text-emerald-deep transition-colors font-medium">{l.label}</Link>
              ) : (
                <a key={l.href} href={l.href} className="hover:text-emerald-deep transition-colors font-medium">{l.label}</a>
              )
            )}
          </nav>
          <Link
            to="/daftar"
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-5 py-2.5 text-sm font-semibold shadow-gold hover-lift"
          >
            Daftar Sekarang <ArrowRight className="size-4" />
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-foreground p-2"
            aria-label="Menu"
          >
            <div className="size-5 flex flex-col justify-between">
              <span className="h-0.5 bg-foreground" />
              <span className="h-0.5 bg-foreground" />
              <span className="h-0.5 bg-foreground" />
            </div>
          </button>
        </div>
        {open && (
          <div className="bg-white rounded-2xl mt-2 p-4 md:hidden animate-fade-up shadow-lg ring-1 ring-black/5">
            {links.map((l) =>
              l.href.startsWith("/") ? (
                <Link key={l.href} to={l.href} onClick={() => setOpen(false)} className="block py-2 text-foreground/90 font-medium">{l.label}</Link>
              ) : (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-2 text-foreground/90 font-medium">{l.label}</a>
              )
            )}
            <Link to="/daftar" className="mt-3 block text-center rounded-full bg-gradient-gold text-emerald-deep px-5 py-3 font-semibold">
              Daftar Sekarang
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

function Hero() {
  const [panduanUrl, setPanduanUrl] = useState<string>("#program");
  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("get_panduan_url");
      if (data && typeof data === "string" && data.trim()) setPanduanUrl(data.trim());
    })();
  }, []);
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <img
        src={heroImg}
        alt="Ka'bah di malam hari"
        width={1920}
        height={1080}
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-gradient-glow" />
      <IslamicPattern className="absolute inset-0 size-full text-accent/10 mix-blend-overlay" />

      {/* floating ornaments */}
      <div className="absolute top-32 left-10 size-24 rounded-full bg-accent/20 blur-3xl animate-float" />
      <div className="absolute bottom-40 right-10 size-40 rounded-full bg-emerald/30 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 pt-32 pb-16 w-full">
        <div className="max-w-3xl">
          <div className="flex flex-wrap gap-2 mb-6 animate-fade-up">
            {["Fully Funded", "International Program", "Limited Seat", "Hasanah × Prestasi"].map((b) => (
              <span key={b} className="glass text-white text-xs sm:text-sm px-3 py-1.5 rounded-full">
                ✦ {b}
              </span>
            ))}
          </div>

          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-semibold text-white leading-[0.95] animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Umrah Gratis untuk{" "}
            <span className="text-gradient-gold">Generasi Berprestasi</span>
          </h1>

          <p className="mt-7 text-lg sm:text-xl text-white/85 max-w-2xl leading-relaxed animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Program <strong>Safar Iman</strong> hadir untuk membuka jalan menuju Baitullah
            bagi anak muda Indonesia melalui prestasi, kontribusi, dan semangat kebaikan.
          </p>

          <div className="mt-9 flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Link
              to="/daftar"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-7 py-4 text-base font-semibold shadow-gold hover-lift"
            >
              Daftar Sekarang
              <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href={panduanUrl}
              {...(panduanUrl.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="inline-flex items-center gap-2 rounded-full glass text-white px-7 py-4 text-base font-medium hover:bg-white/20 transition-colors"
            >
              Panduan
            </a>
          </div>

          {/* countdown moved to its own section above Program Benefit */}
        </div>
      </div>

      <div className="absolute bottom-6 inset-x-0 flex justify-center text-white/50 text-xs animate-float">
        ↓ Scroll
      </div>
    </section>
  );
}

function CountdownSection() {
  return (
    <section className="relative py-16 sm:py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/40 to-background" />
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <span className="inline-flex items-center gap-2 bg-emerald-deep text-accent text-xs uppercase tracking-[0.3em] px-4 py-1.5 rounded-full mb-6 shadow-emerald">
          <Sparkles className="size-3.5 text-accent" /> Pendaftaran ditutup dalam
        </span>
        <Countdown />
      </div>
    </section>
  );
}

function Benefits() {
  const items = [
    { i: Plane, t: "Umrah Full Experience", d: "Perjalanan ibadah lengkap dengan bimbingan ustadz." },
    { i: Globe2, t: "City Tour Internasional", d: "Eksplorasi Madinah, Dubai, dan kota islami lainnya." },
    { i: Megaphone, t: "Seminar Leadership", d: "Sesi kepemimpinan dengan tokoh internasional." },
    { i: Award, t: "Sertifikat Internasional", d: "Sertifikat resmi untuk portofolio kamu." },
    { i: BookOpen, t: "Wakaf Al-Qur'an", d: "Berbagi mushaf untuk kebaikan jangka panjang." },
    { i: Users, t: "Networking Nasional", d: "Bertemu pemuda berprestasi dari seluruh Indonesia." },
    { i: GraduationCap, t: "Campus Visit Timur Tengah", d: "Kunjungan ke universitas terkemuka di Timur Tengah." },
    { i: Heart, t: "Mentor & Pembinaan", d: "Pendampingan langsung dari mentor berpengalaman." },
  ];
  return (
    <section id="program" className="relative py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Program Benefit"
          title={<>Lebih dari sekadar <span className="text-gradient-emerald">perjalanan</span></>}
          subtitle="Sebuah pengalaman transformatif yang menggabungkan ibadah, ilmu, dan kontribusi."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-16">
          {items.map((b, idx) => (
            <div
              key={b.t}
              className="group relative bg-card rounded-3xl p-7 shadow-soft hover-lift border border-border/50 animate-fade-up"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="size-14 rounded-2xl bg-gradient-emerald grid place-items-center mb-5 shadow-emerald group-hover:scale-110 transition-transform">
                <b.i className="size-6 text-accent" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground">{b.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


function Persyaratan() {
  const items = [
    "Muslim/Muslimah yang siap menjalankan ibadah dengan niat yang lurus.",
    "Pemuda-pemudi Indonesia berusia 12 – 40 tahun, terbuka untuk pelajar, mahasiswa, hingga alumni dari berbagai jenjang.",
    "Bersedia mengikuti seluruh rangkaian kegiatan dari awal hingga akhir sesuai jadwal program.",
    "Tidak perlu mahir Bahasa Inggris maupun Bahasa Arab — peserta didampingi pembimbing berbahasa Indonesia.",
    "Tidak harus memiliki latar belakang ilmu agama yang mendalam — kita akan belajar bersama mentor.",
  ];
  return (
    <section id="persyaratan" className="relative py-24 sm:py-32 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Persyaratan Umum"
          title={<>Siapa saja yang <span className="text-gradient-gold">dapat mendaftar</span></>}
          subtitle="Program Safar Iman terbuka luas untuk pemuda-pemudi Indonesia yang siap menempuh perjalanan keimanan."
        />
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mt-16 items-center">
          <div className="rounded-3xl border border-border bg-card p-7 sm:p-9 shadow-soft animate-fade-up">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 className="size-5 text-accent" />
              <h3 className="font-display text-2xl font-semibold text-gradient-gold">Kriteria Peserta</h3>
            </div>
            <ul className="space-y-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
              {items.map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className={`mt-0.5 size-6 shrink-0 rounded-full grid place-items-center text-xs font-semibold ${i < 3 ? "bg-emerald/10 text-emerald" : "bg-accent/15 text-accent"}`}>
                    {i + 1}
                  </span>
                  <span className="text-foreground/90">{t}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-muted-foreground italic border-t border-border pt-4">
              *Ketentuan selengkapnya tersedia pada buku panduan program.
            </p>
            <Link
              to="/daftar"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-emerald text-accent px-6 py-3 text-sm font-semibold shadow-emerald hover-lift"
            >
              Daftar Sekarang <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="relative animate-scale-in">
            <div className="absolute -inset-3 bg-gradient-gold opacity-20 blur-2xl rounded-3xl" />
            <div className="relative rounded-3xl overflow-hidden shadow-emerald ring-1 ring-accent/30">
              <img
                src={persyaratanPoster}
                alt="Pemuda Indonesia dalam perjalanan ibadah Safar Iman"
                loading="lazy"
                width={1024}
                height={1024}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


function Quota() {
  const facilities = [
    { icon: Plane, label: "Tiket Pesawat PP" },
    { icon: Briefcase, label: "Bagasi" },
    { icon: Hotel, label: "Hotel" },
    { icon: UtensilsCrossed, label: "Makan" },
    { icon: Bus, label: "Bis" },
    { icon: BadgeCheck, label: "Visa" },
    { icon: UserCheck, label: "Muthawif" },
    { icon: Compass, label: "Tour Leader" },
    { icon: Luggage, label: "Handling" },
    { icon: ShoppingBag, label: "Perlengkapan Lengkap" },
    { icon: MapPin, label: "City Tour Internasional" },
  ];
  return (
    <section id="kuota" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Kuota Program"
          title={<>Kesempatan menuju <span className="text-gradient-gold">Baitullah</span></>}
          subtitle="Program fully funded dengan fasilitas lengkap plus city tour internasional untuk pengalaman tak terlupakan."
        />

        {/* Single facility card */}
        <div className="relative mt-16 max-w-6xl mx-auto">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <span className="text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full bg-gradient-gold text-emerald-deep shadow-gold">
              Most Competitive
            </span>
          </div>
          <div className="rounded-3xl bg-gradient-emerald text-white p-8 sm:p-10 shadow-emerald ring-2 ring-accent/40">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 text-white px-3 py-1 text-xs font-semibold mb-3">
                  <Sparkles className="size-3.5 text-accent" /> Fasilitas Lengkap
                </span>
                <h3 className="font-display text-4xl sm:text-5xl font-semibold">Fully Funded</h3>
                <p className="text-white/70 mt-1">Kuota: 3 Orang Berprestasi</p>
              </div>
              <div className="text-right">
                <div className="font-display text-4xl sm:text-5xl font-semibold text-gradient-gold">{"\n"}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-5 p-6 rounded-2xl bg-white/5 backdrop-blur ring-1 ring-white/10">
              {facilities.map((f) => (
                <div key={f.label} className="flex flex-col items-center text-center gap-2">
                  <div className="size-14 rounded-full bg-gradient-gold grid place-items-center shadow-gold">
                    <f.icon className="size-6 text-emerald-deep" />
                  </div>
                  <span className="text-xs font-semibold leading-tight text-white/90">{f.label}</span>
                </div>
              ))}
            </div>

            <Link
              to="/daftar"
              className="mt-8 w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-6 py-4 font-semibold shadow-gold hover-lift"
            >
              Daftar Fully Funded <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Timeline() {
  const steps: { i: typeof ClipboardList; t: string; d: string; date: string; cta?: { label: string; to: "/daftar" | "/twibbon" | "/berkas" | "/essay" } }[] = [
    { i: ClipboardList, t: "Pendaftaran Dibuka", d: "Lengkapi formulir & dapatkan Kode Pendaftaran", date: "1 Juni – 31 Juli 2026", cta: { label: "Daftar Sekarang", to: "/daftar" } },
    { i: Megaphone, t: "Bagikan Twibbon", d: "Download frame & share di sosial media", date: "1 Juni – 5 Agustus 2026", cta: { label: "Buat Twibbon", to: "/twibbon" } },
    { i: ClipboardList, t: "Pengiriman Berkas", d: "Masukkan Kode Pendaftaran & kirim data berkas pendukung", date: "1 Juni – 10 Agustus 2026", cta: { label: "Kirim Berkas", to: "/berkas" } },
    { i: CheckCircle2, t: "Seleksi Administrasi", d: "Verifikasi berkas oleh tim kami", date: "11 – 25 Agustus 2026" },
    { i: ClipboardList, t: "Pengisian Essay", d: "Setelah lolos administrasi & tunaikan kontribusi, lanjut isi essay", date: "26 Agustus – 10 September 2026", cta: { label: "Kirim Essay", to: "/essay" } },
    { i: MessageSquare, t: "Interview Peserta", d: "Sesi wawancara online", date: "15 – 30 September 2026" },
    { i: Megaphone, t: "Pengumuman", d: "Diumumkan via email & web", date: "10 Oktober 2026" },
    { i: Users2, t: "Technical Meeting", d: "Briefing keberangkatan", date: "Akhir Oktober 2026" },
    { i: Rocket, t: "Keberangkatan", d: "Perjalanan ke Tanah Suci", date: "November 2026" },
  ];
  return (
    <section id="timeline" className="relative py-24 sm:py-32 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Timeline Program"
          title={<>Perjalanan menuju <span className="text-gradient-emerald">keberangkatan</span></>}
          subtitle="Sembilan tahap yang akan kamu lalui menuju Baitullah."
        />
        <div className="relative mt-16">
          <div className="absolute left-6 sm:left-1/2 sm:-translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-accent/50 to-transparent" />
          {steps.map((s, idx) => (
            <div
              key={s.t}
              className={`relative grid sm:grid-cols-2 gap-6 mb-10 animate-fade-up ${
                idx % 2 === 0 ? "" : "sm:[&>*:first-child]:order-2"
              }`}
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className={`pl-16 sm:pl-0 ${idx % 2 === 0 ? "sm:text-right sm:pr-12" : "sm:pl-12"}`}>
                <div className="bg-card rounded-2xl p-6 shadow-soft border border-border/50 hover-lift">
                  <div className="text-xs uppercase tracking-[0.2em] text-accent font-semibold">Tahap {idx + 1}</div>
                  <h3 className="font-display text-2xl font-semibold mt-2">{s.t}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">{s.d}</p>
                  {s.cta && (
                    <Link
                      to={s.cta.to}
                      className={`mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-gold text-emerald-deep px-4 py-2 text-xs font-semibold shadow-gold hover-lift ${
                        idx % 2 === 0 ? "sm:ml-auto" : ""
                      }`}
                    >
                      {s.cta.label} <ArrowRight className="size-3.5" />
                    </Link>
                  )}
                </div>
              </div>
              <div className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 top-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-accent/40 rounded-full blur-lg" />
                  <div className="relative size-12 rounded-full bg-gradient-gold grid place-items-center shadow-gold">
                    <s.i className="size-5 text-emerald-deep" />
                  </div>
                </div>
              </div>
              <div className="hidden sm:block" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { n: "Aisyah R.", r: "Alumni Umrah 2024", q: "Pengalaman spiritual dan profesional yang berubah hidup. Networking-nya luar biasa.", rating: 5 },
    { n: "Fahri H.", r: "Mahasiswa UI", q: "Seleksi yang adil, fasilitas premium. Saya pulang dengan motivasi baru.", rating: 5 },
    { n: "Salma K.", r: "Influencer Muslim", q: "Konsep program-nya brilian. Memadukan ibadah, ilmu, dan kontribusi.", rating: 5 },
    { n: "Rizky A.", r: "Pelajar SMA", q: "Awalnya tidak percaya gratis, ternyata benar fully funded. Alhamdulillah.", rating: 5 },
  ];
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Testimoni"
          title={<>Cerita dari para <span className="text-gradient-gold">alumni</span></>}
          subtitle="Kesaksian peserta yang telah merasakan transformasi Safar Iman."
        />
        <Carousel className="mt-16" opts={{ align: "start", loop: true }}>
          <CarouselContent>
            {items.map((it, idx) => (
              <CarouselItem key={idx} className="md:basis-1/2 lg:basis-1/3">
                <div className="bg-card rounded-3xl p-7 border border-border/50 shadow-soft h-full hover-lift">
                  <div className="flex gap-1 mb-4">
                    {[...Array(it.rating)].map((_, i) => (
                      <Star key={i} className="size-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="font-display text-lg leading-relaxed text-foreground">&ldquo;{it.q}&rdquo;</p>
                  <div className="mt-6 flex items-center gap-3 pt-5 border-t border-border">
                    <div className="size-11 rounded-full bg-gradient-emerald grid place-items-center text-accent font-semibold">
                      {it.n.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{it.n}</div>
                      <div className="text-xs text-muted-foreground">{it.r}</div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}

function Gallery() {
  const imgs = [
    { src: heroImg, alt: "Ka'bah", c: "row-span-2" },
    { src: madinahImg, alt: "Madinah", c: "" },
    { src: seminarImg, alt: "Seminar", c: "" },
    { src: dubaiImg, alt: "Dubai", c: "" },
    { src: cappadociaImg, alt: "Cappadocia", c: "col-span-2" },
    { src: sharingImg, alt: "Berbagi", c: "" },
  ];
  return (
    <section id="galeri" className="py-24 sm:py-32 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Galeri"
          title={<>Jejak <span className="text-gradient-emerald">Safar Iman</span></>}
          subtitle="Momen ibadah, ilmu, dan kebaikan dari perjalanan sebelumnya."
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-14 auto-rows-[180px] sm:auto-rows-[220px]">
          {imgs.map((img, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-2xl group cursor-pointer animate-scale-in ${img.c}`}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                width={800}
                height={600}
                className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-4 left-4 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                <MapPin className="size-3.5" /> {img.alt}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    { q: "Apakah benar program ini gratis?", a: "Ya, untuk jalur Fully Funded seluruh biaya ditanggung 100% termasuk tiket, visa, hotel, dan uang saku. Jalur Partial mendapat subsidi, jalur Self Funded bersifat mandiri." },
    { q: "Apakah wajib bisa berbahasa Arab?", a: "Tidak wajib. Namun kemampuan dasar bahasa Arab atau Inggris menjadi nilai tambah dalam seleksi." },
    { q: "Apakah mahasiswa atau pelajar boleh mendaftar?", a: "Boleh. Program ini terbuka untuk anak muda usia 17–30 tahun, baik pelajar, mahasiswa, maupun profesional muda." },
    { q: "Bagaimana sistem seleksi peserta?", a: "Seleksi terdiri dari verifikasi administrasi, penilaian essay, dan wawancara online. Penilaian mencakup prestasi, kontribusi sosial, dan motivasi." },
    { q: "Apakah ada biaya tersembunyi?", a: "Tidak ada. Semua biaya transparan sesuai jalur yang dipilih. Kami menjamin tidak ada pungutan tambahan di luar yang tercantum." },
  ];
  return (
    <section id="faq" className="py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="FAQ"
          title={<>Pertanyaan yang <span className="text-gradient-gold">sering diajukan</span></>}
          subtitle="Jawaban untuk pertanyaan paling umum tentang Safar Iman."
        />
        <Accordion type="single" collapsible className="mt-14 space-y-4">
          {items.map((it, idx) => (
            <AccordionItem
              key={idx}
              value={`item-${idx}`}
              className="bg-card border border-border rounded-2xl px-6 shadow-soft"
            >
              <AccordionTrigger className="text-left font-display text-lg font-semibold hover:no-underline">
                {it.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {it.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <img src={heroImg} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-deep/90 via-emerald-deep/85 to-emerald-deep/95" />
      <div className="absolute inset-0 bg-gradient-glow" />
      <IslamicPattern className="absolute inset-0 size-full text-accent/10" />
      <div className="absolute top-20 left-1/4 size-32 rounded-full bg-accent/20 blur-3xl animate-float" />
      <div className="absolute bottom-20 right-1/4 size-40 rounded-full bg-emerald/40 blur-3xl animate-float" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <GeometricOrnament className="w-40 h-10 text-accent mx-auto mb-6 opacity-70" />
        <h2 className="font-display text-4xl sm:text-6xl lg:text-7xl font-semibold text-white leading-tight">
          Langkah kecil hari ini,<br />
          <span className="text-gradient-gold">menuju Baitullah esok hari</span>
        </h2>
        <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">
          Jangan lewatkan kesempatan emas ini. Daftarkan dirimu sekarang dan jadilah bagian dari perjalanan transformatif Safar Iman.
        </p>
        <Link
          to="/daftar"
          className="mt-10 inline-flex items-center gap-3 rounded-full bg-gradient-gold text-emerald-deep px-10 py-5 text-lg font-bold shadow-gold hover-lift animate-glow-pulse"
        >
          Daftar Sekarang <ArrowRight className="size-5" />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  const socials = [
    {
      brand: "Safar Iman",
      handle: "@safariman.id",
      url: "https://instagram.com/safariman.id",
    },
    {
      brand: "Hasanah Tour & Travel",
      handle: "@hasanah.tours.travel",
      url: "https://instagram.com/hasanah.tours.travel",
    },
    {
      brand: "Hasanah Haji Umroh Semarang",
      handle: "@hasanah.hajiumrohsemarang",
      url: "https://instagram.com/hasanah.hajiumrohsemarang",
    },
    {
      brand: "Prestasi Kita",
      handle: "@prestasikita",
      url: "https://instagram.com/prestasikita",
    },
  ];
  return (
    <footer className="bg-emerald-deep text-white/80 pt-16 pb-8 relative overflow-hidden">
      <IslamicPattern className="absolute inset-0 size-full text-white/5" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid md:grid-cols-12 gap-10">
          {/* Brand */}
          <div className="md:col-span-4">
            <div className="bg-white inline-flex rounded-xl px-3 py-2 shadow-gold">
              <img src={logoSafarIman} alt="Safar Iman" className="h-10 w-auto" />
            </div>
            <p className="mt-5 text-sm text-white/70 leading-relaxed max-w-sm">
              Program Umrah Gratis untuk generasi muda berprestasi Indonesia — kolaborasi <strong className="text-white">Hasanah Tour & Travel</strong> × <strong className="text-white">Prestasi Kita</strong>.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
                <BadgeCheck className="size-3.5" /> Berizin Kemenag
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="md:col-span-2">
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Navigasi</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#program" className="hover:text-accent transition-colors">Program</a></li>
              <li><a href="#kuota" className="hover:text-accent transition-colors">Kuota</a></li>
              <li><a href="#timeline" className="hover:text-accent transition-colors">Timeline</a></li>
              <li><a href="#faq" className="hover:text-accent transition-colors">FAQ</a></li>
              <li><Link to="/tentang" className="hover:text-accent transition-colors">Tentang</Link></li>
            </ul>
          </div>

          {/* Kontak */}
          <div className="md:col-span-3">
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Kontak</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <Phone className="size-4 text-accent shrink-0 mt-0.5" />
                <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">+62 812-3456-7890</a>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="size-4 text-accent shrink-0 mt-0.5" />
                <a href="mailto:hello@safariman.id" className="hover:text-accent transition-colors">hello@safariman.id</a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPinned className="size-4 text-accent shrink-0 mt-0.5" />
                <span>Semarang, Indonesia</span>
              </li>
            </ul>
          </div>

          {/* Instagram */}
          <div className="md:col-span-3">
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Ikuti Kami di Instagram</h4>
            <ul className="space-y-2.5">
              {socials.map((s) => (
                <li key={s.handle}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 transition-colors"
                  >
                    <div className="size-8 rounded-lg bg-gradient-to-br from-pink-500 via-fuchsia-500 to-amber-400 grid place-items-center shrink-0">
                      <Instagram className="size-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-white/60 truncate">{s.brand}</div>
                      <div className="text-sm text-white font-medium truncate group-hover:text-accent transition-colors">{s.handle}</div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="ornament-divider my-10" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <div>© {new Date().getFullYear()} Safar Iman — Hasanah Tour & Travel × Prestasi Kita. Semua hak dilindungi.</div>
          <div className="flex items-center gap-4">
            <Link to="/tentang" className="hover:text-accent transition-colors">Tentang</Link>
            <Link to="/daftar" className="hover:text-accent transition-colors">Daftar</Link>
            <Link to="/admin/login" className="hover:text-accent transition-colors">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SectionHeading({
  eyebrow, title, subtitle,
}: { eyebrow: string; title: React.ReactNode; subtitle: string }) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <div className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">{eyebrow}</div>
      <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold mt-3 leading-tight">
        {title}
      </h2>
      <p className="mt-4 text-base sm:text-lg text-muted-foreground">{subtitle}</p>
      <GeometricOrnament className="w-32 h-8 text-accent mx-auto mt-4 opacity-60" />
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <CountdownSection />
        <Benefits />
        <Persyaratan />
        <Quota />
        <Timeline />
        <Testimonials />
        <Gallery />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
