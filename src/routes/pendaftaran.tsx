import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Loader2, Clock, Wallet } from "lucide-react";
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
  const [selfPrice, setSelfPrice] = useState<number>(50000);
  const [selfPaidEnabled, setSelfPaidEnabled] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("get_gelombang_config");
      setCfg(parseGelombangConfig(typeof data === "string" ? data : null));
      const { data: rows } = await supabase
        .from("app_settings")
        .select("key,value")
        .in("key", ["self_funded_price", "self_funded_paid_enabled"]);
      const map = new Map((rows ?? []).map((r: any) => [r.key, r.value]));
      const v = Number(map.get("self_funded_price"));
      if (v && v > 0) setSelfPrice(v);
      if (map.get("self_funded_paid_enabled") === "false") setSelfPaidEnabled(false);
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
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-4 py-1.5 text-xs font-medium text-primary uppercase tracking-[0.2em] mb-4">
              <Sparkles className="size-3.5" /> Pendaftaran Program
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-semibold leading-tight">
              Pilih <span className="text-gradient-emerald">Jalur Pendaftaran</span>
            </h1>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Reguler <strong className="text-foreground">GRATIS</strong> dengan persyaratan lengkap, atau jalur <strong className="text-foreground">Fast Track</strong> berbayar
              tanpa syarat tambahan.
            </p>
          </div>

          {loading || !cfg ? (
            <div className="grid place-items-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-5 sm:gap-6">
              {(() => {
                const today = new Date();
                const g1End = new Date(cfg.gelombang_1.end + "T23:59:59+07:00");
                const g1Ended = !cfg.gelombang_1.enabled || today.getTime() > g1End.getTime();
                return (
                  <>
                    <SlotCard slotKey="reguler" slot={cfg.reguler} accent="emerald" forceActive />
                    {!g1Ended ? (
                      <SlotCard slotKey="gelombang_1" slot={cfg.gelombang_1} accent="emerald" forceActive />
                    ) : (
                      <SlotCard slotKey="gelombang_1" slot={cfg.gelombang_1} accent="emerald" forceClosed closedLabel="Gelombang 1 Berakhir" />
                    )}
                    {g1Ended && (
                      <SlotCard slotKey="gelombang_2" slot={cfg.gelombang_2} accent="emerald" forceActive />
                    )}
                    <SelfFundedCard price={selfPrice} paidEnabled={selfPaidEnabled} />
                  </>
                );
              })()}
            </div>
          )}

          <div className="mt-10 text-center text-sm text-muted-foreground">
            Bingung memilih? Hubungi tim kami via{" "}
            <a href="https://wa.me/6281234567890" className="text-primary underline">
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
  accent: "emerald";
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
        "relative w-full sm:w-[340px] lg:w-[360px] rounded-3xl border bg-card p-6 sm:p-7 shadow-soft flex flex-col animate-fade-up transition " +
        (active ? "border-primary/40 hover:shadow-emerald" : "border-border opacity-75")
      }
    >
      {free && (
        <div className="absolute -top-3 left-6">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold bg-gradient-emerald text-white px-3 py-1.5 rounded-full shadow-emerald">
            <Sparkles className="size-3" /> Paling Populer
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">
            {slotKey === "reguler" ? "Jalur Reguler" : "Jalur Fast Track"}
          </div>
          <h3 className="mt-1 font-display text-2xl font-semibold leading-tight">{slot.name}</h3>
        </div>
        {!active && (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider">
            <Clock className="size-3" /> Tutup
          </span>
        )}
      </div>

      <div
        className={
          "rounded-2xl p-4 mb-5 text-center " +
          (free ? "bg-gradient-emerald text-white shadow-emerald" : "bg-gradient-gold text-emerald-deep shadow-gold")
        }
      >
        <div className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-80">Biaya Pendaftaran</div>
        <div className="font-display text-3xl sm:text-4xl font-bold mt-1">{formatRupiah(slot.price)}</div>
      </div>

      <div className="inline-flex items-center gap-2 self-start rounded-full bg-primary/8 border border-primary/20 px-3.5 py-1.5 text-xs font-semibold text-primary mb-5">
        <Clock className="size-3.5" />
        {formatDateRange(slot.start, slot.end)}
      </div>

      <div className="bg-secondary/60 rounded-2xl p-4 mb-6 flex-1">
        <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">
          Ketentuan & Syarat
        </div>
        <ul className="space-y-2.5">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm font-medium">
              <CheckCircle2 className="size-4 mt-0.5 shrink-0 text-primary" />
              <span className="leading-relaxed">{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {active ? (
        <Link
          to={ROUTES[slotKey]}
          className={
            "w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold hover-lift " +
            (free
              ? "bg-gradient-emerald text-white shadow-emerald"
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
          <Clock className="size-4" /> {closedLabel ?? "Belum / Sudah Berakhir"}
        </button>
      )}
    </div>
  );
}

function SelfFundedCard({ price, paidEnabled }: { price: number; paidEnabled: boolean }) {
  const free = !paidEnabled;
  return (
    <div className="relative w-full sm:w-[340px] lg:w-[360px] rounded-3xl border border-emerald/30 bg-card p-6 sm:p-7 shadow-soft flex flex-col animate-fade-up transition hover:shadow-emerald">
      <div className="absolute -top-3 left-6">
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold bg-emerald text-white px-3 py-1.5 rounded-full">
          <Wallet className="size-3" /> Langsung Lolos
        </span>
      </div>

      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">
            Jalur Mandiri
          </div>
          <h3 className="mt-1 font-display text-2xl font-semibold leading-tight">Self Funded</h3>
        </div>
      </div>

      <div className="rounded-2xl p-4 mb-5 text-center bg-gradient-emerald text-white shadow-emerald">
        <div className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-80">Biaya Pendaftaran</div>
        <div className="font-display text-3xl sm:text-4xl font-bold mt-1">
          {free ? "GRATIS" : formatRupiah(price)}
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] opacity-80 mt-1">
          {free ? "Tanpa biaya pendaftaran" : "Sekali bayar via Mayar"}
        </div>
      </div>

      <div className="bg-secondary/60 rounded-2xl p-4 mb-6 flex-1">
        <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">
          Keuntungan
        </div>
        <ul className="space-y-2.5">
          {[
            "Status langsung LOLOS tanpa seleksi berkas",
            "Tanpa essay, tanpa twibbon, tanpa follow medsos",
            "Dokumen LOA, Panduan Pembayaran, Form Kehadiran & Surat Pengantar Proposal otomatis ter-generate",
            "Cocok untuk peserta yang ingin keberangkatan dipastikan",
          ].map((b, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm font-medium">
              <CheckCircle2 className="size-4 mt-0.5 shrink-0 text-emerald" />
              <span className="leading-relaxed">{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        to="/daftar-mandiri"
        className="w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold hover-lift bg-gradient-emerald text-white shadow-emerald"
      >
        {free ? "Daftar Self Funded — GRATIS" : `Daftar Self Funded — ${formatRupiah(price)}`}
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
