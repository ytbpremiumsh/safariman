import { useEffect, useState } from "react";
import { Sparkles, GraduationCap, MapPin, CheckCircle2, Award, PlayCircle, Calendar, ExternalLink, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import apresiasiKelasUrl from "@/assets/apresiasi-kelas-online.jpg";
import apresiasiSirahUrl from "@/assets/apresiasi-kajian-sirah.jpg";

type Settings = {
  kelas_link: string;
  kelas_tanggal: string;
  kajian_link: string;
  kajian_tanggal: string;
  sertifikat_link: string;
  rekaman_link: string;
};

export const APRESIASI_KEYS = [
  "apresiasi_kelas_link",
  "apresiasi_kelas_tanggal",
  "apresiasi_kajian_link",
  "apresiasi_kajian_tanggal",
  "apresiasi_sertifikat_link",
  "apresiasi_rekaman_link",
] as const;

export function useApresiasiSettings() {
  const [s, setS] = useState<Settings | null>(null);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("app_settings").select("key,value").in("key", APRESIASI_KEYS as unknown as string[]);
      const map = Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value ?? ""]));
      setS({
        kelas_link: map.apresiasi_kelas_link ?? "",
        kelas_tanggal: map.apresiasi_kelas_tanggal ?? "",
        kajian_link: map.apresiasi_kajian_link ?? "",
        kajian_tanggal: map.apresiasi_kajian_tanggal ?? "",
        sertifikat_link: map.apresiasi_sertifikat_link ?? "",
        rekaman_link: map.apresiasi_rekaman_link ?? "",
      });
    })();
  }, []);
  return s;
}

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" });
}

export function ApresiasiPeserta({ compact = false, hidePlaceholder = false }: { compact?: boolean; hidePlaceholder?: boolean }) {
  const s = useApresiasiSettings();

  return (
    <div className={compact ? "" : "mb-12"}>
      {!compact && (
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white font-bold bg-gradient-emerald px-4 py-2 rounded-full shadow-emerald">
            <Sparkles className="size-3.5" /> Apresiasi Peserta
          </span>
          <h3 className="mt-5 font-display text-2xl sm:text-3xl font-bold leading-tight max-w-2xl mx-auto">
            Akses Eksklusif untuk peserta yang berkontribusi
          </h3>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
            Ikuti Kelas Online &amp; Kajian Sirah bersama pembimbing terpilih.
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="bg-card border-2 border-emerald/30 rounded-2xl overflow-hidden hover-lift flex flex-col relative shadow-soft">
          <div className="relative aspect-[4/3] overflow-hidden bg-emerald/5">
            <img src={apresiasiKelasUrl} alt="Kelas Online" loading="lazy" className="absolute inset-0 size-full object-cover" />
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold bg-gradient-emerald text-white pl-1.5 pr-2.5 py-1 rounded-full shadow-emerald">
              <Sparkles className="size-2.5" /> Eksklusif
            </span>
            <div className="absolute bottom-3 left-3 size-10 rounded-xl bg-gradient-emerald grid place-items-center shadow-emerald">
              <GraduationCap className="size-5 text-accent" />
            </div>
          </div>
          <div className="p-5 flex flex-col flex-1">
            <div className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Kelas Online</div>
            <h4 className="text-base sm:text-lg font-semibold mt-1.5 leading-snug">
              Sekolah Tamu Allah: Bedah Persiapan Umrohmu, Kembali dengan Mabrur
            </h4>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Bersama <span className="font-semibold text-foreground">Ustadz Ahmad Fauzan, Lc.</span>
              <br />
              <span className="text-xs">Pembimbing Manasik &amp; Praktisi Umrah</span>
            </p>
            <ScheduleRow date={s?.kelas_tanggal ?? ""} link={s?.kelas_link ?? ""} loading={!s} hidePlaceholder={hidePlaceholder} />
          </div>
        </div>

        <div className="bg-card border-2 border-accent/40 rounded-2xl overflow-hidden hover-lift flex flex-col relative shadow-soft">
          <div className="relative aspect-[4/3] overflow-hidden bg-accent/5">
            <img src={apresiasiSirahUrl} alt="Kajian Sirah" loading="lazy" className="absolute inset-0 size-full object-cover" />
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold bg-gradient-gold text-emerald-deep pl-1.5 pr-2.5 py-1 rounded-full shadow-gold">
              <Sparkles className="size-2.5" /> Eksklusif
            </span>
            <div className="absolute bottom-3 left-3 size-10 rounded-xl bg-gradient-gold grid place-items-center shadow-gold">
              <MapPin className="size-5 text-emerald-deep" />
            </div>
          </div>
          <div className="p-5 flex flex-col flex-1">
            <div className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Kajian</div>
            <h4 className="text-base sm:text-lg font-semibold mt-1.5 leading-snug">
              Mengenal Sirah Haramain: Bekal Sebelum ke Baitullah
            </h4>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Bersama <span className="font-semibold text-foreground">Ustadz Hilman Al Hazmi, Lc.</span>
              <br />
              <span className="text-xs">Alumni Syariah Islamiyyah Al Azhar University</span>
            </p>
            <ScheduleRow date={s?.kajian_tanggal ?? ""} link={s?.kajian_link ?? ""} loading={!s} hidePlaceholder={hidePlaceholder} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid sm:grid-cols-2 gap-3">
        <BenefitButton
          icon={Award}
          title="E-Sertifikat Resmi"
          desc="Sertifikat digital setelah menyelesaikan kelas"
          link={s?.sertifikat_link ?? ""}
          loading={!s}
          hidePlaceholder={hidePlaceholder}
        />
        <BenefitButton
          icon={PlayCircle}
          title="Akses Rekaman"
          desc="Tonton ulang kapan saja."
          link={s?.rekaman_link ?? ""}
          loading={!s}
          hidePlaceholder={hidePlaceholder}
        />
      </div>
    </div>
  );
}

function ScheduleRow({ date, link, loading, hidePlaceholder = false }: { date: string; link: string; loading: boolean; hidePlaceholder?: boolean }) {
  const placeholder = hidePlaceholder ? <span className="text-muted-foreground">—</span> : <span className="text-amber-600">Coming Soon</span>;
  return (
    <div className="mt-4 pt-4 border-t border-border/60 space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <Calendar className="size-3.5 text-emerald shrink-0" />
        <span className="text-muted-foreground">Tanggal Pelaksanaan:</span>
        <span className="font-semibold text-foreground">
          {loading ? "…" : date ? formatDate(date) : placeholder}
        </span>
      </div>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 w-full rounded-full bg-gradient-emerald text-accent px-4 py-2 text-xs font-bold shadow-emerald hover-lift"
        >
          <ExternalLink className="size-3.5" /> Buka Link Acara
        </a>
      ) : hidePlaceholder ? null : (
        <button
          disabled
          className="inline-flex items-center justify-center gap-1.5 w-full rounded-full bg-secondary text-muted-foreground px-4 py-2 text-xs font-semibold cursor-not-allowed"
        >
          <Clock className="size-3.5" /> Coming Soon
        </button>
      )}
    </div>
  );
}

function BenefitButton({
  icon: Icon, title, desc, link, loading, hidePlaceholder = false,
}: { icon: typeof Award; title: string; desc: string; link: string; loading: boolean; hidePlaceholder?: boolean }) {
  const disabled = !link;
  const inner = (
    <>
      <div className="size-9 rounded-lg bg-gradient-emerald grid place-items-center shrink-0 shadow-emerald">
        <Icon className="size-4 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm flex items-center gap-1.5">
          {title}
          {!loading && (disabled
            ? <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">Coming Soon</span>
            : <ExternalLink className="size-3 text-emerald" />
          )}
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">{desc}</div>
      </div>
      {!disabled && <CheckCircle2 className="size-4 text-emerald shrink-0" />}
    </>
  );
  if (disabled) {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-secondary/60 border border-border px-4 py-3 opacity-80">
        {inner}
      </div>
    );
  }
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 rounded-xl bg-emerald/5 border border-emerald/30 px-4 py-3 hover:bg-emerald/10 transition"
    >
      {inner}
    </a>
  );
}
