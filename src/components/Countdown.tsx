import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_TARGET = new Date("2026-08-15T23:59:59+07:00").getTime();

export function Countdown() {
  const [target, setTarget] = useState<number>(DEFAULT_TARGET);
  const [enabled, setEnabled] = useState<boolean>(true);
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    (async () => {
      const [{ data: tgt }, { data: en }] = await Promise.all([
        supabase.rpc("get_countdown_target"),
        supabase.rpc("get_countdown_enabled"),
      ]);
      if (tgt && typeof tgt === "string") {
        const parsed = new Date(tgt).getTime();
        if (!Number.isNaN(parsed)) setTarget(parsed);
      }
      if (typeof en === "boolean") setEnabled(en);
    })();
  }, []);

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [target]);

  const items = [
    { v: t.d, l: "Hari" },
    { v: t.h, l: "Jam" },
    { v: t.m, l: "Menit" },
    { v: t.s, l: "Detik" },
  ];

  return (
    <div className="flex gap-3 sm:gap-4 justify-center">
      {items.map((i) => (
        <div
          key={i.l}
          className="bg-gradient-emerald border border-accent/30 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 min-w-[72px] sm:min-w-[96px] text-center shadow-emerald"
        >
          <div className="font-display text-3xl sm:text-5xl font-semibold text-gradient-gold tabular-nums leading-none">
            {String(i.v).padStart(2, "0")}
          </div>
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-accent/90 mt-2 font-medium">
            {i.l}
          </div>
        </div>
      ))}
    </div>
  );
}
