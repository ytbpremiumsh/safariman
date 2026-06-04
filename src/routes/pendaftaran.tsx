import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Loader2, Clock, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { IslamicPattern } from "@/components/IslamicPattern";
import {
  parseGelombangConfig,
  isSlotActive,
  formatRupiah,
  formatDateRange,
  type GelombangConfig,
  type GelombangSlot,
} from "@/lib/gelombang";
import logoSafarIman from "@/assets/logo-safar-iman.png";

export const Route = createFileRoute("/pendaftaran")({
  head: () => ({
    meta: [
      { title: "Pilih Jalur Pendaftaran — Safar Iman" },
      { name: "description", content: "Pilih jalur Reguler atau Gelombang untuk pendaftaran Program Safar Iman." },
    ],
  }),
  component: PendaftaranHub,
});

type SlotKey = "reguler" | "gelombang_1" | "gelombang_2";

const ROUTES: Record<SlotKey, string> = {
  reguler: "/daftar",
  gelombang_1: "/daftar-gelombang-1",
  gelombang_2: "/daftar-gelombang-2",
};

function PendaftaranHub() {
  const [cfg, setCfg] = useState<GelombangConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("get_gelombang_config");
      setCfg(parseGelombangConfig(typeof data === "string" ? data : null));
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/40 via-background to-secondary/30 relative">
      <IslamicPattern className="absolute inset-0 size-full text-emerald/5" />
      <div className="relative">
        <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img src={logoSafarIman} alt="Safar Iman" className="h-10 sm:h-11 w-auto" />
            </Link>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="size-4" /> Beranda
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
          <div className="text-center mb-12 animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/30 px-4 py-1.5 text-xs font-medium text-accent uppercase tracking-[0.2em] mb-4">
              <Sparkles className="size-3.5" /> Pendaftaran Program
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-semibold leading-tight">
              Pilih <span className="text-gradient-gold">Jalur Pendaftaran</span>
            </h1>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Reguler <strong>GRATIS</strong> dengan persyaratan lengkap, atau jalur <strong>Gelombang</strong> berbayar
              tanpa syarat tambahan.
            </p>
          </div>

          {loading || !cfg ? (
            <div className="grid place-items-center py-20">
              <Loader2 className="size-8 animate-spin text-accent" />
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-5 sm:gap-6">
              {(() => {
                const today = new Date();
                const g1End = new Date(cfg.gelombang_1.end + "T23:59:59+07:00");
                const g1Ended = !cfg.gelombang_1.enabled || today.getTime() > g1End.getTime();
                return (
                  <>
                    <SlotCard slotKey="reguler" slot={cfg.reguler} accent="gold" forceActive />
                    {!g1Ended ? (
                      <SlotCard slotKey="gelombang_1" slot={cfg.gelombang_1} accent="emerald" forceActive />
                    ) : (
                      <SlotCard slotKey="gelombang_1" slot={cfg.gelombang_1} accent="emerald" forceClosed closedLabel="Gelombang 1 Berakhir" />
                    )}
                    {g1Ended && (
                      <SlotCard slotKey="gelombang_2" slot={cfg.gelombang_2} accent="emerald" forceActive />
                    )}
                  </>
                );
              })()}
            </div>
          )}

          <div className="mt-10 text-center text-sm text-muted-foreground">
            Bingung memilih? Hubungi tim kami via{" "}
            <a href="https://wa.me/6281234567890" className="text-accent underline">
              WhatsApp
            </a>
            .
          </div>
        </main>
      </div>
    </div>
  );
}

function SlotCard({
  slotKey,
  slot,
  accent,
  forceActive,
  forceClosed,
  closedLabel,
}: {
  slotKey: SlotKey;
  slot: GelombangSlot;
  accent: "gold" | "emerald";
  forceActive?: boolean;
  forceClosed?: boolean;
  closedLabel?: string;
}) {
  const active = forceClosed ? false : forceActive ? true : isSlotActive(slot);
  const bullets = slot.description.split("\n").filter((s) => s.trim());
  const free = slot.price === 0;

  return (
    <div
      className={
        "relative rounded-3xl border bg-card p-6 sm:p-7 shadow-soft flex flex-col animate-fade-up transition " +
        (active ? "border-accent/50 hover:shadow-gold" : "border-border opacity-75")
      }
    >
      {accent === "gold" && (
        <div className="absolute -top-3 left-6">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold bg-gradient-gold text-emerald-deep px-3 py-1.5 rounded-full shadow-gold">
            <Sparkles className="size-3" /> Paling Populer
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">
            {slotKey === "reguler" ? "Jalur Gratis" : "Jalur Berbayar"}
          </div>
          <h3 className="mt-1 font-display text-2xl font-semibold leading-tight">{slot.name}</h3>
        </div>
        {active ? (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald/15 text-emerald text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider">
            <BadgeCheck className="size-3" /> Aktif
          </span>
        ) : (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider">
            <Clock className="size-3" /> Tutup
          </span>
        )}
      </div>

      <div
        className={
          "rounded-2xl p-4 mb-5 text-center " +
          (free ? "bg-gradient-gold text-emerald-deep shadow-gold" : "bg-gradient-emerald text-white shadow-emerald")
        }
      >
        <div className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-80">Biaya Pendaftaran</div>
        <div className="font-display text-3xl sm:text-4xl font-bold mt-1">{formatRupiah(slot.price)}</div>
      </div>

      <div className="text-xs text-muted-foreground mb-4">
        <Clock className="inline size-3.5 mr-1 -mt-0.5" />
        {formatDateRange(slot.start, slot.end)}
      </div>

      <ul className="space-y-2 mb-6 flex-1">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <CheckCircle2
              className={"size-4 mt-0.5 shrink-0 " + (slotKey === "reguler" ? "text-emerald" : "text-accent")}
            />
            <span className="leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>

      {active ? (
        <Link
          to={ROUTES[slotKey]}
          className={
            "w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold hover-lift " +
            (free
              ? "bg-gradient-emerald text-accent shadow-emerald"
              : "bg-gradient-gold text-emerald-deep shadow-gold")
          }
        >
          {free ? "Daftar Gratis" : `Daftar — ${formatRupiah(slot.price)}`}
          <ArrowRight className="size-4" />
        </Link>
      ) : (
        <button
          disabled
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-muted text-muted-foreground px-5 py-3.5 text-sm font-bold cursor-not-allowed"
        >
          <Clock className="size-4" /> Belum / Sudah Berakhir
        </button>
      )}
    </div>
  );
}
