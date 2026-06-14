import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Loader2, ArrowLeft, CheckCircle2, XCircle, Clock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/cek-hasil")({
  head: () => ({
    meta: [
      { title: "Cek Hasil Seleksi Essay — Safar Iman" },
      { name: "description", content: "Cek hasil seleksi essay menuju tahap TKA ( Tes Kesiapan Awal) dengan kode pendaftaran." },
    ],
  }),
  component: CekHasilPage,
});

type Cfg = {
  enabled: boolean;
  title: string;
  subtitle: string;
  lolos: string;
  tidakLolos: string;
  pending: string;
  disabled: string;
};

type ResultRow = { found: boolean; full_name: string; result: "lolos" | "tidak_lolos" | "pending" };

const DEFAULTS: Cfg = {
  enabled: false,
  title: "Cek Hasil Seleksi Essay",
  subtitle: "Masukkan kode pendaftaran kamu untuk melihat hasil seleksi essay.",
  lolos: "🎉 Selamat! Kamu LOLOS ke tahap TKA ( Tes Kesiapan Awal).",
  tidakLolos: "Mohon maaf, kamu belum lolos ke tahap selanjutnya.",
  pending: "Hasil seleksi kamu sedang diproses oleh tim penilai.",
  disabled: "Halaman pengumuman hasil seleksi belum dibuka.",
};

function CekHasilPage() {
  const [cfg, setCfg] = useState<Cfg>(DEFAULTS);
  const [loadingCfg, setLoadingCfg] = useState(true);
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<ResultRow | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", [
          "hasil_seleksi_enabled",
          "hasil_reveal_at",
          "hasil_page_title",
          "hasil_page_subtitle",
          "hasil_text_lolos",
          "hasil_text_tidak_lolos",
          "hasil_text_pending",
          "hasil_text_disabled",
        ]);
      const map = new Map((data ?? []).map((r) => [r.key, r.value ?? ""]));
      const manualEnabled = (map.get("hasil_seleksi_enabled") ?? "false") === "true";
      const revealAt = map.get("hasil_reveal_at") ?? "";
      const scheduledOpen = !!revealAt && !isNaN(new Date(revealAt).getTime()) && Date.now() >= new Date(revealAt).getTime();
      setCfg({
        enabled: manualEnabled || scheduledOpen,
        title: map.get("hasil_page_title") || DEFAULTS.title,
        subtitle: map.get("hasil_page_subtitle") || DEFAULTS.subtitle,
        lolos: map.get("hasil_text_lolos") || DEFAULTS.lolos,
        tidakLolos: map.get("hasil_text_tidak_lolos") || DEFAULTS.tidakLolos,
        pending: map.get("hasil_text_pending") || DEFAULTS.pending,
        disabled: map.get("hasil_text_disabled") || DEFAULTS.disabled,
      });
      setLoadingCfg(false);
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim();
    if (!c) return;
    setSearching(true);
    setResult(null);
    setNotFound(false);
    const { data, error } = await supabase.rpc("lookup_hasil_seleksi_by_code", { p_code: c });
    setSearching(false);
    if (error) {
      setNotFound(true);
      return;
    }
    const row = (data ?? [])[0] as ResultRow | undefined;
    if (!row) setNotFound(true);
    else setResult(row);
  };

  if (loadingCfg) {
    return (
      <div className="min-h-screen grid place-items-center bg-secondary/30">
        <Loader2 className="size-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/40 via-background to-emerald/5">
      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="size-4" /> Beranda
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="size-3" /> Pengumuman Hasil Essay
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">{cfg.title}</h1>
          <p className="text-muted-foreground mt-2 leading-relaxed">{cfg.subtitle}</p>
        </div>

        {!cfg.enabled ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <div className="size-14 mx-auto rounded-full bg-amber-100 text-amber-600 grid place-items-center mb-4">
              <Clock className="size-7" />
            </div>
            <h2 className="font-display text-lg font-semibold mb-2">Belum Dibuka</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{cfg.disabled}</p>
          </div>
        ) : (
          <>
            <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
              <label className="block text-sm font-medium mb-2">Kode Pendaftaran</label>
              <div className="flex gap-2">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: HXP-AB12CD34"
                  className="font-mono"
                  required
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={searching || !code.trim()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-gradient-emerald text-accent px-4 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60"
                >
                  {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                  Cek
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Hasil hanya tersedia bagi peserta yang sudah mengirimkan essay lengkap.
              </p>
            </form>

            {notFound && (
              <div className="mt-5 bg-card border border-red-200 dark:border-red-900/50 rounded-2xl p-5 text-center">
                <p className="text-sm text-red-600">
                  Kode <span className="font-mono font-semibold">{code}</span> tidak ditemukan atau essay belum lengkap.
                </p>
              </div>
            )}

            {result && (
              <ResultCard
                row={result}
                lolos={cfg.lolos}
                tidakLolos={cfg.tidakLolos}
                pending={cfg.pending}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ResultCard({ row, lolos, tidakLolos, pending }: { row: ResultRow; lolos: string; tidakLolos: string; pending: string }) {
  const style =
    row.result === "lolos"
      ? {
          icon: <CheckCircle2 className="size-7" />,
          label: "LOLOS",
          ring: "from-emerald to-emerald-deep",
          chip: "bg-emerald/15 text-emerald",
          text: lolos,
        }
      : row.result === "tidak_lolos"
      ? {
          icon: <XCircle className="size-7" />,
          label: "BELUM LOLOS",
          ring: "from-red-500 to-red-600",
          chip: "bg-red-100 text-red-600 dark:bg-red-950/40",
          text: tidakLolos,
        }
      : {
          icon: <Clock className="size-7" />,
          label: "DALAM PROSES",
          ring: "from-amber-400 to-amber-600",
          chip: "bg-amber-100 text-amber-700 dark:bg-amber-950/40",
          text: pending,
        };

  return (
    <div className="mt-5 bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
      <div className={`bg-gradient-to-br ${style.ring} text-white p-6 text-center`}>
        <div className="size-14 mx-auto rounded-full bg-white/20 grid place-items-center mb-3">{style.icon}</div>
        <div className="text-xs uppercase tracking-[0.25em] text-white/80">{row.full_name}</div>
        <div className="font-display text-3xl font-bold mt-1">{style.label}</div>
      </div>
      <div className="p-5">
        <div className={`inline-flex text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${style.chip} mb-3`}>
          Pesan untuk Peserta
        </div>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{style.text}</p>
      </div>
    </div>
  );
}
