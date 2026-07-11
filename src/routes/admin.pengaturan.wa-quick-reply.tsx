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

const DEFAULT_QUICK_REPLIES: (QuickReply & { category?: string })[] = [
  // ===== UMUM =====
  {
    keyword: "salam",
    label: "Salam Pembuka",
    category: "Umum",
    message:
      "Assalamu'alaikum warahmatullahi wabarakatuh 🙏\n\nTerima kasih telah menghubungi Safar Iman — program Umrah Gratis untuk anak muda berprestasi. Ada yang bisa kami bantu, Kak? 😊",
  },
  {
    keyword: "tentang",
    label: "Tentang Safar Iman",
    category: "Umum",
    message:
      "Hi Sahabat Safar Iman! 🕋\n\nSafar Iman adalah program *Umrah Gratis untuk Anak Muda Berprestasi* yang bertujuan memberangkatkan pemuda-pemudi terbaik Indonesia untuk beribadah ke Tanah Suci sekaligus memperkuat karakter, kepemimpinan, dan kontribusi sosial.\n\nInfo lengkap: https://safariman.my.id",
  },
  {
    keyword: "syarat",
    label: "Persyaratan Umum",
    category: "Umum",
    message:
      "Hi Sahabat Safar Iman! 👋\n\nSebelum mendaftar, pastikan Kakak memenuhi persyaratan umum berikut:\n- Warga Negara Indonesia (WNI) beragama Islam\n- Usia muda produktif (pelajar, mahasiswa, fresh graduate, atau pemuda aktif)\n- Memiliki prestasi / kontribusi / semangat berdakwah\n- Berkomitmen mengikuti seluruh tahapan seleksi\n- Sehat jasmani & rohani, siap beribadah di Tanah Suci\n\n📌 Info lengkap: https://safariman.my.id",
  },
  {
    keyword: "kategori",
    label: "Kategori Program",
    category: "Umum",
    message:
      "Program Safar Iman terbuka dalam beberapa kategori:\n\n1️⃣ *Reguler (Fully Funded)* — jalur utama, seleksi penuh.\n2️⃣ *Fast Track Gelombang 1 & 2* — jalur cepat dengan kuota terbatas.\n3️⃣ *Self Funded* — jalur mandiri bagi yang ingin berangkat bersama komunitas Safar Iman.\n\nDetail: https://safariman.my.id",
  },

  // ===== PENDAFTARAN =====
  {
    keyword: "daftar",
    label: "Cara Pendaftaran",
    category: "Pendaftaran",
    message:
      "Hallo Kak 👋\n\nBerikut langkah pendaftaran Safar Iman:\n1. Buka website resmi: https://safariman.my.id\n2. Klik menu *Daftar Sekarang*\n3. Pilih kategori (Reguler / Fast Track / Self Funded)\n4. Isi formulir dengan data yang benar\n5. *Simpan Kode Pendaftaran* yang muncul — akan dipakai untuk semua tahapan berikutnya\n\nSemoga dimudahkan! 🤲",
  },
  {
    keyword: "kode",
    label: "Lupa Kode Pendaftaran",
    category: "Pendaftaran",
    message:
      "Kode pendaftaran otomatis muncul setelah Kakak berhasil daftar dan dikirim juga ke email/WhatsApp yang didaftarkan.\n\nJika belum menemukan, silakan cek:\n- Kotak masuk & folder Spam email\n- Riwayat chat WhatsApp dari Safar Iman\n\nJika masih belum ketemu, kirimkan *nama lengkap + email* yang dipakai daftar ya, akan kami bantu cek 🙏",
  },
  {
    keyword: "gelombang",
    label: "Info Gelombang / Fast Track",
    category: "Pendaftaran",
    message:
      "Program Fast Track dibuka dalam beberapa gelombang dengan kuota terbatas.\n\nCek jadwal & ketersediaan gelombang di:\nhttps://safariman.my.id\n\nDisarankan daftar lebih awal karena kuota bisa habis sewaktu-waktu ya, Kak ✨",
  },
  {
    keyword: "mandiri",
    label: "Info Self Funded",
    category: "Pendaftaran",
    message:
      "Jalur *Self Funded* cocok untuk Kakak yang ingin berangkat bersama komunitas Safar Iman tanpa melalui seleksi ketat kategori Reguler.\n\nInfo & pendaftaran Self Funded:\nhttps://safariman.my.id/daftar-mandiri",
  },

  // ===== BERKAS =====
  {
    keyword: "berkas",
    label: "Cara Kirim Berkas",
    category: "Berkas",
    message:
      "Untuk kirim berkas administrasi (CV & Foto), silakan:\n1. Buka https://safariman.my.id/berkas\n2. Masukkan *Kode Pendaftaran*\n3. Upload CV format PDF (maks. 2 MB)\n4. Upload Foto formal (rasio 3x4, latar polos)\n5. Klik *Kirim Berkas*\n\nStatus akan otomatis terupdate setelah berkas diterima.",
  },
  {
    keyword: "cv",
    label: "Ketentuan CV",
    category: "Berkas",
    message:
      "Ketentuan CV Safar Iman:\n- Format PDF, ukuran maks. 2 MB\n- Berisi: data diri, riwayat pendidikan, pengalaman organisasi, prestasi, pengalaman dakwah/sosial (jika ada)\n- Rapi, mudah dibaca, boleh gunakan template Canva/Word\n\nCV adalah salah satu berkas utama yang dinilai, pastikan diisi jujur dan lengkap ya 🙌",
  },
  {
    keyword: "foto",
    label: "Ketentuan Foto",
    category: "Berkas",
    message:
      "Ketentuan foto:\n- Foto formal terbaru\n- Rasio 3x4, latar belakang polos (biru/merah/putih)\n- Wajah terlihat jelas, berpakaian sopan & syar'i\n- Format JPG/PNG, maks. 2 MB",
  },
  {
    keyword: "cek-berkas",
    label: "Cek Status Berkas",
    category: "Berkas",
    message:
      "Untuk memastikan berkas sudah diterima, silakan cek status pendaftaran di:\nhttps://safariman.my.id/cek-tahapan\n\nMasukkan *Kode Pendaftaran* Kakak. Status akan menampilkan tahapan yang sudah/ belum diselesaikan ✅",
  },

  // ===== ESSAY =====
  {
    keyword: "essay",
    label: "Pengisian Essay",
    category: "Essay",
    message:
      "Halaman pengisian essay:\nhttps://safariman.my.id/essay\n\nGunakan *Kode Pendaftaran* untuk masuk. Terdapat 3 pertanyaan utama:\n1. Kenapa layak berangkat umrah bersama Safar Iman?\n2. Mimpi & tujuan setelah umrah\n3. Kontribusi yang akan diberikan kepada umat\n\nTulis dengan jujur, reflektif, dan dari hati ya, Kak 🤲",
  },
  {
    keyword: "essay-tips",
    label: "Tips Menulis Essay",
    category: "Essay",
    message:
      "Tips essay Safar Iman:\n- Tulis dengan bahasa sendiri, hindari copy-paste\n- Ceritakan pengalaman nyata & spesifik\n- Sampaikan niat & motivasi ibadah dengan tulus\n- Jelaskan rencana kontribusi setelah umrah\n- Perhatikan ejaan & tanda baca\n\nEssay adalah pintu utama seleksi, luangkan waktu untuk menulis dengan baik ya ✨",
  },

  // ===== PEMBAYARAN =====
  {
    keyword: "bayar",
    label: "Cara Pembayaran / Kontribusi",
    category: "Pembayaran",
    message:
      "Untuk melakukan pembayaran kontribusi, silakan:\n1. Buka status pendaftaran: https://safariman.my.id/cek-tahapan\n2. Klik tombol *Bayar* — akan diarahkan ke halaman Mayar\n3. Pilih metode pembayaran (QRIS, VA Bank, e-wallet, dll.)\n4. Selesaikan pembayaran\n\nStatus otomatis terupdate maksimal 5 menit setelah pembayaran berhasil ✅",
  },
  {
    keyword: "bukti-bayar",
    label: "Bukti Pembayaran",
    category: "Pembayaran",
    message:
      "Pembayaran melalui Mayar otomatis tercatat di sistem kami, jadi tidak perlu kirim bukti transfer manual ya, Kak 🙏\n\nJika status belum berubah setelah 15 menit, silakan kirim:\n- Kode Pendaftaran\n- Screenshot bukti pembayaran\nkami bantu cek 🙌",
  },

  // ===== TAHAPAN SELEKSI =====
  {
    keyword: "tahap",
    label: "Cek Tahapan Seleksi",
    category: "Tahapan Seleksi",
    message:
      "Untuk cek tahapan seleksi (Essay, TKA, Interview), silakan buka:\nhttps://safariman.my.id/cek-tahapan\n\nMasukkan *Kode Pendaftaran* Kakak. Hasil setiap tahap akan muncul di sini setelah diumumkan.",
  },
  {
    keyword: "seleksi",
    label: "Alur Seleksi",
    category: "Tahapan Seleksi",
    message:
      "Alur seleksi Safar Iman (kategori Reguler):\n1️⃣ Pendaftaran & Berkas Administrasi\n2️⃣ Essay\n3️⃣ TKA (Tes Kemampuan Akademik & Wawasan Keislaman)\n4️⃣ Interview\n5️⃣ Pengumuman Awardee\n\nSemua tahap dilakukan online. Semoga dimudahkan sampai akhir 🤲",
  },
  {
    keyword: "tka",
    label: "Info Tes TKA",
    category: "Tahapan Seleksi",
    message:
      "Tes TKA (Tes Kemampuan Akademik & Wawasan Keislaman) dilakukan secara online untuk mengukur:\n- Wawasan keislaman dasar\n- Logika & penalaran\n- Pengetahuan umum\n\nBisa dikerjakan via HP/laptop. Jadwal & link tes akan dikirim melalui WhatsApp & email peserta yang lolos essay ya, Kak.",
  },
  {
    keyword: "interview",
    label: "Info Interview",
    category: "Tahapan Seleksi",
    message:
      "Interview dilakukan online (via Zoom/Google Meet) bersama tim Safar Iman.\n\nYang dinilai: motivasi, adab, kesiapan ibadah, rencana kontribusi, dan kesesuaian dengan nilai program.\n\nJadwal interview akan dikonfirmasi ke peserta yang lolos TKA melalui WhatsApp & email 📩",
  },
  {
    keyword: "hasil",
    label: "Cek Hasil Seleksi",
    category: "Tahapan Seleksi",
    message:
      "Untuk cek hasil seleksi, silakan buka:\nhttps://safariman.my.id/cek-hasil\n\nMasukkan *Kode Pendaftaran*. Hasil hanya tampil setelah pengumuman resmi dari tim Safar Iman ya 🙏",
  },

  // ===== KONTRIBUSI =====
  {
    keyword: "kontribusi",
    label: "Info Kontribusi Peserta",
    category: "Kontribusi",
    message:
      "Info lengkap kontribusi & benefit peserta lolos:\nhttps://safariman.my.id/kontribusi\n\nKontribusi peserta InsyaAllah digunakan untuk:\n- Sedekah Al-Qur'an\n- Berbagi makanan\n- Sedekah kursi duduk di Makkah & Madinah\n- Mendukung kegiatan Safar Iman\n\nSetiap rupiahnya berputar jadi kebaikan bersama 🤍",
  },
  {
    keyword: "benefit",
    label: "Benefit Peserta Lolos",
    category: "Kontribusi",
    message:
      "Benefit untuk Awardee Safar Iman:\n✔️ Umrah gratis bersama komunitas pemuda pilihan\n✔️ Pembinaan pra-keberangkatan (manasik, adab, materi ruhiyah)\n✔️ Pengalaman ibadah & networking dengan pemuda inspiratif se-Indonesia\n✔️ Merchandise & sertifikat Awardee\n\nDetail: https://safariman.my.id/kontribusi",
  },

  // ===== LAINNYA =====
  {
    keyword: "faq",
    label: "Arahkan ke FAQ",
    category: "Lainnya",
    message:
      "Pertanyaan umum sudah kami rangkum di halaman FAQ:\nhttps://safariman.my.id/faq\n\nSilakan dicek dulu, siapa tahu jawabannya sudah tersedia di sana 🙏",
  },
  {
    keyword: "twibbon",
    label: "Twibbon Safar Iman",
    category: "Lainnya",
    message:
      "Ikut ramaikan Safar Iman dengan pasang twibbon:\nhttps://safariman.my.id/twibbon\n\nJangan lupa share ke media sosial & tag @safariman.id ya, Kak ✨",
  },
  {
    keyword: "channel",
    label: "WhatsApp Channel",
    category: "Lainnya",
    message:
      "Yuk gabung WhatsApp Channel Safar Iman untuk update info program, tips seleksi, & motivasi harian:\n\nCek link channel di https://safariman.my.id 🕋",
  },
  {
    keyword: "kontak",
    label: "Kontak Admin",
    category: "Lainnya",
    message:
      "Kakak bisa menghubungi admin Safar Iman melalui WhatsApp ini di jam operasional (09.00–17.00 WIB, Senin–Jumat).\n\nDi luar jam tersebut, pesan tetap kami baca & akan dibalas secepatnya ya 🙏",
  },
  {
    keyword: "terima",
    label: "Penutup",
    category: "Umum",
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
