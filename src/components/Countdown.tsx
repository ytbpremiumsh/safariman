import { useEffect, useState } from "react";

const TARGET = new Date("2026-08-15T23:59:59+07:00").getTime();

export function Countdown() {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, TARGET - Date.now());
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
  }, []);

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
          className="glass rounded-2xl px-4 py-3 sm:px-6 sm:py-4 min-w-[68px] sm:min-w-[88px] text-center"
        >
          <div className="font-display text-3xl sm:text-5xl font-semibold text-gradient-gold tabular-nums">
            {String(i.v).padStart(2, "0")}
          </div>
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white/70 mt-1">
            {i.l}
          </div>
        </div>
      ))}
    </div>
  );
}
