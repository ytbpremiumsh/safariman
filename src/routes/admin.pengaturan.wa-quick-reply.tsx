import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Copy,
  Loader2,
  MessageSquareText,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/pengaturan/wa-quick-reply")({
  head: () => ({ meta: [{ title: "Balas Cepat WhatsApp — Safar Iman Admin" }] }),
  component: WaQuickReplySetting,
});

type QuickReply = {
  keyword: string;
  label: string;
  message: string;
};

const CATEGORIES = [
  "Umum",
  "Pendaftaran",
  "Berkas",
  "Essay",
  "Pembayaran",
  "Tahapan Seleksi",
  "Kontribusi",
  "Lainnya",
] as const;

const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  {
    keyword: "salam",
    label: "Salam Pembuka",
    message:
      "Assalamu'alaikum warahmatullahi wabarakatuh 🙏\n\nTerima kasih telah menghubungi Safar Iman. Ada yang bisa kami bantu?",
  },
  {
    keyword: "daftar",
    label: "Cara Pendaftaran",
    message:
      "Halo Kak 👋\n\nUntuk mendaftar program Safar Iman, silakan buka halaman berikut:\nhttps://safariman.my.id/daftar\n\nIsi formulir dengan data yang benar, lalu simpan kode pendaftaran yang muncul.",
  },
  {
    keyword: "berkas",
    label: "Kirim Berkas",
    message:
      "Untuk kirim berkas (CV & Foto), silakan buka:\nhttps://safariman.my.id/berkas\n\nMasukkan kode pendaftaran, lalu upload CV (PDF) dan foto formal.",
  },
  {
    keyword: "essay",
    label: "Pengisian Essay",
    message:
      "Halaman pengisian essay:\nhttps://safariman.my.id/essay\n\nGunakan kode pendaftaran untuk masuk. Pastikan setiap essay ditulis dengan jujur dan reflektif.",
  },
  {
    keyword: "bayar",
    label: "Konfirmasi Pembayaran",
    message:
      "Untuk cek/lakukan pembayaran, silakan buka halaman status pendaftaran Anda dan klik tombol bayar melalui Mayar. Setelah pembayaran berhasil, status akan otomatis terupdate maksimal 5 menit.",
  },
  {
    keyword: "tahap",
    label: "Cek Tahapan Seleksi",
    message:
      "Untuk mengecek tahapan seleksi (Essay, TKA, Interview), silakan buka:\nhttps://safariman.my.id/cek-tahapan\n\nMasukkan kode pendaftaran Anda.",
  },
  {
    keyword: "kontribusi",
    label: "Kontribusi Peserta",
    message:
      "Untuk info kontribusi & benefit peserta lolos, silakan buka:\nhttps://safariman.my.id/kontribusi",
  },
  {
    keyword: "faq",
    label: "Arahkan ke FAQ",
    message:
      "Pertanyaan umum sudah kami rangkum di halaman FAQ:\nhttps://safariman.my.id/faq\n\nSilakan cek dulu, siapa tahu jawabannya sudah ada di sana 🙏",
  },
  {
    keyword: "terima",
    label: "Penutup",
    message:
      "Baik Kak, terima kasih atas responsnya 🙏\nSemoga Allah mudahkan setiap langkah menuju Safar Iman.\n\nWassalamu'alaikum warahmatullahi wabarakatuh.",
  },
];

const norm = (s: string) => s.trim().toLowerCase();

function WaQuickReplySetting() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<QuickReply[]>(DEFAULT_QUICK_REPLIES);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("");
  // Categories per item stored parallel via ':' in keyword? Keep simple: store category in separate field via message metadata — actually keep clean type. Extend type:
  // We'll augment items with optional category field.

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "wa_quick_replies")
        .maybeSingle();
      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setItems(
              parsed
                .filter((x) => x && typeof x === "object")
                .map((x: any) => ({
                  keyword: String(x.keyword ?? "").trim(),
                  label: String(x.label ?? "").trim(),
                  message: String(x.message ?? ""),
                  category: typeof x.category === "string" ? x.category : "Umum",
                })) as QuickReply[],
            );
          }
        } catch {
          // ignore
        }
      }
      setLoading(false);
    })();
  }, [ready]);

  const patch = (idx: number, p: Partial<QuickReply>) =>
    setItems((s) => s.map((x, i) => (i === idx ? { ...x, ...p } : x)));

  const move = (idx: number, dir: -1 | 1) =>
    setItems((s) => {
      const next = [...s];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return s;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });

  const remove = (idx: number) => {
    if (!confirm("Hapus template ini?")) return;
    setItems((s) => s.filter((_, i) => i !== idx));
  };

  const add = () =>
    setItems((s) => [
      ...s,
      {
        keyword: "keyword-baru",
        label: "Template Baru",
        message: "Tulis pesan balasan di sini.",
        category: "Umum",
      } as QuickReply,
    ]);

  const resetDefaults = () => {
    if (!confirm("Reset ke daftar bawaan? Semua template kustom akan hilang.")) return;
    setItems(DEFAULT_QUICK_REPLIES);
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Disalin: ${label}`);
    } catch {
      toast.error("Gagal menyalin");
    }
  };

  const save = async () => {
    const clean = items
      .map((x: any) => ({
        keyword: norm(x.keyword || ""),
        label: (x.label || "").trim(),
        message: (x.message || "").trim(),
        category: (x.category || "Umum").trim(),
      }))
      .filter((x) => x.keyword && x.label && x.message);
    if (clean.length === 0) {
      toast.error("Minimal harus ada 1 template");
      return;
    }
    // Deteksi keyword duplikat
    const seen = new Set<string>();
    for (const it of clean) {
      if (seen.has(it.keyword)) {
        toast.error(`Keyword duplikat: "${it.keyword}"`);
        return;
      }
      seen.add(it.keyword);
    }
    setSaving(true);
    const { error } = await supabase.rpc("admin_set_setting", {
      p_key: "wa_quick_replies",
      p_value: JSON.stringify(clean),
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${clean.length} template tersimpan`);
  };

  const filtered = useMemo(() => {
    const needle = norm(q);
    return items
      .map((x, i) => ({ x, i }))
      .filter(({ x }: any) => {
        if (cat && (x.category || "Umum") !== cat) return false;
        if (!needle) return true;
        return (
          norm(x.keyword).includes(needle) ||
          norm(x.label).includes(needle) ||
          norm(x.message).includes(needle)
        );
      });
  }, [items, q, cat]);

  if (!ready || loading) return <AdminLoading />;

  return (
    <AdminShell title="Balas Cepat WhatsApp">
      <Link
        to="/admin/pengaturan"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground -mt-3"
      >
        <ArrowLeft className="size-4" /> Kembali ke Pengaturan
      </Link>

      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquareText className="size-5 text-emerald" />
          <div className="font-display text-lg font-semibold">Template Balas Cepat WhatsApp</div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Simpan pesan siap-kirim untuk WhatsApp. Setiap template punya{" "}
          <strong>keyword</strong> (untuk pencarian cepat), <strong>label</strong> (nama pendek),
          dan <strong>isi pesan</strong>. Klik <em>Salin</em> lalu tempel di WhatsApp Web / HP.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={add}
            className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-4 py-2 text-xs font-semibold shadow-emerald hover-lift"
          >
            <Plus className="size-4" /> Tambah Template
          </button>
          <button
            onClick={resetDefaults}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary"
          >
            <RotateCcw className="size-3.5" /> Reset ke Bawaan
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 grid sm:grid-cols-[1fr_220px] gap-3">
        <div className="relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari keyword / label / isi pesan…"
            className="pl-9"
          />
        </div>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Semua Kategori</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border rounded-2xl">
            Tidak ada template yang cocok.
          </div>
        )}
        {filtered.map(({ x, i }: any) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald/15 text-emerald text-[11px] font-bold">
                  {i + 1}
                </span>
                <span className="font-medium">Template #{i + 1}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => copy(x.message, x.label || x.keyword)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-emerald/40 text-emerald bg-emerald/5 hover:bg-emerald/10 text-xs font-semibold"
                  title="Salin isi pesan"
                >
                  <Copy className="size-3.5" /> Salin
                </button>
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="size-8 rounded-lg border border-border hover:bg-secondary grid place-items-center disabled:opacity-40"
                  title="Naik"
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                  className="size-8 rounded-lg border border-border hover:bg-secondary grid place-items-center disabled:opacity-40"
                  title="Turun"
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  onClick={() => remove(i)}
                  className="size-8 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 grid place-items-center"
                  title="Hapus"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Keyword">
                <Input
                  value={x.keyword}
                  onChange={(e) => patch(i, { keyword: e.target.value })}
                  placeholder="mis. daftar"
                />
              </Field>
              <Field label="Label">
                <Input
                  value={x.label}
                  onChange={(e) => patch(i, { label: e.target.value })}
                  placeholder="Cara Pendaftaran"
                />
              </Field>
              <Field label="Kategori">
                <select
                  value={(x as any).category || "Umum"}
                  onChange={(e) => patch(i, { category: e.target.value } as any)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Isi Pesan (WhatsApp)">
              <Textarea
                value={x.message}
                onChange={(e) => patch(i, { message: e.target.value })}
                rows={5}
                placeholder="Tulis pesan siap-kirim di sini. Boleh pakai *tebal*, _miring_, `mono`."
              />
              <div className="text-[11px] text-muted-foreground mt-1">
                {x.message.length} karakter · {x.message.split("\n").length} baris
              </div>
            </Field>
          </div>
        ))}
      </div>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-emerald text-white px-6 py-3 text-sm font-semibold shadow-emerald hover-lift disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}{" "}
          Simpan Template
        </button>
      </div>
    </AdminShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
