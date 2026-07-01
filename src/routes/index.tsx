import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles, Globe2, Award, BookOpen, Users, Building2, Heart,
  Plane, Hotel, Wallet, Star, CheckCircle2, ArrowRight, MapPin,
  CalendarCheck, ClipboardList, MessageSquare, Megaphone, Users2, Rocket,
  Briefcase, UtensilsCrossed, Bus, BadgeCheck, UserCheck, Compass, Luggage, ShoppingBag, ShieldCheck,
  Instagram, Mail, Phone, MapPinned,
} from "lucide-react";
import { fetchTimeline, getIcon, DEFAULT_TIMELINE, type TimelineStep } from "@/lib/timeline";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Countdown } from "@/components/Countdown";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { IslamicPattern, GeometricOrnament } from "@/components/IslamicPattern";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { AffiliateLink } from "@/components/AffiliateLink";

import heroImg from "@/assets/hero-jamaah-madinah.jpg";
import madinahImg from "@/assets/madinah.jpg";
import dubaiImg from "@/assets/dubai.jpg";
import makkahEscalatorImg from "@/assets/makkah-escalator.jpg";
import seminarImg from "@/assets/seminar.jpg";
import sharingImg from "@/assets/sharing.jpg";
import persyaratanPoster from "@/assets/persyaratan-poster.jpg";
import hasanahFaqUrl from "@/assets/hasanah-faq.png";
const hasanahFaq = { url: hasanahFaqUrl };
import logoSafarIman from "@/assets/logo-safar-iman.png";
import logoHasanah from "@/assets/logo-hasanah.png";
import logoSafarImanBadge from "@/assets/logo-safar-iman-badge.png";
import legalitasBadges from "@/assets/legalitas-badges-hd.png";
import galKabahMalam from "@/assets/galeri-kabah-malam.png.asset.json";
import galMadinahPayung from "@/assets/galeri-madinah-payung.png.asset.json";
import galKabahGrup from "@/assets/galeri-kabah-grup.png.asset.json";
import galJabalRahmah from "@/assets/galeri-jabal-rahmah.png.asset.json";
import galUmrohNovember from "@/assets/galeri-umroh-november.png.asset.json";
import galTurkiyeHagia from "@/assets/galeri-turkiye-hagia.png.asset.json";
import galMasjidQuba from "@/assets/galeri-masjid-quba.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Safar Iman — Umrah Gratis Fully Funded untuk Anak Muda Indonesia" },
      { name: "description", content: "Program Umrah Gratis untuk generasi muda Indonesia: Umrah, Ibadah, City Tour, Wakaf & Islamic Journey Experience." },
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
    { href: "/cek-tahapan", label: "Cek Tahapan" },
    { href: "/faq", label: "FAQ" },
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
          <AffiliateLink
            selectorId="nav_daftar"
            to="/pendaftaran"
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-5 py-2.5 text-sm font-semibold shadow-gold hover-lift"
          >
            Daftar Sekarang <ArrowRight className="size-4" />
          </AffiliateLink>
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
            <AffiliateLink selectorId="nav_daftar" to="/pendaftaran" onNavigate={() => setOpen(false)} className="mt-3 block text-center rounded-full bg-gradient-gold text-emerald-deep px-5 py-3 font-semibold">
              Daftar Sekarang
            </AffiliateLink>
          </div>
        )}
      </div>
    </header>
  );
}

function Typewriter({
  words,
  typeSpeed = 110,
  deleteSpeed = 55,
  holdTime = 1600,
}: {
  words: string[];
  typeSpeed?: number;
  deleteSpeed?: number;
  holdTime?: number;
}) {
  const [wordIndex, setWordIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIndex] ?? "";
    let delay = deleting ? deleteSpeed : typeSpeed;
    if (!deleting && charCount === current.length) delay = holdTime;
    if (deleting && charCount === 0) delay = 300;

    const id = setTimeout(() => {
      if (!deleting && charCount < current.length) {
        setCharCount(charCount + 1);
      } else if (!deleting && charCount === current.length) {
        if (words.length > 1) setDeleting(true);
      } else if (deleting && charCount > 0) {
        setCharCount(charCount - 1);
      } else {
        setDeleting(false);
        setWordIndex((wordIndex + 1) % words.length);
      }
    }, delay);

    return () => clearTimeout(id);
  }, [charCount, deleting, wordIndex, words, typeSpeed, deleteSpeed, holdTime]);

  const current = words[wordIndex] ?? "";
  return (
    <span>
      {current.slice(0, charCount)}
      <span className="inline-block w-[0.08em] -mb-[0.05em] h-[0.9em] align-middle bg-current ml-1 animate-pulse" />
    </span>
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
        alt="Jamaah Umrah Safar Iman di Madinah"
        width={1920}
        height={1080}
        className="absolute inset-0 size-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-gradient-glow" />
      <IslamicPattern className="absolute inset-0 size-full text-accent/10 mix-blend-overlay" />

      {/* floating ornaments */}
      <div className="absolute top-32 left-10 size-24 rounded-full bg-accent/20 blur-3xl animate-float" />
      <div className="absolute bottom-40 right-10 size-40 rounded-full bg-emerald/30 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 pt-32 pb-16 w-full">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* LEFT: copy */}
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 animate-fade-up">
              <span className="hidden sm:block h-px w-10 bg-gradient-to-r from-transparent via-accent to-accent" />
              <span className="text-accent text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.45em] font-medium break-words">
                Safar Iman · Exclusive Edition
              </span>
              <span className="hidden sm:block h-px w-10 bg-gradient-to-l from-transparent via-accent to-accent" />
            </div>

            <h1
              className="font-display font-semibold text-white leading-[1] animate-fade-up tracking-tight"
              style={{ animationDelay: "0.1s" }}
            >
              <span className="block text-4xl sm:text-6xl md:text-7xl lg:text-7xl xl:text-[5.5rem] font-black tracking-tight drop-shadow-[0_2px_20px_rgba(0,0,0,0.4)] text-white break-words">
                Safar Iman
              </span>
              <span className="block mt-3 text-3xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-[4.5rem] text-gradient-gold min-h-[1.2em] break-words">
                <Typewriter words={["Umrah Gratis", "Fully Funded", "Tanpa Biaya", "Untuk Semua", "Makkah & Madinah"]} />
              </span>
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-3 animate-fade-up" style={{ animationDelay: "0.15s" }}>
              <span className="inline-flex items-center gap-2 rounded-full bg-accent border border-accent text-emerald-deep px-4 py-1.5 text-xs sm:text-sm font-semibold tracking-wide">
                ✦ 100% Fully Funded
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald border border-emerald text-white px-4 py-1.5 text-xs sm:text-sm font-semibold tracking-wide">
                ✦ Gratis Biaya Pendaftaran
              </span>
            </div>

            <p
              className="mt-7 text-lg sm:text-xl text-white/85 max-w-2xl leading-relaxed animate-fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              Program <strong className="text-white">Safar Iman</strong> membuka jalan menuju Baitullah
              bagi anak muda Indonesia — pengalaman Umrah, Ibadah, dan City Tour
              yang sepenuhnya dibiayai.
            </p>

            <div className="mt-9 flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <AffiliateLink
                selectorId="hero_daftar"
                to="/pendaftaran"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-7 py-4 text-base font-semibold shadow-gold hover-lift"
              >
                Daftar Sekarang
                <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
              </AffiliateLink>
              <a
                href={panduanUrl}
                {...(panduanUrl.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="inline-flex items-center gap-2 rounded-full glass text-white px-7 py-4 text-base font-medium hover:bg-white/20 transition-colors border border-white/20"
              >
                Panduan Link
              </a>
            </div>
          </div>

          {/* RIGHT: stacked image collage */}
          <div className="lg:col-span-5 hidden lg:block animate-fade-up" style={{ animationDelay: "0.25s" }}>
            <div className="relative aspect-[4/5] w-full max-w-md ml-auto">
              {/* gold frame glow */}
              <div className="absolute -inset-3 rounded-[2rem] bg-gradient-gold opacity-20 blur-2xl" />

              {/* main card — Madinah */}
              <div className="absolute inset-0 rounded-[1.75rem] overflow-hidden border border-accent/30 shadow-gold">
                <img
                  src={galMadinahPayung.url}
                  alt="Masjid Nabawi - Payung Madinah"
                  className="size-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/80 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/90 text-emerald-deep px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                    ✦ Destinasi
                  </span>
                  <p className="mt-2 font-display text-2xl text-white drop-shadow">Masjid Nabawi</p>
                  <p className="text-xs text-white/80">Payung Raksasa · Madinah, Saudi Arabia</p>
                </div>
              </div>

              {/* floating logo badge */}
              <div className="absolute -top-6 -left-6 size-28 rounded-2xl bg-white border border-accent/40 shadow-gold flex items-center justify-center p-3 rotate-[-6deg] hover:rotate-0 transition-transform">
                <img src={logoSafarImanBadge} alt="Safar Iman" className="size-full object-contain" />
              </div>

              {/* floating mini card — Eskalator Masjidil Haram */}
              <div className="absolute -bottom-6 -right-6 size-32 rounded-2xl overflow-hidden border border-accent/40 shadow-emerald rotate-[6deg] hover:rotate-0 transition-transform">
                <img src={galKabahGrup.url} alt="Jamaah di Masjidil Haram" className="size-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/70 to-transparent" />
                <span className="absolute bottom-2 left-2 right-2 text-[10px] font-bold uppercase tracking-wider text-accent">
                  Masjidil Haram
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="absolute bottom-6 inset-x-0 flex justify-center text-white/50 text-xs animate-float">
        ↓ Scroll
      </div>
    </section>
  );
}

function CountdownSection() {
  const [enabled, setEnabled] = useState<boolean>(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("get_countdown_enabled");
      if (typeof data === "boolean") setEnabled(data);
    })();
  }, []);
  if (!enabled) return null;
  return (
    <section className="relative py-16 sm:py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/40 to-background" />
      <IslamicPattern className="absolute inset-0 size-full text-emerald/[0.04]" />
      {/* Decorative corner ornaments */}
      <div className="absolute top-4 left-4 size-24 border border-accent/20 rounded-full opacity-40" />
      <div className="absolute bottom-4 right-4 size-16 border border-primary/20 rounded-full opacity-40" />
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
    { i: Plane, t: "Umrah Full Experience", d: "Perjalanan ibadah lengkap dengan bimbingan ustadz.", variant: "emerald" as const },
    { i: Globe2, t: "City Tour Tanah Suci", d: "Eksplorasi Jabal Uhud, Masjid Quba, Jabal Rahmah, Jabal Nur, dan situs bersejarah Makkah-Madinah.", variant: "gold" as const },
    { i: Megaphone, t: "Jelajah Sejarah Nabi", d: "Belajar langsung dari jejak sejarah nabi di Makkah dan Madinah", variant: "emerald" as const },
    { i: Award, t: "Sertifikat Internasional", d: "Sertifikat resmi untuk portofolio kamu.", variant: "gold" as const },
    { i: BookOpen, t: "Sedekah Al-Qur'an", d: "Berbagi mushaf untuk kebaikan jangka panjang.", variant: "emerald" as const },
    { i: Users, t: "Networking Nasional", d: "Bertemu pemuda Indonesia dari berbagai daerah.", variant: "gold" as const },
    { i: UtensilsCrossed, t: "Berbagi Makanan di Makkah dan Madinah", d: "Menjangkau saudara yang membutuhkan di Tanah Suci.", variant: "emerald" as const },
    { i: Heart, t: "Mentor & Pembinaan", d: "Pendampingan langsung dari mentor berpengalaman.", variant: "gold" as const },
  ];

  return (
    <section id="program" className="relative py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />
      <IslamicPattern className="absolute inset-0 size-full text-accent/[0.04]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Program Benefit"
          title={<>Lebih dari sekadar <span className="text-gradient-emerald">perjalanan</span></>}
          subtitle="Sebuah pengalaman transformatif yang menggabungkan ibadah, ilmu, dan kontribusi."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-16">
          {items.map((b, idx) => {
            const isEmerald = b.variant === "emerald";
            return (
              <div
                key={b.t}
                className="group relative rounded-3xl bg-card border border-border p-6 shadow-soft hover-lift animate-fade-up"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div
                  className={`size-14 rounded-2xl grid place-items-center mb-5 transition-transform group-hover:scale-110 ${
                    isEmerald ? "bg-emerald/10" : "bg-accent/10"
                  }`}
                >
                  <b.i
                    className={`size-6 ${isEmerald ? "text-emerald" : "text-accent"}`}
                    strokeWidth={1.75}
                  />
                </div>

                <h3 className="font-display text-xl font-semibold leading-tight text-card-foreground">
                  {b.t}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {b.d}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}



function Persyaratan() {
  const items = [
    "Muslim/Muslimah yang memiliki niat kuat untuk beribadah dan belajar.",
    "Warga Negara Indonesia usia 12–45 tahun.",
    "Terbuka untuk pelajar, mahasiswa, santri, maupun umum.",
    "Bersedia mengikuti seluruh tahapan dan ketentuan program.",
    "Memiliki sikap disiplin, bertanggung jawab, dan berakhlak baik.",
    "Siap mengikuti pembinaan, mentoring, dan kegiatan program.",
    "Tidak wajib fasih Bahasa Arab atau Bahasa Inggris.",
    "Terbuka bagi peserta dari berbagai latar belakang pendidikan.",
  ];
  return (
    <section id="persyaratan" className="relative py-24 sm:py-32 bg-secondary/30">
      <IslamicPattern className="absolute inset-0 size-full text-emerald/[0.035]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Persyaratan Umum"
          title={<>Siapa saja yang <span className="text-gradient-gold">dapat mendaftar</span></>}
          subtitle="Program Safar Iman terbuka luas untuk pemuda-pemudi Indonesia yang siap menempuh perjalanan keimanan."
        />
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mt-16 items-center">
          <div className="rounded-3xl border border-border bg-card p-7 sm:p-9 shadow-soft animate-fade-up">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 className="size-5 text-accent" />
              <h3 className="font-display text-2xl font-semibold text-gradient-gold">Persyaratan Umum</h3>
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
              to="/pendaftaran"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-6 py-3 text-sm font-semibold shadow-gold hover-lift"
            >
              Daftar Sekarang <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="relative animate-scale-in flex items-end justify-center">
            {/* Decorative stroke line */}
            <div aria-hidden className="absolute inset-x-4 bottom-6 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
            <div aria-hidden className="absolute inset-x-12 bottom-3 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
            <img
              src={hasanahFaq.url}
              alt="Jamaah Hasanah berihram"
              loading="lazy"
              width={1024}
              height={1024}
              className="relative w-full max-w-md h-auto object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.25)]"
            />
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
    { icon: MapPin, label: "City Tour Makkah & Madinah" },
    { icon: ShieldCheck, label: "Asuransi Perjalanan" },
  ];
  return (
    <section id="kuota" className="relative py-24 sm:py-32">
      <IslamicPattern className="absolute inset-0 size-full text-accent/[0.03]" />
      {/* Decorative floating shapes */}
      <div className="absolute top-16 right-12 size-32 rounded-full bg-gradient-gold opacity-[0.07] blur-2xl animate-float" />
      <div className="absolute bottom-24 left-8 size-24 rounded-full bg-emerald opacity-[0.06] blur-2xl animate-float" style={{ animationDelay: "2s" }} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Kuota Program"
          title={<>Kesempatan menuju <span className="text-gradient-gold">Baitullah</span></>}
          subtitle="Program fully funded dengan fasilitas lengkap plus city tour situs bersejarah Makkah & Madinah untuk pengalaman tak terlupakan."
        />

        {/* Single facility card */}
        <div className="relative mt-16 max-w-6xl mx-auto">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <span className="text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full bg-gradient-gold text-emerald-deep shadow-gold">
              EKSLUSIF
            </span>
          </div>
          <div className="rounded-3xl bg-gradient-emerald text-white p-8 sm:p-10 shadow-emerald ring-2 ring-accent/40">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 text-white px-3 py-1 text-xs font-semibold mb-3">
                  <Sparkles className="size-3.5 text-accent" /> Fasilitas Lengkap
                </span>
                <h3 className="font-display text-4xl sm:text-5xl font-semibold">Fully Funded</h3>
                <p className="text-white/70 mt-1">Dibiaya penuh untuk penerima Program Safar Iman</p>
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
              to="/pendaftaran"
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
  const [steps, setSteps] = useState<TimelineStep[]>(DEFAULT_TIMELINE);
  useEffect(() => {
    fetchTimeline().then((arr) => {
      if (arr.length > 0) setSteps(arr);
    });
  }, []);
  return (
    <section id="timeline" className="relative py-24 sm:py-32 bg-secondary/30">
      <IslamicPattern className="absolute inset-0 size-full text-emerald/[0.035]" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Timeline Program"
          title={<>Perjalanan menuju <span className="text-gradient-emerald">keberangkatan</span></>}
          subtitle="Sebelas tahap yang akan kamu lalui menuju Baitullah."
        />
        <div className="relative mt-16">
          {/* Main vertical rail */}
          <div className="absolute left-6 sm:left-1/2 sm:-translate-x-1/2 top-0 bottom-0 w-[3px] rounded-full bg-gradient-to-b from-primary/20 via-primary to-emerald/60" />
          {/* Animated shimmer overlay on the rail */}
          <div
            className="absolute left-6 sm:left-1/2 sm:-translate-x-1/2 top-0 bottom-0 w-[3px] rounded-full opacity-70 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(180deg, transparent 0%, oklch(0.5 0.13 160 / 0.9) 50%, transparent 100%)",
              backgroundSize: "100% 200px",
              backgroundRepeat: "no-repeat",
              animation: "timeline-flow 6s linear infinite",
            }}
          />
          {/* Decorative dashed line behind, for texture */}
          <div
            className="absolute left-6 sm:left-1/2 sm:-translate-x-1/2 top-0 bottom-0 w-px pointer-events-none opacity-60"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, oklch(0.36 0.09 160 / 0.5) 0 6px, transparent 6px 14px)",
            }}
          />
          <style>{`
            @keyframes timeline-flow {
              0% { background-position: 0 -200px; }
              100% { background-position: 0 calc(100% + 200px); }
            }
            @keyframes node-ping {
              0% { transform: scale(1); opacity: 0.6; }
              80%, 100% { transform: scale(1.8); opacity: 0; }
            }
          `}</style>
          {steps.map((s, idx) => {
            const btnColors = [
              { bg: "bg-gradient-gold", text: "text-emerald-deep", shadow: "shadow-gold" },
            ];

            const c = btnColors[idx % btnColors.length];
            const Icon = getIcon(s.icon);
            return (
              <div
                key={`${idx}-${s.title}`}
                className={`relative grid sm:grid-cols-2 gap-6 mb-10 animate-fade-up ${
                  idx % 2 === 0 ? "" : "sm:[&>*:first-child]:order-2"
                }`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className={`pl-16 sm:pl-0 ${idx % 2 === 0 ? "sm:text-right sm:pr-12" : "sm:pl-12"}`}>
                  <div className="relative bg-card rounded-2xl p-6 shadow-soft border border-border/50 hover-lift group">
                    <div
                      className={`hidden sm:block absolute top-8 h-px w-10 pointer-events-none ${
                        idx % 2 === 0 ? "right-[-2.5rem]" : "left-[-2.5rem]"
                      }`}
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(to right, oklch(0.36 0.09 160 / 0.6) 0 6px, transparent 6px 10px)",
                      }}
                    />
                    <div
                      className="sm:hidden absolute top-8 left-[-2.5rem] h-px w-10 pointer-events-none"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(to right, oklch(0.36 0.09 160 / 0.6) 0 6px, transparent 6px 10px)",
                      }}
                    />
                    <div className={`flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent font-semibold ${idx % 2 === 0 ? "sm:justify-end" : ""}`}>
                      <span className="inline-flex items-center justify-center size-6 rounded-full bg-gradient-emerald text-white text-[11px] font-bold shadow-emerald">
                        {idx + 1}
                      </span>
                      <span className="text-muted-foreground/60">•</span>
                      <span className="text-foreground/70 normal-case tracking-normal font-medium">{s.date}</span>
                    </div>
                    <h3 className="font-display text-2xl font-semibold mt-2">{s.title}</h3>
                    <p className="text-muted-foreground mt-1 text-sm">{s.desc}</p>
                    {s.ctaLabel && s.ctaTo && (
                      <Link
                        to={s.ctaTo as never}
                        className={`mt-4 inline-flex items-center gap-1.5 rounded-full ${c.bg} ${c.text} px-4 py-2 text-xs font-semibold ${c.shadow} hover-lift ${
                          idx % 2 === 0 ? "sm:ml-auto" : ""
                        }`}
                      >
                        {s.ctaLabel}<ArrowRight className="size-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
                <div className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 top-4 z-10">
                  <div className="relative">
                    <div
                      className="absolute inset-0 rounded-full bg-primary/40"
                      style={{ animation: `node-ping 2.4s cubic-bezier(0,0,0.2,1) infinite`, animationDelay: `${idx * 0.2}s` }}
                    />
                    <div className="absolute inset-0 bg-primary/30 rounded-full blur-lg" />
                    <div className="relative size-12 rounded-full bg-gradient-emerald grid place-items-center shadow-emerald ring-4 ring-background">
                      <Icon className="size-5 text-white" />
                    </div>
                  </div>
                </div>
                <div className="hidden sm:block" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { n: "Jamaah Hasanah", r: "Jamaah Hasanah", q: "Pengalaman spiritual dan profesional yang berubah hidup. Networking-nya luar biasa.", rating: 5 },
    { n: "Jamaah Hasanah", r: "Jamaah Hasanah", q: "Seleksi yang adil, fasilitas premium. Saya pulang dengan motivasi baru.", rating: 5 },
    { n: "Jamaah Hasanah", r: "Jamaah Hasanah", q: "Konsep program-nya brilian. Memadukan ibadah, ilmu, dan kontribusi.", rating: 5 },
    { n: "Rizky A.", r: "Pelajar SMA", q: "Awalnya tidak percaya gratis, ternyata benar fully funded. Alhamdulillah.", rating: 5 },
  ];
  return (
    <section className="relative py-24 sm:py-32">
      <IslamicPattern className="absolute inset-0 size-full text-accent/[0.03]" />
      {/* Decorative floating shapes */}
      <div className="absolute top-12 left-10 size-28 rounded-full bg-gradient-emerald opacity-[0.05] blur-2xl animate-float" />
      <div className="absolute bottom-16 right-16 size-20 rounded-full bg-gradient-gold opacity-[0.06] blur-2xl animate-float" style={{ animationDelay: "1.5s" }} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
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
    { src: galKabahMalam.url, alt: "Jamaah Hasanah di depan Ka'bah", c: "row-span-2" },
    { src: galMadinahPayung.url, alt: "Masjid Nabawi - Payung Madinah", c: "" },
    { src: galKabahGrup.url, alt: "Grup jamaah di Masjidil Haram", c: "" },
    { src: galJabalRahmah.url, alt: "Jabal Rahmah", c: "" },
    { src: galUmrohNovember.url, alt: "Umroh Spesial November", c: "col-span-2", pos: "object-bottom" },
    { src: galTurkiyeHagia.url, alt: "Umroh Plus Turkiye - Hagia Sophia", c: "" },
    { src: galMasjidQuba.url, alt: "Masjid Quba", c: "" },
  ];
  return (
    <section id="galeri" className="relative py-24 sm:py-32 bg-secondary/30">
      <IslamicPattern className="absolute inset-0 size-full text-emerald/[0.035]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Galeri"
          title={<>Hasanah <span className="text-gradient-emerald">Tour & Travel</span></>}
          subtitle="Momen ibadah, ilmu, dan kebaikan dari perjalanan sebelumnya."
        />
        <div className="grid grid-cols-2 md:grid-cols-3 grid-flow-dense gap-3 sm:gap-4 mt-14 auto-rows-[180px] sm:auto-rows-[220px]">
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
                className={`size-full object-cover transition-transform duration-700 group-hover:scale-110 ${(img as any).pos ?? ""}`}
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
    { q: "Apakah benar program ini gratis?", a: "Ya, untuk jalur Fully Funded seluruh biaya ditanggung 100% termasuk tiket, visa, dan hotel. Jalur Partial mendapat subsidi, jalur Self Funded bersifat mandiri." },
    { q: "Apakah wajib bisa berbahasa Arab?", a: "Tidak wajib. Namun kemampuan dasar bahasa Arab atau Inggris menjadi nilai tambah dalam seleksi." },
    { q: "Apakah mahasiswa atau pelajar boleh mendaftar?", a: "Boleh. Program ini terbuka untuk anak muda usia 12–45 tahun, baik pelajar, mahasiswa, maupun profesional muda." },
    { q: "Bagaimana sistem seleksi peserta?", a: "Seleksi terdiri dari verifikasi administrasi, penilaian essay dan studi kasus, dan wawancara online. Penilaian mencakup prestasi, kontribusi sosial, dan motivasi." },
  ];
  return (
    <section id="faq" className="relative py-24 sm:py-32">
      <IslamicPattern className="absolute inset-0 size-full text-accent/[0.03]" />
      {/* Decorative corner elements */}
      <div className="absolute top-8 right-8 size-20 border border-accent/10 rounded-2xl rotate-12 opacity-50" />
      <div className="absolute bottom-12 left-12 size-14 border border-primary/10 rounded-full opacity-40" />
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
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
      <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/80 to-white/90" />
      <div className="absolute inset-0 bg-gradient-glow" />
      <IslamicPattern className="absolute inset-0 size-full text-emerald/5" />
      <div className="absolute top-20 left-1/4 size-32 rounded-full bg-accent/20 blur-3xl animate-float" />
      <div className="absolute bottom-20 right-1/4 size-40 rounded-full bg-gold/30 blur-3xl animate-float" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <GeometricOrnament className="w-40 h-10 text-emerald mx-auto mb-6 opacity-70" />
        <h2 className="font-display text-4xl sm:text-6xl lg:text-7xl font-semibold text-foreground leading-tight">
          Langkah kecil hari ini,<br />
          <span className="text-gradient-gold">menuju Baitullah esok hari</span>
        </h2>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Jangan lewatkan kesempatan emas ini. Daftarkan dirimu sekarang dan jadilah bagian dari perjalanan transformatif Safar Iman.
        </p>
        <Link
          to="/pendaftaran"
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
    <footer className="bg-gradient-to-b from-white via-secondary/30 to-background text-foreground/80 pt-16 pb-8 relative overflow-hidden border-t border-border">
      <IslamicPattern className="absolute inset-0 size-full text-emerald/5" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid md:grid-cols-12 gap-10">
          {/* Brand */}
          <div className="md:col-span-4">
            <div className="bg-white inline-flex rounded-xl px-3 py-2 shadow-gold">
              <img src={logoSafarIman} alt="Safar Iman" className="h-10 w-auto" />
            </div>
            <p className="mt-5 text-sm text-muted-foreground leading-relaxed max-w-sm">
              Program Umrah Gratis untuk generasi muda Indonesia — kolaborasi <strong className="text-foreground">Hasanah Tour & Travel</strong> × <strong className="text-foreground">Prestasi Kita</strong>.
            </p>

            {/* Partner logo: Hasanah Travel */}
            <div className="mt-5">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60 mb-2">Partner Resmi</p>
              <div className="bg-white rounded-xl px-4 py-3 inline-flex items-center shadow-gold">
                <img src={logoHasanah} alt="Hasanah Tour & Travel" className="h-12 w-auto" loading="lazy" />
              </div>
            </div>

            {/* Perizinan & sertifikasi */}
            <div className="mt-5">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60 mb-2">Perizinan & Legalitas</p>
              <div className="bg-white rounded-xl p-3 shadow-gold inline-block max-w-full">
                <img
                  src={legalitasBadges}
                  alt="Perizinan & Legalitas: IATA, SITU, Kemenag, AMPHURI, KAN, IATA Certified"
                  className="h-12 sm:h-14 w-auto object-contain"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="md:col-span-2">
            <h4 className="text-foreground font-semibold mb-4 text-sm uppercase tracking-wider">Navigasi</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#program" className="hover:text-emerald transition-colors">Program</a></li>
              <li><a href="#kuota" className="hover:text-emerald transition-colors">Kuota</a></li>
              <li><a href="#timeline" className="hover:text-emerald transition-colors">Timeline</a></li>
              <li><Link to="/cek-tahapan" className="hover:text-emerald transition-colors">Cek Tahapan</Link></li>
              <li><Link to="/faq" className="hover:text-emerald transition-colors">FAQ</Link></li>
              <li><Link to="/tentang" className="hover:text-emerald transition-colors">Tentang</Link></li>
            </ul>
          </div>

          {/* Kontak */}
          <div className="md:col-span-3">
            <h4 className="text-foreground font-semibold mb-4 text-sm uppercase tracking-wider">Kontak</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <Phone className="size-4 text-emerald shrink-0 mt-0.5" />
                <a href="https://wa.me/6285927443433" target="_blank" rel="noopener noreferrer" className="hover:text-emerald transition-colors">+62 859-2744-3433</a>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="size-4 text-emerald shrink-0 mt-0.5" />
                <a href="mailto:hello@safariman.id" className="hover:text-emerald transition-colors">hello@safariman.id</a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPinned className="size-4 text-emerald shrink-0 mt-0.5" />
                <span>Semarang, Indonesia</span>
              </li>
            </ul>
          </div>

          {/* Instagram */}
          <div className="md:col-span-3">
            <h4 className="text-foreground font-semibold mb-4 text-sm uppercase tracking-wider">Ikuti Kami di Instagram</h4>
            <ul className="space-y-2.5">
              {socials.map((s) => (
                <li key={s.handle}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-lg bg-muted/40 hover:bg-muted/70 border border-border px-3 py-2 transition-colors"
                  >
                    <div className="size-8 rounded-lg bg-gradient-to-br from-pink-500 via-fuchsia-500 to-amber-400 grid place-items-center shrink-0">
                      <Instagram className="size-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground/70 truncate">{s.brand}</div>
                      <div className="text-sm text-foreground font-medium truncate group-hover:text-emerald transition-colors">{s.handle}</div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="ornament-divider my-10" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/60">
          <div>© {new Date().getFullYear()} Safar Iman — Hasanah Tour & Travel × Prestasi Kita. Semua hak dilindungi.</div>
          <div className="flex items-center gap-4">
            <Link to="/tentang" className="hover:text-emerald transition-colors">Tentang</Link>
            <Link to="/pendaftaran" className="hover:text-emerald transition-colors">Daftar</Link>
            <Link to="/admin/login" className="hover:text-emerald transition-colors">Admin</Link>
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
