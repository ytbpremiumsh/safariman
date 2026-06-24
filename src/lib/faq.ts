import { supabase } from "@/integrations/supabase/client";

export type FaqItem = { q: string; a: string; category?: string };
export type FaqConfig = { enabled: boolean; items: FaqItem[] };

export const FAQ_CATEGORIES = [
  "Umum",
  "Pendaftaran",
  "Berkas",
  "Essay & Studi Kasus",
  "Timeline & Tanggal",
  "Benefit",
  "Kontribusi & Add-on",
  "Seleksi & Pengumuman",
] as const;

export const DEFAULT_FAQ: FaqItem[] = [
  // Umum
  { category: "Umum", q: "Apa itu Safar Iman?", a: "Safar Iman adalah program perjalanan ibadah & pengembangan diri ke Tanah Suci yang dirancang khusus untuk anak muda, hasil kolaborasi Hasanah Tour & Travel × Prestasi Kita." },
  { category: "Umum", q: "Siapa saja yang bisa mengikuti Safar Iman?", a: "Pemuda/i Muslim usia 17–30 tahun yang berdomisili di Indonesia, sehat secara jasmani & rohani, serta bersedia mengikuti seluruh tahapan seleksi." },
  { category: "Umum", q: "Apakah Safar Iman berbayar?", a: "Tersedia jalur Fully Funded (gratis biaya keberangkatan), Self Funded (mandiri), serta Gelombang 1 & 2 dengan biaya kontribusi tertentu. Detail bisa dilihat di halaman utama bagian Program." },
  { category: "Umum", q: "Dari kota mana saja peserta yang bisa mendaftar?", a: "Pendaftaran terbuka untuk seluruh wilayah Indonesia. Titik kumpul keberangkatan akan diinfokan setelah seleksi final." },

  // Pendaftaran
  { category: "Pendaftaran", q: "Kapan pendaftaran dibuka dan ditutup?", a: "Pendaftaran dibuka mulai 25 Juni 2026 hingga 31 Agustus 2026. Tahap ini berjalan bersamaan dengan twibbon, pengiriman berkas, seleksi administrasi, serta pengisian essay & studi kasus." },
  { category: "Pendaftaran", q: "Bagaimana cara mendaftar Safar Iman?", a: "Buka halaman /pendaftaran, pilih jalur (Fully Funded / Self Funded / Gelombang 1 / Gelombang 2), lengkapi formulir, dan simpan Kode Pendaftaran yang muncul." },
  { category: "Pendaftaran", q: "Apa itu Kode Pendaftaran (HXP-xxxxxxxx)?", a: "Kode unik yang otomatis terbit saat kamu berhasil mendaftar. Kode ini digunakan untuk login berkas, essay, cek status, dan pembayaran kontribusi." },
  { category: "Pendaftaran", q: "Saya lupa/kehilangan Kode Pendaftaran, bagaimana?", a: "Hubungi admin Safar Iman lewat WhatsApp yang tertera di footer website dengan menyertakan nama lengkap dan email pendaftaran. Tim kami akan membantu pemulihan." },
  { category: "Pendaftaran", q: "Apakah saya bisa mendaftar lebih dari satu jalur?", a: "Tidak. Satu peserta hanya boleh memilih satu jalur. Pemilihan dilakukan sejak awal pendaftaran." },
  { category: "Pendaftaran", q: "Apakah ada biaya pendaftaran?", a: "Pendaftaran tidak dipungut biaya. Kontribusi hanya berlaku untuk jalur Self Funded / Gelombang / Add-on benefit yang sifatnya opsional." },

  // Berkas
  { category: "Berkas", q: "Berkas apa saja yang harus dikirim?", a: "CV/Curriculum Vitae terbaru (PDF), foto diri formal (JPG/PNG), serta data pendukung lain sesuai instruksi pada halaman /berkas." },
  { category: "Berkas", q: "Berapa ukuran maksimal file berkas?", a: "Maksimal 5 MB per file. Gunakan format PDF untuk CV dan JPG/PNG untuk foto agar mudah diproses." },
  { category: "Berkas", q: "Apakah saya bisa mengubah berkas setelah dikirim?", a: "Selama pendaftaran masih dibuka (sebelum 31 Agustus 2026), kamu bisa mengirim ulang berkas dengan Kode Pendaftaran yang sama; data baru akan menimpa data lama." },
  { category: "Berkas", q: "Bagaimana cara mengetahui berkas saya sudah diterima?", a: "Setelah submit, halaman sukses akan menampilkan konfirmasi. Kamu juga akan menerima notifikasi email dan dapat mengecek status di halaman /cek-hasil." },

  // Essay & Studi Kasus
  { category: "Essay & Studi Kasus", q: "Apa saja essay yang harus diisi?", a: "Tiga essay utama: (1) Mengapa kamu layak ke Tanah Suci, (2) Mimpi & visi hidupmu, (3) Kontribusi yang akan kamu berikan sepulang dari program." },
  { category: "Essay & Studi Kasus", q: "Apakah ada studi kasus?", a: "Ya. Studi kasus berupa pertanyaan reflektif/problem-solving terkait kepemimpinan dan kebermanfaatan. Detail soal muncul di halaman /essay." },
  { category: "Essay & Studi Kasus", q: "Berapa panjang ideal essay?", a: "Minimal 200 kata per essay, maksimal 800 kata. Fokus pada kejujuran dan kedalaman refleksi, bukan panjangnya tulisan." },
  { category: "Essay & Studi Kasus", q: "Apakah essay bisa diedit setelah dikirim?", a: "Selama periode pengisian masih dibuka, essay & studi kasus dapat diperbarui menggunakan Kode Pendaftaran. Versi terbaru yang akan dinilai." },
  { category: "Essay & Studi Kasus", q: "Apakah boleh menulis essay dengan bantuan AI?", a: "Essay harus mencerminkan suara dan pengalaman pribadi. Penggunaan AI sebagai bantuan menulis diperbolehkan, tapi substansi & kejujuran cerita adalah hal yang kami nilai utama." },

  // Timeline
  { category: "Timeline & Tanggal", q: "Bagaimana garis waktu lengkap program?", a: "Pendaftaran, Twibbon, Berkas, Seleksi Administrasi, dan Essay/Studi Kasus berjalan paralel 25 Juni – 31 Agustus 2026. Lalu Pengumuman Lolos Essay (5 Sep), CBT (10–20 Sep), Interview di hari Ahad (27 Sep & 4 Okt), Pengumuman Final (11 Okt), Technical Meeting akhir Oktober, Keberangkatan November 2026." },
  { category: "Timeline & Tanggal", q: "Kapan jadwal interview?", a: "Interview dilaksanakan di hari Ahad, 27 September 2026 dan 4 Oktober 2026 secara online. Jadwal personal akan dikirim setelah lolos CBT." },
  { category: "Timeline & Tanggal", q: "Kapan keberangkatan ke Tanah Suci?", a: "Keberangkatan dijadwalkan pada November 2026. Tanggal pasti dirilis pada Technical Meeting akhir Oktober 2026." },
  { category: "Timeline & Tanggal", q: "Apakah timeline bisa berubah?", a: "Bisa, jika ada kondisi tak terduga (kebijakan otoritas, force majeure). Perubahan akan diumumkan melalui email, Saluran WhatsApp resmi, dan halaman utama." },

  // Seleksi & Pengumuman
  { category: "Seleksi & Pengumuman", q: "Bagaimana saya tahu lolos atau tidak?", a: "Cek di halaman /cek-hasil dengan Kode Pendaftaran. Pengumuman juga dikirim via email dan diumumkan di Saluran WhatsApp resmi." },
  { category: "Seleksi & Pengumuman", q: "Apa itu CBT (Computer-Based Test)?", a: "Tes online untuk menyaring peserta yang lolos ke tahap interview. Materinya seputar wawasan keislaman ringan, logika, kepemimpinan, dan komitmen program." },
  { category: "Seleksi & Pengumuman", q: "Apakah keputusan panitia bisa diganggu gugat?", a: "Tidak. Keputusan panitia bersifat final dan tidak dapat diganggu gugat, namun seluruh proses seleksi dirancang transparan dan adil." },

  // Benefit
  { category: "Benefit", q: "Apa saja benefit utama mengikuti Safar Iman?", a: "Bagi peserta Fully Funded: tiket pesawat PP, akomodasi, konsumsi, visa, manasik, mentoring, sertifikat, dan jaringan komunitas alumni Safar Iman." },
  { category: "Benefit", q: "Apakah peserta mendapat mentoring?", a: "Ya. Selama program berlangsung, peserta mendapat mentoring dari pembimbing rohani & coach pengembangan diri, baik pra-keberangkatan maupun di Tanah Suci." },
  { category: "Benefit", q: "Apakah ada sertifikat?", a: "Ya. Setiap peserta yang menyelesaikan program mendapat sertifikat resmi Safar Iman dan akses ke komunitas alumni." },

  // Kontribusi & Add-on
  { category: "Kontribusi & Add-on", q: "Apa itu Kontribusi (Add-on Benefit)?", a: "Kontribusi adalah donasi sukarela untuk mendukung keberlangsungan program. Sebagai apresiasi, kontributor mendapat benefit tambahan seperti merchandise eksklusif, akses prioritas, dan undangan event alumni." },
  { category: "Kontribusi & Add-on", q: "Apakah kontribusi wajib?", a: "Tidak. Kontribusi sepenuhnya opsional dan tidak memengaruhi penilaian seleksi. Peserta Fully Funded tetap diprioritaskan secara meritokratis." },
  { category: "Kontribusi & Add-on", q: "Bagaimana cara berkontribusi?", a: "Buka halaman /kontribusi, pilih nominal, lalu lakukan pembayaran melalui invoice Mayar yang otomatis terbit. Bukti kontribusi tersimpan di akun pendaftaranmu." },
  { category: "Kontribusi & Add-on", q: "Apakah kontribusi bisa direfund?", a: "Kontribusi bersifat sukarela dan non-refundable. Dana digunakan untuk operasional program, subsidi peserta Fully Funded, serta kegiatan dakwah." },
  { category: "Kontribusi & Add-on", q: "Apakah ada laporan penggunaan dana kontribusi?", a: "Ya. Laporan penggunaan dana dirilis secara berkala melalui email kontributor dan Saluran WhatsApp resmi setelah program selesai." },
];

export function parseFaqConfig(raw: unknown): FaqConfig {
  if (!raw || typeof raw !== "object") return { enabled: true, items: DEFAULT_FAQ };
  const obj = raw as { enabled?: boolean; items?: unknown };
  const items = Array.isArray(obj.items) && obj.items.length
    ? (obj.items as any[])
        .filter((x) => x && typeof x.q === "string" && typeof x.a === "string")
        .map((x) => ({
          q: String(x.q),
          a: String(x.a),
          category: typeof x.category === "string" ? x.category : undefined,
        }))
    : DEFAULT_FAQ;
  return { enabled: obj.enabled !== false, items };
}

export async function fetchFaqConfig(): Promise<FaqConfig> {
  try {
    const { data } = await supabase.rpc("get_faq_config");
    return parseFaqConfig(data);
  } catch {
    return { enabled: true, items: DEFAULT_FAQ };
  }
}
