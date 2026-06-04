// Shared types & helpers for gelombang configuration.
export type GelombangSlot = {
  name: string;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD (inclusive)
  price: number;
  enabled: boolean;
  description: string; // newline-separated bullets
};

export type GelombangConfig = {
  reguler: GelombangSlot;
  gelombang_1: GelombangSlot;
  gelombang_2: GelombangSlot;
};

export const DEFAULT_GELOMBANG_CONFIG: GelombangConfig = {
  reguler: {
    name: "Reguler",
    start: "2026-06-10",
    end: "2026-08-15",
    price: 0,
    enabled: true,
    description:
      "Mengisi Form Pendaftaran\nMembagikan Twibbon & Poster\nFollow Instagram & Tiktok\nMengirimkan Berkas Administrasi",
  },
  gelombang_1: {
    name: "Reguler Gelombang 1",
    start: "2026-06-10",
    end: "2026-07-20",
    price: 20000,
    enabled: true,
    description:
      "Tanpa Membagikan Twibbon & Poster\nTanpa Follow Instagram & Tiktok\nKomitmen Donasi sebelum Kirim Berkas\nLanjut Kirim Berkas & Essay",
  },
  gelombang_2: {
    name: "Reguler Gelombang 2",
    start: "2026-07-21",
    end: "2026-08-15",
    price: 50000,
    enabled: true,
    description:
      "Tanpa Membagikan Twibbon & Poster\nTanpa Follow Instagram & Tiktok\nKomitmen Donasi sebelum Kirim Berkas\nLanjut Kirim Berkas & Essay",
  },
};

export function parseGelombangConfig(raw: string | null | undefined): GelombangConfig {
  if (!raw) return DEFAULT_GELOMBANG_CONFIG;
  try {
    const parsed = JSON.parse(raw);
    return {
      reguler: { ...DEFAULT_GELOMBANG_CONFIG.reguler, ...(parsed.reguler ?? {}) },
      gelombang_1: { ...DEFAULT_GELOMBANG_CONFIG.gelombang_1, ...(parsed.gelombang_1 ?? {}) },
      gelombang_2: { ...DEFAULT_GELOMBANG_CONFIG.gelombang_2, ...(parsed.gelombang_2 ?? {}) },
    };
  } catch {
    return DEFAULT_GELOMBANG_CONFIG;
  }
}

export function isSlotActive(slot: GelombangSlot, now: Date = new Date()): boolean {
  if (!slot.enabled) return false;
  const t = now.getTime();
  const start = new Date(slot.start + "T00:00:00+07:00").getTime();
  const end = new Date(slot.end + "T23:59:59+07:00").getTime();
  return t >= start && t <= end;
}

export function formatRupiah(n: number): string {
  if (!n) return "GRATIS";
  return "Rp " + n.toLocaleString("id-ID");
}

export function formatDateRange(start: string, end: string): string {
  const fmt = (s: string) =>
    new Date(s + "T00:00:00+07:00").toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  return `${fmt(start)} – ${fmt(end)}`;
}
