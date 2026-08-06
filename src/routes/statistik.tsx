import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HeartHandshake, Loader2, Lock, RefreshCw, ShieldCheck, Users } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
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

type DayRow = { day: string; daftar: number; kontribusi: number };

type Stats = {
  ok: boolean;
  error?: string;
  generated_at?: string;
  total?: number;
  kontribusi_paid?: number;
  kontribusi_unpaid?: number;
  today_daftar?: number;
  today_kontribusi?: number;
  by_day?: DayRow[];
};

const LS_KEY = "safar_stats_pw";

function StatistikPage() {
  const [pw, setPw] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [days, setDays] = useState<7 | 14 | 30>(14);
  const [live, setLive] = useState(false);
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

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) unlock(saved, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime: refresh berkala + langsung saat tabel peserta berubah.
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
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      alive = false;
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [unlocked, fetchStats]);

  const chartData = useMemo(() => {
    const rows = stats?.by_day ?? [];
    return rows.slice(-days).map((r) => ({
      daftar: Number(r.daftar) || 0,
      kontribusi: Number(r.kontribusi) || 0,
      label: new Date(r.day).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
    }));
  }, [stats, days]);

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
      <div className="max-w-5xl mx-auto space-y-5">
        <header className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
              Statistik Pendaftaran
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ringkasan pendaftaran & kontribusi · diperbarui{" "}
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

        {/* Ringkasan */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SummaryCard
            title="Total Peserta"
            desc="Seluruh peserta yang sudah terdaftar."
            value={s.total}
            icon={<Users className="size-5" />}
            tone="emerald"
          />
          <SummaryCard
            title="Donasi Valid (Kontribusi)"
            desc="Kontribusi peserta yang sudah terverifikasi lunas."
            value={s.kontribusi_paid}
            icon={<HeartHandshake className="size-5" />}
            tone="accent"
          />
        </section>

        {/* Aktivitas hari ini */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                Aktivitas Hari Ini
                <span className="inline-flex items-center gap-1.5 text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald/10 text-emerald">
                  <span className="relative inline-flex size-1.5">
                    {live && (
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald animate-ping opacity-75" />
                    )}
                    <span className="relative inline-flex size-1.5 rounded-full bg-emerald" />
                  </span>
                  {live ? "Live" : "Menghubungkan…"}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TodayCard label="Pendaftaran" value={s.today_daftar} icon={<Users className="size-4" />} tone="emerald" />
            <TodayCard label="Kontribusi Valid" value={s.today_kontribusi} icon={<HeartHandshake className="size-4" />} tone="accent" />
          </div>
        </section>

        {/* Aktivitas harian */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">Aktivitas Harian</h2>
              <p className="text-xs text-muted-foreground">Pendaftaran & kontribusi valid per hari</p>
            </div>
            <div className="flex gap-1 rounded-full bg-secondary p-1">
              {([7, 14, 30] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1 text-xs rounded-full transition ${
                    days === d ? "bg-background shadow-sm font-medium" : "text-muted-foreground"
                  }`}
                >
                  {d}h
                </button>
              ))}
            </div>
          </div>
          <div className="h-72 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "var(--foreground)",
                  }}
                  labelStyle={{ fontWeight: 600 }}
                  cursor={{ fill: "var(--secondary)", opacity: 0.5 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                <Bar dataKey="daftar" name="Pendaftaran" fill="var(--emerald)" radius={[6, 6, 0, 0]} maxBarSize={22} />
                <Bar dataKey="kontribusi" name="Kontribusi Valid" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  desc,
  value,
  icon,
  tone,
}: {
  title: string;
  desc: string;
  value?: number;
  icon: React.ReactNode;
  tone: "emerald" | "accent";
}) {
  const toneMap = {
    emerald: "bg-emerald/10 text-emerald border-emerald/30",
    accent: "bg-accent/15 text-accent border-accent/40",
  } as const;
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex items-start gap-4">
      <div className={`size-12 rounded-xl grid place-items-center border ${toneMap[tone]}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-base font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <div className="font-display text-3xl font-semibold tracking-tight tabular-nums">
        {(value ?? 0).toLocaleString("id-ID")}
      </div>
    </div>
  );
}

function TodayCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value?: number;
  icon: React.ReactNode;
  tone: "emerald" | "accent";
}) {
  const toneMap = {
    emerald: "bg-emerald/10 text-emerald",
    accent: "bg-accent/10 text-accent",
  } as const;
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4 flex items-center gap-3">
      <div className={`size-10 rounded-xl grid place-items-center ${toneMap[tone]}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-display text-2xl font-semibold tracking-tight leading-tight tabular-nums">
          {(value ?? 0).toLocaleString("id-ID")}
        </div>
      </div>
    </div>
  );
}
