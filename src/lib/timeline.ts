import { ClipboardList, Megaphone, CheckCircle2, Users2, MessageSquare, Rocket, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const TIMELINE_ICONS = {
  ClipboardList,
  Megaphone,
  CheckCircle2,
  Users2,
  MessageSquare,
  Rocket,
} as const;

export type TimelineIconName = keyof typeof TIMELINE_ICONS;

export type TimelineStep = {
  icon: TimelineIconName;
  title: string;
  desc: string;
  date: string;
  ctaLabel?: string;
  ctaTo?: string;
};

export const DEFAULT_TIMELINE: TimelineStep[] = [
  { icon: "ClipboardList", title: "Pendaftaran Dibuka", desc: "Lengkapi formulir & dapatkan Kode Pendaftaran", date: "25 Juni – 31 Agustus 2026", ctaLabel: "Daftar Sekarang", ctaTo: "/pendaftaran" },
  { icon: "Megaphone", title: "Bagikan Twibbon & Poster", desc: "Download frame & share di sosial media", date: "25 Juni – 31 Agustus 2026", ctaLabel: "Buat Twibbon & Poster", ctaTo: "/twibbon" },
  { icon: "ClipboardList", title: "Pengiriman Berkas", desc: "Masukkan Kode Pendaftaran & kirim data berkas pendukung", date: "25 Juni – 31 Agustus 2026", ctaLabel: "Kirim Berkas", ctaTo: "/berkas" },
  { icon: "CheckCircle2", title: "Seleksi Administrasi", desc: "Verifikasi berkas oleh tim kami", date: "25 Juni – 31 Agustus 2026" },
  { icon: "ClipboardList", title: "Pengisian Essay & Studi Kasus", desc: "Tahapan Seleksi Essay dan Studi Kasus", date: "25 Juni – 31 Agustus 2026", ctaLabel: "Kirim Essay & Studi Kasus", ctaTo: "/essay" },
  { icon: "Megaphone", title: "Pengumuman Lolos Essay", desc: "Pengumuman peserta yang lolos tahap essay & berhak lanjut ke Leadership Discussion Session", date: "5 September 2026" },
  { icon: "Users2", title: "Tes Kesiapan Awal", desc: "Tes berbasis CBT (Computer-Based Test) untuk menyaring peserta yang akan lolos ke tahapan selanjutnya", date: "10 – 20 September 2026" },
  { icon: "MessageSquare", title: "Interview Peserta", desc: "Sesi wawancara online", date: "Ahad, 27 September & 4 Oktober 2026" },
  { icon: "Megaphone", title: "Pengumuman Final", desc: "Diumumkan via email & web", date: "11 Oktober 2026" },
  { icon: "Users2", title: "Technical Meeting", desc: "Briefing keberangkatan", date: "Akhir Oktober 2026" },
  { icon: "Rocket", title: "Keberangkatan", desc: "Perjalanan ke Tanah Suci", date: "November 2026" },
];

export function getIcon(name: string): LucideIcon {
  return (TIMELINE_ICONS as Record<string, LucideIcon>)[name] ?? ClipboardList;
}

export function parseTimeline(raw: unknown): TimelineStep[] {
  if (typeof raw !== "string" || !raw.trim()) return DEFAULT_TIMELINE;
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return DEFAULT_TIMELINE;
    return arr
      .filter((s) => s && typeof s.title === "string")
      .map((s: any) => ({
        icon: (s.icon in TIMELINE_ICONS ? s.icon : "ClipboardList") as TimelineIconName,
        title: String(s.title ?? ""),
        desc: String(s.desc ?? ""),
        date: String(s.date ?? ""),
        ctaLabel: s.ctaLabel ? String(s.ctaLabel) : undefined,
        ctaTo: s.ctaTo ? String(s.ctaTo) : undefined,
      }));
  } catch {
    return DEFAULT_TIMELINE;
  }
}

// Module-level cache + localStorage persistence.
// Timeline jarang berubah (edit admin), jadi 5 menit stale window aman.
// localStorage dipakai supaya kunjungan pertama pun tidak "kedip" ke
// DEFAULT_TIMELINE — kita render versi terakhir yang pernah diambil.
const TIMELINE_TTL_MS = 5 * 60_000;
const LS_KEY = "timeline_cache_v1";

let _timelineCache: { at: number; data: TimelineStep[] } | null = null;

function loadLS(): { at: number; data: TimelineStep[] } | null {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !Array.isArray(obj.data)) return null;
    return { at: Number(obj.at) || 0, data: obj.data as TimelineStep[] };
  } catch { return null; }
}

function saveLS(data: TimelineStep[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch { /* ignore quota */ }
}

// Snapshot sinkron untuk initial state komponen, supaya tidak flash
// DEFAULT_TIMELINE saat RPC belum balas.
export function getCachedTimeline(): TimelineStep[] | null {
  if (_timelineCache) return _timelineCache.data;
  const ls = loadLS();
  if (ls) {
    _timelineCache = ls;
    return ls.data;
  }
  return null;
}

export async function fetchTimeline(): Promise<TimelineStep[]> {
  const now = Date.now();
  if (_timelineCache && now - _timelineCache.at < TIMELINE_TTL_MS) {
    return _timelineCache.data;
  }
  try {
    const { data } = await supabase.rpc("get_timeline_config");
    if (typeof data !== "string" || !data.trim()) {
      // Server tidak balas config valid — jangan timpa cache yang benar.
      const cached = getCachedTimeline();
      return cached ?? DEFAULT_TIMELINE;
    }
    const parsed = parseTimeline(data);
    _timelineCache = { at: now, data: parsed };
    saveLS(parsed);
    return parsed;
  } catch {
    const cached = getCachedTimeline();
    return cached ?? DEFAULT_TIMELINE;
  }
}

export function invalidateTimelineCache() {
  _timelineCache = null;
  try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
}

