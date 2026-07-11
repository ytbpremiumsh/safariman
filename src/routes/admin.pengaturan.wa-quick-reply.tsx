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
      "Assalamu'alaikum warahmatullahi wabarakatuh 🙏\n\nTerima kasih telah menghubungi *Safar Iman* — program Umrah Gratis untuk anak muda berprestasi (kolaborasi *Hasanah Tour & Travel × Prestasi Kita*).\n\nAda yang bisa kami bantu, Kak? 😊",
  },
  {
    keyword: "tentang",
    label: "Tentang Safar Iman",
    category: "Umum",
    message:
      "Hi Sahabat Safar Iman! 🕋\n\n*Safar Iman* adalah program Umrah Gratis untuk anak muda berprestasi hasil kolaborasi *Hasanah Tour & Travel × Prestasi Kita*.\n\nKegiatan utama peserta:\n• Ibadah Umrah sesuai sunnah\n• Sedekah Al-Qur'an\n• Berbagi makanan di Makkah & Madinah\n• City Tour & Campus Tour\n• Networking Nasional pemuda inspiratif\n\nInfo lengkap: https://www.safariman.id",
  },
  {
    keyword: "syarat",
    label: "Persyaratan Umum",
    category: "Umum",
    message:
      "*Persyaratan Umum Peserta Fully Funded* ✅\n\n• Muslim/Muslimah dengan niat kuat beribadah & belajar\n• WNI usia *12–45 tahun*\n• Terbuka untuk pelajar, mahasiswa, santri, maupun umum\n• Bersedia mengikuti seluruh tahapan & ketentuan program\n• Disiplin, bertanggung jawab, dan berakhlak baik\n• Siap mengikuti pembinaan, mentoring, dan kegiatan program\n• Tidak wajib fasih Bahasa Arab / Inggris\n• Terbuka untuk berbagai latar belakang pendidikan\n\nInfo lengkap: https://www.safariman.id",
  },
  {
    keyword: "kategori",
    label: "Kategori / Jalur Program",
    category: "Umum",
    message:
      "Program Safar Iman terbagi 3 jalur:\n\n1️⃣ *Fully Funded (Reguler)* — seleksi penuh, umrah gratis untuk peserta terpilih.\n2️⃣ *Partial Funded* — 30 peserta terbaik berikutnya (dari jalur Fully Funded) mendapat subsidi *Rp2.000.000/orang*.\n3️⃣ *Self Funded* — jalur mandiri tanpa seleksi ketat, kuota terbatas *10 peserta*.\n\nDetail: https://www.safariman.id",
  },

  // ===== PENDAFTARAN =====
  {
    keyword: "daftar",
    label: "Cara Pendaftaran",
    category: "Pendaftaran",
    message:
      "*Cara Mendaftar Safar Iman* 📝\n\n1. Buka website resmi: https://www.safariman.id\n2. Klik *Daftar Sekarang* dan pilih jalur (Fully Funded / Fast Track / Self Funded)\n3. Isi form pendaftaran dengan data yang benar\n4. Wajib follow akun *Instagram & TikTok* penyelenggara:\n   • @safariman.id\n   • @hasanah.tours.travel\n   • @hasanah.hajiumrohsemarang\n   • @prestasikita\n5. *Simpan Kode Pendaftaran* (format: HXP-XXXXXXXX) untuk semua tahapan berikutnya\n\nSemoga dimudahkan! 🤲",
  },
  {
    keyword: "kode",
    label: "Kode Pendaftaran (HXP-XXXXXXXX)",
    category: "Pendaftaran",
    message:
      "Setelah mendaftar online di https://www.safariman.id, peserta otomatis menerima *Kode Pendaftaran unik berformat HXP-XXXXXXXX*.\n\nKode ini dikirim via email & WhatsApp, dan wajib digunakan untuk:\n• Kirim berkas administrasi\n• Kontribusi\n• Essay & studi kasus\n• Cek tahapan & hasil seleksi\n\nJika belum menemukan, cek folder Spam email atau kirimkan *nama lengkap + email pendaftaran* ke admin, akan kami bantu cek 🙏",
  },
  {
    keyword: "sosmed",
    label: "Akun yang Wajib Difollow",
    category: "Pendaftaran",
    message:
      "Peserta *wajib follow* akun berikut sebagai syarat pendaftaran:\n\n📸 *Instagram:*\n• @safariman.id\n• @hasanah.tours.travel\n• @hasanah.hajiumrohsemarang\n• @prestasikita\n\n🎵 *TikTok:*\n• @safariman.id\n• @hasanah.tours.travel\n• @hasanah.hajiumrohsemarang\n• @prestasikita",
  },
  {
    keyword: "mandiri",
    label: "Info Self Funded",
    category: "Pendaftaran",
    message:
      "*Jalur Self Funded* 🕋\n\n• Mengisi form pendaftaran di https://www.safariman.id\n• Membayar administrasi pendaftaran *Rp50.000*\n• Wajib follow Instagram & TikTok penyelenggara (@safariman.id, @hasanah.tours.travel, @hasanah.hajiumrohsemarang, @prestasikita)\n• *Kuota terbatas hanya 10 peserta* — ditutup jika kuota terpenuhi\n\nCocok untuk yang ingin berangkat bersama komunitas Safar Iman tanpa seleksi ketat.\n\nPendaftaran: https://www.safariman.id/daftar-mandiri",
  },

  // ===== TIMELINE =====
  {
    keyword: "timeline",
    label: "Timeline Pendaftaran Fully Funded",
    category: "Pendaftaran",
    message:
      "*Timeline Pendaftaran Safar Iman — Fully Funded* 📅\n\n1️⃣ *Reguler (GRATIS)*\n🗓️ 13 Juli – 16 September 2026\n• Mengisi form di www.safariman.id\n• Membagikan Twibbon & Poster\n• Follow Instagram & TikTok\n• Mengirimkan berkas administrasi\n\n2️⃣ *Reguler Gelombang 1 — Rp20.000* (Fast Track)\n🗓️ 13 Juli – 25 Agustus 2026\n• Mengisi form di www.safariman.id\n• Tanpa membagikan Twibbon & Poster\n• Tanpa follow Instagram & TikTok\n• Tanpa mengirim berkas administrasi\n\n3️⃣ *Reguler Gelombang 2 — Rp50.000* (Fast Track)\n🗓️ 26 Agustus – 15 September 2026\n• Mengisi form di www.safariman.id\n• Tanpa membagikan Twibbon & Poster\n• Tanpa follow Instagram & TikTok\n• Tanpa mengirim berkas administrasi\n\nDetail: https://www.safariman.id",
  },
  {
    keyword: "keberangkatan",
    label: "Jadwal Keberangkatan",
    category: "Pendaftaran",
    message:
      "*Jadwal Keberangkatan Safar Iman* ✈️\n\n🛫 *Start Jakarta*\n📅 *29 November – 8 Desember 2026*\n\nSeluruh peserta Fully Funded terpilih akan berangkat bersama sesuai jadwal di atas.\n\nInfo lengkap: https://www.safariman.id",
  },

  // ===== BERKAS =====
  {
    keyword: "berkas",
    label: "Cara Kirim Berkas Administrasi",
    category: "Berkas",
    message:
      "*Seleksi Tahap Berkas* 📄\n\n1. Pastikan sudah mendaftar di https://www.safariman.id dan menerima *Kode Pendaftaran (HXP-XXXXXXXX)*\n2. Buka https://www.safariman.id/berkas\n3. Masukkan Kode Pendaftaran\n4. Lengkapi data berkas administrasi sesuai instruksi\n5. Klik *Kirim Berkas*\n\nPeserta yang lolos berkas berhak melanjutkan ke tahap selanjutnya ✅",
  },
  {
    keyword: "cek-berkas",
    label: "Cek Status Berkas",
    category: "Berkas",
    message:
      "Untuk memastikan berkas sudah diterima, cek status pendaftaran di:\nhttps://www.safariman.id/cek-tahapan\n\nMasukkan *Kode Pendaftaran (HXP-XXXXXXXX)*. Status akan menampilkan tahapan yang sudah / belum diselesaikan ✅",
  },

  // ===== ESSAY =====
  {
    keyword: "essay",
    label: "Tahap Essay & Studi Kasus",
    category: "Essay",
    message:
      "*Tahap Essay & Studi Kasus* ✍️\n\n• Hanya diikuti peserta yang lolos seleksi berkas administrasi\n• Sebelum mengerjakan, peserta wajib menunaikan *donasi Rp100.000* melalui halaman resmi: https://www.safariman.id/kontribusi\n• Setelah kontribusi selesai, akses halaman essay & studi kasus di: https://www.safariman.id/essay\n• Tim seleksi akan meninjau essay — peserta yang lolos akan lanjut ke tahap *TKA (Tes Kesiapan Awal)*",
  },
  {
    keyword: "essay-tips",
    label: "Tips Menulis Essay",
    category: "Essay",
    message:
      "*Tips Essay Safar Iman* ✨\n\n• Tulis dengan bahasa sendiri, hindari copy-paste\n• Ceritakan pengalaman nyata & spesifik\n• Sampaikan niat & motivasi ibadah dengan tulus\n• Jelaskan rencana kontribusi setelah umrah\n• Perhatikan ejaan & tanda baca\n\nEssay adalah pintu utama seleksi, luangkan waktu menulis dengan baik ya 🤲",
  },

  // ===== PEMBAYARAN =====
  {
    keyword: "bayar",
    label: "Cara Pembayaran / Kontribusi",
    category: "Pembayaran",
    message:
      "*Cara Pembayaran Kontribusi* 💳\n\n1. Buka halaman kontribusi: https://www.safariman.id/kontribusi\n   (atau via https://www.safariman.id/cek-tahapan)\n2. Klik tombol *Bayar* — akan diarahkan ke halaman Mayar\n3. Pilih metode pembayaran (QRIS, VA Bank, e-wallet, dll.)\n4. Selesaikan pembayaran\n\nStatus otomatis terupdate maksimal 5 menit setelah pembayaran berhasil ✅",
  },
  {
    keyword: "bukti-bayar",
    label: "Bukti Pembayaran",
    category: "Pembayaran",
    message:
      "Pembayaran melalui Mayar otomatis tercatat di sistem kami, jadi tidak perlu kirim bukti transfer manual ya, Kak 🙏\n\nJika status belum berubah setelah 15 menit, silakan kirim:\n• Kode Pendaftaran (HXP-XXXXXXXX)\n• Screenshot bukti pembayaran\nkami bantu cek 🙌",
  },
  {
    keyword: "nominal",
    label: "Nominal Biaya Program",
    category: "Pembayaran",
    message:
      "*Nominal Biaya Program Safar Iman* 💰\n\n📌 *Fully Funded — Reguler:* GRATIS\n📌 *Fully Funded — Gelombang 1 (Fast Track):* Rp20.000\n📌 *Fully Funded — Gelombang 2 (Fast Track):* Rp50.000\n📌 *Kontribusi Tahap Essay & Studi Kasus:* Rp100.000\n📌 *Self Funded — Administrasi Pendaftaran:* Rp50.000\n\nSeluruh kontribusi peserta digunakan untuk kegiatan Safar Iman, berbagi makanan, dan sedekah Al-Qur'an di Makkah & Madinah 🤍",
  },

  // ===== TAHAPAN SELEKSI =====
  {
    keyword: "tahap",
    label: "Cek Tahapan Seleksi",
    category: "Tahapan Seleksi",
    message:
      "Untuk cek tahapan seleksi (Berkas, Essay, TKA, Interview), buka:\nhttps://www.safariman.id/cek-tahapan\n\nMasukkan *Kode Pendaftaran (HXP-XXXXXXXX)*. Hasil setiap tahap akan muncul setelah diumumkan.",
  },
  {
    keyword: "seleksi",
    label: "Alur Seleksi Fully Funded",
    category: "Tahapan Seleksi",
    message:
      "*Alur Seleksi Safar Iman — Fully Funded* 📋\n\n1️⃣ *Seleksi Berkas* — berdasarkan berkas form yang ditentukan panitia\n2️⃣ *Essay & Studi Kasus* — menjawab studi kasus & memberikan solusi melalui form online (didahului kontribusi Rp100.000)\n3️⃣ *TKA (Tes Kesiapan Awal)* — Computer Based Test (CBT) online untuk mengukur kesiapan, kemampuan berpikir & pemahaman dasar\n4️⃣ *Interview Online* — bersama tim seleksi\n5️⃣ *Pengumuman Awardee*\n\n📌 Catatan:\n• Ketiga tahap awal harus dikerjakan berurutan, tidak dapat dilewati\n• Peserta *Fast Track* dinyatakan langsung lolos berkas dan lanjut ke tahap kontribusi + Essay & Studi Kasus\n• Pastikan nomor WhatsApp aktif agar tidak ketinggalan info penting 🤲",
  },
  {
    keyword: "tka",
    label: "Info Tes TKA",
    category: "Tahapan Seleksi",
    message:
      "*Tahap Kesiapan Awal (TKA)* 🖥️\n\n• Diikuti oleh peserta yang lolos essay & studi kasus\n• Berbasis *Computer Based Test (CBT) online*, mengukur kesiapan, kemampuan berpikir, dan pemahaman dasar\n• Akses website TKA: *https://tka.safariman.id*\n• Soal berbentuk pilihan ganda dengan batas waktu — hasil tercatat otomatis di sistem\n• *10 peserta dengan nilai tertinggi* berhak lanjut ke sesi *Interview*\n\nPastikan mengikuti jadwal resmi Safar Iman ya, Kak 🙏",
  },
  {
    keyword: "interview",
    label: "Info Interview",
    category: "Tahapan Seleksi",
    message:
      "*Interview Online* 🎤\n\n• Diikuti oleh *10 peserta dengan nilai TKA tertinggi*\n• Dilakukan online (via Zoom / Google Meet) bersama tim seleksi Safar Iman\n• Yang dinilai: motivasi, adab, kesiapan ibadah, rencana kontribusi, kesesuaian dengan nilai program\n\nJadwal interview dikonfirmasi via WhatsApp & email ke peserta yang lolos TKA 📩",
  },
  {
    keyword: "partial",
    label: "Info Partial Funded",
    category: "Tahapan Seleksi",
    message:
      "*Jalur Partial Funded* 🎗️\n\n• Diperuntukkan bagi peserta yang telah mendaftar jalur *Fully Funded* namun belum terpilih sebagai penerima pembiayaan penuh\n• Sebanyak *30 orang peserta terbaik berikutnya* berkesempatan memperoleh *subsidi program sebesar Rp2.000.000/orang*\n\nInfo lengkap: https://www.safariman.id",
  },
  {
    keyword: "hasil",
    label: "Cek Hasil Seleksi",
    category: "Tahapan Seleksi",
    message:
      "Untuk cek hasil seleksi, buka:\nhttps://www.safariman.id/cek-hasil\n\nMasukkan *Kode Pendaftaran (HXP-XXXXXXXX)*. Hasil hanya tampil setelah pengumuman resmi tim Safar Iman. Pengumuman juga disiarkan di kanal resmi Safar Iman 🙏",
  },

  // ===== KONTRIBUSI =====
  {
    keyword: "kontribusi",
    label: "Info Kontribusi & Apresiasi Peserta",
    category: "Kontribusi",
    message:
      "*Kontribusi Peserta Safar Iman* 🤍\n\nHalaman kontribusi: https://www.safariman.id/kontribusi\nNominal: *Rp100.000* (tahap essay & studi kasus)\n\nKontribusi digunakan untuk mendukung *kegiatan Safar Iman, berbagi makanan, dan sedekah Al-Qur'an di Makkah & Madinah* sebagai bentuk kolaborasi kebaikan.\n\n✨ *Apresiasi Peserta (senilai Rp79.000, GRATIS untuk yang berkontribusi):*\n🎓 Kelas Online — *Sekolah Tamu Allah: Bedah Persiapan Umrohmu, Kembali dengan Mabrur* bersama *Ustadz Ahmad Fauzan, Lc.* (Pembimbing Manasik & Praktisi Umrah)\n📖 Kajian — *Mengenal Sirah Haramain: Bekal Sebelum ke Baitullah* bersama *Ustadz Hilman Al Hazmi, Lc.* (Alumni Syariah Islamiyyah Al Azhar University)\n📜 E-Sertifikat Resmi setelah menyelesaikan kelas\n▶️ Akses Rekaman — tonton ulang kapan saja",
  },
  {
    keyword: "benefit",
    label: "Benefit & Fasilitas Fully Funded",
    category: "Kontribusi",
    message:
      "*Benefit & Fasilitas Peserta Fully Funded* 🕋\n\nDisiapkan khusus oleh *Safar Iman × Hasanah × Prestasi Kita* untuk peserta yang terpilih melalui jalur pembiayaan penuh.\n\n🛫 *Start Jakarta — 29 November – 8 Desember 2026*\n\n*Fasilitas:*\n🏨 Hotel Bintang 4\n✈️ Tiket pesawat PP\n🍱 Makan 3x sehari\n🧑‍🏫 Pembimbing ibadah\n🚌 Bus AC & city tour\n🧳 Perlengkapan umrah\n📘 Visa dan Asuransi\n🪪 ID Siskopatuh\n🕌 Manasik Umrah\n👆 Akses Kelas Tamu Allah\n\n📌 *Catatan:*\n• Seluruh peserta melalui tahapan seleksi yang sama sesuai ketentuan program\n• Penetapan penerima manfaat berdasarkan hasil administrasi, essay, wawancara, dan tahapan lanjutan\n• Hasil seleksi diumumkan terbuka melalui kanal resmi Safar Iman\n\nDetail: https://www.safariman.id",
  },
  {
    keyword: "kegiatan",
    label: "Kegiatan Program Safar Iman",
    category: "Kontribusi",
    message:
      "*Kegiatan Detail Program Safar Iman* 🕋\n\nSafar Iman adalah program Umrah Gratis yang memadukan ibadah sesuai sunnah dengan kegiatan berbagi & pembelajaran:\n\n🕋 Ibadah Umrah\n📖 Sedekah Al-Qur'an\n🏛️ City Tour\n🍱 Berbagi Makanan (Makkah & Madinah)\n🤝 Networking Nasional\n🎓 Campus Tour\n\nMenghadirkan pengalaman spiritual yang bermakna dan penuh keberkahan.\n\nInfo lengkap: https://www.safariman.id",
  },

  // ===== LAINNYA =====
  {
    keyword: "faq",
    label: "Arahkan ke FAQ",
    category: "Lainnya",
    message:
      "Pertanyaan umum sudah kami rangkum di halaman FAQ:\nhttps://www.safariman.id/faq\n\nSilakan dicek dulu, siapa tahu jawabannya sudah tersedia 🙏",
  },
  {
    keyword: "twibbon",
    label: "Twibbon Safar Iman",
    category: "Lainnya",
    message:
      "*Cara Ikut Twibbon Safar Iman* 📸\n\n1. Unduh twibbon di https://www.safariman.id/twibbon\n2. Unggah di feed Instagram dengan caption yang sudah disediakan\n3. Tag *5 teman* di caption\n4. Bagikan twibbon ke *5 grup WhatsApp*\n5. Jangan lupa tag @safariman.id ✨\n\nTwibbon & caption resmi tersedia di https://www.safariman.id",
  },
  {
    keyword: "channel",
    label: "WhatsApp Channel",
    category: "Lainnya",
    message:
      "Yuk gabung *WhatsApp Channel Safar Iman* untuk update info program, tips seleksi, & motivasi harian:\n\nCek link channel di https://www.safariman.id 🕋",
  },
  {
    keyword: "kontak",
    label: "Kontak Admin",
    category: "Lainnya",
    message:
      "Kakak bisa menghubungi admin Safar Iman via WhatsApp ini pada jam operasional (09.00–17.00 WIB, Senin–Jumat).\n\nDi luar jam tersebut, pesan tetap kami baca & akan dibalas secepatnya ya 🙏",
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
