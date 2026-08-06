import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Lock, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/statistik")({
  head: () => ({
    meta: [
      { title: "Statistik Pendaftaran — Safar Iman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: StatistikPage,
});

type Stats = {
  ok: boolean;
  error?: string;
  generated_at?: string;
  total?: number;
  reguler?: number;
  self_funded?: number;
  gelombang_1?: number;
  gelombang_2?: number;
  fast_track_paid?: number;
  fast_track_unpaid?: number;
  berkas_submitted?: number;
  essay_submitted?: number;
  kontribusi_paid?: number;
  kontribusi_unpaid?: number;
  today_daftar?: number;
  today_kontribusi?: number;
  today_fast_track?: number;
};

const LS_KEY = "safar_stats_pw";

function StatistikPage() {
  const [pw, setPw] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const pwRef = useRef("");

  const fetchStats = useCallback(async (password: string): Promise<Stats | null> => {
    const { data, error } = await (supabase as any).rpc("get_stats_with_password", {
      _password: password,
    });
    if (error) return null;
    return data as Stats;
  }, []);

  const unlock = async (password: string, silent = false) => {
    if (!password) return;
    if (!silent) setChecking(true);
    const res = await fetchStats(password);
    if (!silent) setChecking(false);
    if (!res) {
      if (!silent) setErr("Gagal menghubungi server. Coba lagi.");
      return;
    }
    if (!res.ok) {
      if (!silent) {
        setErr(
          res.error === "not_configured"
            ? "Halaman statistik belum diaktifkan admin."
            : "Password salah.",
        );
      }
      localStorage.removeItem(LS_KEY);
      setUnlocked(false);
      return;
    }
    pwRef.current = password;
    localStorage.setItem(LS_KEY, password);
    setStats(res);
    setUpdatedAt(new Date());
    setUnlocked(true);
    setErr("");
  };

  // Auto-unlock kalau password sudah pernah benar di perangkat ini.
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) unlock(saved, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime: refresh tiap 5 detik + langsung refresh saat tabel peserta berubah.
  useEffect(() => {
    if (!unlocked) return;
    let alive = true;
    const refresh = async () => {
      const res = await fetchStats(pwRef.current);
      if (!alive || !res?.ok) return;
      setStats(res);
      setUpdatedAt(new Date());
    };
    const timer = setInterval(refresh, 5000);
    const channel = supabase
      .channel("public-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "participants" }, refresh)
      .subscribe();
    return () => {
      alive = false;
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [unlocked, fetchStats]);

  if (!unlocked) {
    return (
      <main className="min-h-screen grid place-items-center px-4 py-16 bg-secondary/30">
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-7 shadow-soft">
          <div className="size-12 rounded-xl bg-emerald/10 text-emerald grid place-items-center mb-4">
            <Lock className="size-5" />
          </div>
          <h1 className="font-display text-xl font-semibold">Statistik Internal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Masukkan password untuk melihat angka statistik pendaftaran & kontribusi.
          </p>
          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              unlock(pw.trim());
            }}
          >
            <Input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Password"
              autoFocus
            />
            {err && <p className="text-xs text-destructive">{err}</p>}
            <button
              type="submit"
              disabled={checking}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {checking ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              Buka Statistik
            </button>
          </form>
        </div>
      </main>
    );
  }

  const s: Stats = stats ?? { ok: true };
  return (
    <main className="min-h-screen bg-secondary/30 px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
              Statistik Pendaftaran
            </h1>
            <p className="text-sm text-muted-foreground mt-1 inline-flex items-center gap-2">
              <span className="relative inline-flex size-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald animate-ping opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald" />
              </span>
              Realtime · diperbarui{" "}
              {updatedAt ? updatedAt.toLocaleTimeString("id-ID") : "—"}
            </p>
          </div>
          <button
            onClick={() => unlock(pwRef.current, true)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-accent/50 transition"
          >
            <RefreshCw className="size-4" /> Muat ulang
          </button>
        </header>

        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <Stat label="Total Pendaftar" value={s.total} big />
          <Stat label="Reguler" value={s.reguler} />
          <Stat label="Gelombang 1" value={s.gelombang_1} />
          <Stat label="Gelombang 2" value={s.gelombang_2} />
          <Stat label="Self Funded" value={s.self_funded} />
          <Stat label="Sudah Kirim Berkas" value={s.berkas_submitted} />
          <Stat label="Sudah Kirim Essay" value={s.essay_submitted} />
          <Stat label="Fast Track Lunas" value={s.fast_track_paid} />
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Kontribusi Valid" value={s.kontribusi_paid} accent big />
          <Stat label="Belum Kontribusi" value={s.kontribusi_unpaid} />
          <Stat label="Fast Track Belum Lunas" value={s.fast_track_unpaid} />
          <Stat label="Pendaftar Hari Ini" value={s.today_daftar} />
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Kontribusi Hari Ini" value={s.today_kontribusi} />
          <Stat label="Fast Track Hari Ini" value={s.today_fast_track} />
        </section>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
  big,
}: {
  label: string;
  value?: number;
  accent?: boolean;
  big?: boolean;
}) {
  return (
    <div
      className={`bg-card border rounded-2xl p-5 ${accent ? "border-accent/40" : "border-border"}`}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`mt-2 font-display font-semibold tracking-tight tabular-nums ${
          big ? "text-4xl" : "text-3xl"
        } ${accent ? "text-accent" : ""}`}
      >
        {(value ?? 0).toLocaleString("id-ID")}
      </div>
    </div>
  );
}
