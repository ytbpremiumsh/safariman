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
      "Wa'alaikumussalam warahmatullahi wabarakatuh Kak 🙏✨\n\nSelamat datang di *Safar Iman* — program Umrah Gratis untuk anak muda berprestasi (kolaborasi *Hasanah Tour & Travel × Prestasi Kita*).\n\nSenang sekali Kakak mau menghubungi kami 😊 Ada yang bisa kami bantu, Kak? Silakan disampaikan ya, insyaAllah kami bantu semaksimal mungkin 🤍",
  },
  {
    keyword: "tentang",
    label: "Tentang Safar Iman",
    category: "Umum",
    message:
      "Halo Kak 🕋 terima kasih sudah tertarik dengan program kami ya~\n\nJadi *Safar Iman* itu program Umrah Gratis khusus anak muda berprestasi Kak, hasil kolaborasi *Hasanah Tour & Travel × Prestasi Kita*. Selain ibadah umrah, Kakak juga akan ikut banyak kegiatan seru dan bermakna:\n\n• Ibadah Umrah sesuai sunnah 🤲\n• Sedekah Al-Qur'an 📖\n• Berbagi makanan di Makkah & Madinah 🍱\n• City Tour & Campus Tour 🏛️\n• Networking Nasional bareng pemuda inspiratif 🤝\n\nSeru banget kan Kak? Info lengkapnya bisa dicek di https://www.safariman.id ya 🤍",
  },
  {
    keyword: "syarat",
    label: "Persyaratan Umum",
    category: "Umum",
    message:
      "Siap Kak, ini persyaratan umum untuk ikut *Safar Iman* ya 🤍\nInsyaAllah terbuka luas kok Kak, semoga cocok:\n\n1. Muslim/Muslimah yang punya niat kuat untuk beribadah dan belajar 🤲\n2. Warga Negara Indonesia usia *12–45 tahun*\n3. Terbuka untuk pelajar, mahasiswa, santri, maupun umum\n4. Bersedia mengikuti seluruh tahapan dan ketentuan program\n5. Punya sikap disiplin, bertanggung jawab, dan berakhlak baik\n6. Siap ikut pembinaan, mentoring, dan kegiatan program\n7. Tidak wajib fasih Bahasa Arab atau Bahasa Inggris kok Kak 😊\n8. Terbuka bagi peserta dari berbagai latar belakang pendidikan\n\n_Ketentuan selengkapnya ada di buku panduan program ya Kak._\n\nInfo lengkap: https://www.safariman.id/#persyaratan 🕋",
  },
  {
    keyword: "kategori",
    label: "Kategori / Jalur Program",
    category: "Umum",
    message:
      "Baik Kak, Kakak bisa pilih salah satu dari 3 jalur berikut ya~\n\n1️⃣ *Fully Funded (Reguler)* — seleksi penuh Kak, umrah 100% gratis untuk peserta terpilih 🕋\n2️⃣ *Partial Funded* — 30 peserta terbaik berikutnya (dari jalur Fully Funded) dapat subsidi *Rp2.000.000/orang* 🎗️\n3️⃣ *Self Funded* — jalur mandiri tanpa seleksi ketat, kuotanya terbatas cuma *10 peserta* Kak, jadi buruan ya 😊\n\nDetail masing-masing jalur bisa Kakak cek di https://www.safariman.id 🤍",
  },

  // ===== PENDAFTARAN =====
  {
    keyword: "daftar",
    label: "Cara Pendaftaran",
    category: "Pendaftaran",
    message:
      "Alhamdulillah, semoga dimudahkan ya Kak 🤲 Berikut cara daftarnya:\n\n1. Buka website resmi kami di https://www.safariman.id\n2. Klik tombol *Daftar Sekarang* lalu pilih jalur (Fully Funded / Fast Track / Self Funded) sesuai yang Kakak mau\n3. Isi form pendaftaran dengan data yang benar ya Kak\n4. Jangan lupa follow akun *Instagram & TikTok* penyelenggara:\n   • @safariman.id\n   • @hasanah.tours.travel\n   • @hasanah.hajiumrohsemarang\n   • @prestasikita\n5. *Simpan Kode Pendaftaran* (format: HXP-XXXXXXXX) baik-baik ya Kak, itu dipakai untuk semua tahapan berikutnya 🙏\n\nKalau ada bagian yang bingung, tanya lagi aja Kak, kami bantu 😊",
  },
  {
    keyword: "kode",
    label: "Kode Pendaftaran (HXP-XXXXXXXX)",
    category: "Pendaftaran",
    message:
      "Baik Kak, jadi setelah Kakak daftar di https://www.safariman.id, sistem otomatis kirim *Kode Pendaftaran unik berformat HXP-XXXXXXXX* ke email & WhatsApp Kakak ya 📩\n\nKode ini penting banget Kak, dipakai untuk:\n• Kirim berkas administrasi 📄\n• Kontribusi 💳\n• Essay & studi kasus ✍️\n• Cek tahapan & hasil seleksi ✅\n\nKalau belum ketemu, coba cek folder *Spam / Promosi* di email dulu ya Kak. Kalau tetap belum ada, kirim aja *nama lengkap + email pendaftaran* Kakak ke sini, nanti kami bantu cekkan 🙏🤍",
  },
  {
    keyword: "sosmed",
    label: "Akun yang Wajib Difollow",
    category: "Pendaftaran",
    message:
      "Siap Kak, ini akun-akun yang *wajib difollow* sebagai syarat pendaftaran ya (nggak banyak kok, cepet 😊):\n\n📸 *Instagram:*\n• @safariman.id\n• @hasanah.tours.travel\n• @hasanah.hajiumrohsemarang\n• @prestasikita\n\n🎵 *TikTok:*\n• @safariman.id\n• @hasanah.tours.travel\n• @hasanah.hajiumrohsemarang\n• @prestasikita\n\nPastikan sudah kefollow semua ya Kak, biar aman pas verifikasi berkas 🙏🤍",
  },
  {
    keyword: "mandiri",
    label: "Info Self Funded",
    category: "Pendaftaran",
    message:
      "Baik Kak, izin jelaskan soal jalur *Self Funded* ya 🕋\n\nJalur ini cocok banget kalau Kakak pengen berangkat bareng komunitas Safar Iman tanpa seleksi ketat:\n\n• Isi form pendaftaran di https://www.safariman.id\n• Bayar administrasi pendaftaran *Rp50.000*\n• Wajib follow Instagram & TikTok penyelenggara (@safariman.id, @hasanah.tours.travel, @hasanah.hajiumrohsemarang, @prestasikita)\n• *Kuotanya cuma 10 peserta ya Kak* — kalau penuh langsung ditutup, jadi jangan lama-lama mikirnya 😊\n\nLink pendaftaran: https://www.safariman.id/daftar-mandiri 🤍",
  },

  // ===== TIMELINE =====
  {
    keyword: "timeline",
    label: "Timeline Pendaftaran Fully Funded",
    category: "Pendaftaran",
    message:
      "Siap Kak, ini timeline lengkap pendaftaran *Fully Funded* ya, dicatat baik-baik biar nggak kelewat 📅🤍\n\n1️⃣ *Reguler (GRATIS)*\n🗓️ 13 Juli – 16 September 2026\n• Isi form di www.safariman.id\n• Bagikan Twibbon & Poster\n• Follow Instagram & TikTok\n• Kirim berkas administrasi\n\n2️⃣ *Reguler Gelombang 1 — Rp20.000* (Fast Track)\n🗓️ 13 Juli – 25 Agustus 2026\n• Isi form di www.safariman.id\n• Tanpa bagikan Twibbon & Poster\n• Tanpa follow Instagram & TikTok\n• Tanpa kirim berkas administrasi\n\n3️⃣ *Reguler Gelombang 2 — Rp50.000* (Fast Track)\n🗓️ 26 Agustus – 15 September 2026\n• Isi form di www.safariman.id\n• Tanpa bagikan Twibbon & Poster\n• Tanpa follow Instagram & TikTok\n• Tanpa kirim berkas administrasi\n\nSemoga Kakak dimudahkan ya 🤲 Detail: https://www.safariman.id",
  },
  {
    keyword: "keberangkatan",
    label: "Jadwal Keberangkatan",
    category: "Pendaftaran",
    message:
      "Baik Kak, ini jadwal keberangkatan *Safar Iman* ya ✈️🕋\n\n🛫 *Start Jakarta*\n📅 *29 November – 8 Desember 2026*\n\nSeluruh peserta Fully Funded yang terpilih akan berangkat bareng-bareng sesuai jadwal di atas ya Kak. Semoga Kakak jadi salah satunya, aamiin 🤲🤍\n\nInfo lengkap: https://www.safariman.id",
  },

  // ===== BERKAS =====
  {
    keyword: "berkas",
    label: "Cara Kirim Berkas Administrasi",
    category: "Berkas",
    message:
      "Siap Kak, ini cara mengirim berkas untuk tahap *Seleksi Berkas* ya 📄\n\n1. Pastikan Kakak sudah daftar di https://www.safariman.id dan sudah pegang *Kode Pendaftaran (HXP-XXXXXXXX)*\n2. Buka https://www.safariman.id/berkas\n3. Masukkan Kode Pendaftaran Kakak\n4. Lengkapi data berkas administrasi sesuai instruksi ya\n5. Klik *Kirim Berkas* — selesai 🎉\n\nKalau lolos berkas, Kakak berhak lanjut ke tahap berikutnya. Semoga lancar ya Kak 🤍",
  },
  {
    keyword: "cek-berkas",
    label: "Cek Status Berkas",
    category: "Berkas",
    message:
      "Boleh Kak, untuk mastiin berkas Kakak sudah masuk atau belum, langsung cek aja di:\nhttps://www.safariman.id/cek-tahapan\n\nMasukkan *Kode Pendaftaran (HXP-XXXXXXXX)* Kakak ya, nanti sistem akan tampilkan tahapan mana saja yang sudah / belum diselesaikan ✅ Kalau ada kendala, chat kami lagi ya Kak 🙏",
  },

  // ===== ESSAY =====
  {
    keyword: "essay",
    label: "Tahap Essay & Studi Kasus",
    category: "Essay",
    message:
      "Baik Kak, izin jelaskan soal *tahap Essay & Studi Kasus* ya ✍️\n\n• Tahap ini khusus untuk Kakak yang sudah lolos seleksi berkas administrasi\n• Sebelum ngerjain, Kakak wajib menunaikan *donasi Rp100.000* dulu ya lewat halaman resmi: https://www.safariman.id/kontribusi\n• Setelah kontribusi selesai, halaman essay akan terbuka di: https://www.safariman.id/essay\n• Tim seleksi akan review essay Kakak — kalau lolos, lanjut ke tahap *TKA (Tes Kesiapan Awal)* 🖥️\n\nSemangat ya Kak, tulisannya ditulis dari hati aja 🤍🤲",
  },
  {
    keyword: "essay-tips",
    label: "Tips Menulis Essay",
    category: "Essay",
    message:
      "Boleh banget Kak, ini beberapa tips dari kami biar essay-nya makin oke ✨\n\n• Tulis pakai bahasa Kakak sendiri ya, hindari copy-paste 🙏\n• Ceritakan pengalaman nyata yang spesifik, jangan terlalu umum\n• Sampaikan niat & motivasi ibadah dengan tulus\n• Jelaskan rencana kontribusi Kakak setelah pulang umrah\n• Perhatikan ejaan & tanda baca ya Kak\n\nEssay ini pintu utama seleksi lho Kak, jadi luangkan waktu buat nulis dengan baik ya 🤲 Semoga tembus, aamiin 🤍",
  },

  // ===== PEMBAYARAN =====
  {
    keyword: "bayar",
    label: "Cara Pembayaran / Kontribusi",
    category: "Pembayaran",
    message:
      "Siap Kak, cara bayar kontribusinya gampang kok, ikutin aja ya 💳\n\n1. Buka halaman kontribusi: https://www.safariman.id/kontribusi\n   (atau lewat https://www.safariman.id/cek-tahapan)\n2. Klik tombol *Bayar* — nanti Kakak diarahkan ke halaman Mayar\n3. Pilih metode pembayaran (QRIS, VA Bank, e-wallet, dll.) sesuai yang paling nyaman buat Kakak\n4. Selesaikan pembayarannya\n\nStatus otomatis kebarui maksimal 5 menit setelah pembayaran berhasil ya Kak ✅ Kalau lebih dari itu belum update, chat kami lagi 🤍",
  },
  {
    keyword: "bukti-bayar",
    label: "Bukti Pembayaran",
    category: "Pembayaran",
    message:
      "Tenang Kak, pembayaran lewat Mayar sudah otomatis tercatat di sistem kami, jadi Kakak nggak perlu kirim bukti transfer manual ya 🙏🤍\n\nTapi kalau setelah 15 menit statusnya belum berubah, boleh kirim ke sini:\n• Kode Pendaftaran (HXP-XXXXXXXX)\n• Screenshot bukti pembayaran\n\nNanti kami bantu cek langsung ya Kak 🙌",
  },
  {
    keyword: "nominal",
    label: "Nominal Biaya Program",
    category: "Pembayaran",
    message:
      "Baik Kak, ini rincian nominal biayanya ya, biar Kakak bisa pilih yang paling pas 💰\n\n📌 *Fully Funded — Reguler:* GRATIS 🎉\n📌 *Fully Funded — Gelombang 1 (Fast Track):* Rp20.000\n📌 *Fully Funded — Gelombang 2 (Fast Track):* Rp50.000\n📌 *Kontribusi Tahap Essay & Studi Kasus:* Rp100.000\n📌 *Self Funded — Administrasi Pendaftaran:* Rp50.000\n\nSemua kontribusi peserta insyaAllah digunakan untuk kegiatan Safar Iman, berbagi makanan, dan sedekah Al-Qur'an di Makkah & Madinah ya Kak 🤍🕋",
  },

  // ===== TAHAPAN SELEKSI =====
  {
    keyword: "tahap",
    label: "Cek Tahapan Seleksi",
    category: "Tahapan Seleksi",
    message:
      "Boleh Kak, cek tahapan seleksi (Berkas, Essay, TKA, Interview) bisa langsung di:\nhttps://www.safariman.id/cek-tahapan\n\nMasukin *Kode Pendaftaran (HXP-XXXXXXXX)* Kakak ya. Hasil tiap tahap muncul setelah diumumkan resmi. Semoga lolos terus ya Kak, aamiin 🤲🤍",
  },
  {
    keyword: "seleksi",
    label: "Alur Seleksi Fully Funded",
    category: "Tahapan Seleksi",
    message:
      "Baik Kak, ini alur lengkap seleksi *Fully Funded* ya 📋\n\n1️⃣ *Seleksi Berkas* — dinilai dari berkas form yang ditentukan panitia\n2️⃣ *Essay & Studi Kasus* — Kakak jawab studi kasus & kasih solusi lewat form online (didahului kontribusi Rp100.000)\n3️⃣ *TKA (Tes Kesiapan Awal)* — Computer Based Test online, buat ngukur kesiapan, kemampuan berpikir & pemahaman dasar\n4️⃣ *Interview Online* — bareng tim seleksi kami 🎤\n5️⃣ *Pengumuman Awardee* 🎉\n\n📌 Yang perlu Kakak catat:\n• Tiga tahap awal wajib dikerjain berurutan ya, nggak bisa dilewati 🙏\n• Kalau Kakak ambil *Fast Track*, otomatis lolos berkas dan lanjut ke tahap kontribusi + Essay & Studi Kasus\n• Pastikan nomor WhatsApp Kakak aktif terus ya biar nggak ketinggalan info penting 🤲🤍",
  },
  {
    keyword: "tka",
    label: "Info Tes TKA",
    category: "Tahapan Seleksi",
    message:
      "Siap Kak, izin jelasin soal *TKA (Tes Kesiapan Awal)* ya 🖥️\n\n• Diikuti peserta yang lolos essay & studi kasus\n• Formatnya *Computer Based Test (CBT) online*, ngukur kesiapan, kemampuan berpikir, dan pemahaman dasar Kakak\n• Aksesnya via website: *https://tka.safariman.id*\n• Soal pilihan ganda dengan batas waktu, hasilnya langsung otomatis tercatat di sistem\n• *10 peserta dengan nilai tertinggi* akan lanjut ke sesi *Interview* 🎤\n\nSiapin diri baik-baik ya Kak, doa terus, semoga dimudahkan 🤲🤍",
  },
  {
    keyword: "interview",
    label: "Info Interview",
    category: "Tahapan Seleksi",
    message:
      "Baik Kak, ini info soal tahap *Interview Online* ya 🎤\n\n• Diikuti *10 peserta dengan nilai TKA tertinggi*\n• Dilakukan online via Zoom / Google Meet bareng tim seleksi Safar Iman\n• Yang kami nilai: motivasi, adab, kesiapan ibadah, rencana kontribusi, dan kesesuaian dengan nilai program\n\nJadwal interview akan kami konfirmasi via WhatsApp & email ke Kakak yang lolos TKA ya 📩 Semangat Kak, tampil santai dan jadi diri sendiri aja 🤍",
  },
  {
    keyword: "partial",
    label: "Info Partial Funded",
    category: "Tahapan Seleksi",
    message:
      "Boleh Kak, izin jelasin soal jalur *Partial Funded* ya 🎗️\n\n• Jalur ini khusus buat Kakak yang sudah daftar *Fully Funded* tapi belum terpilih sebagai penerima pembiayaan penuh\n• Sebanyak *30 orang peserta terbaik berikutnya* akan dapat *subsidi program sebesar Rp2.000.000/orang* 🤍\n\nJadi tetap ada kesempatan berangkat ya Kak, insyaAllah. Info lengkapnya di https://www.safariman.id 🕋",
  },
  {
    keyword: "hasil",
    label: "Cek Hasil Seleksi",
    category: "Tahapan Seleksi",
    message:
      "Siap Kak, untuk cek hasil seleksi bisa langsung buka:\nhttps://www.safariman.id/cek-hasil\n\nMasukin *Kode Pendaftaran (HXP-XXXXXXXX)* Kakak ya. Hasilnya baru tampil setelah pengumuman resmi dari tim Safar Iman, dan pengumuman juga disiarkan di kanal resmi kami. Semoga hasilnya terbaik untuk Kakak ya, aamiin 🤲🤍",
  },

  // ===== KONTRIBUSI =====
  {
    keyword: "kontribusi",
    label: "Info Kontribusi & Apresiasi Peserta",
    category: "Kontribusi",
    message:
      "Baik Kak, izin jelasin soal *Kontribusi Peserta Safar Iman* ya 🤍\n\nHalaman kontribusi: https://www.safariman.id/kontribusi\nNominalnya: *Rp100.000* (tahap essay & studi kasus)\n\nKontribusi Kakak insyaAllah digunakan untuk mendukung *kegiatan Safar Iman, berbagi makanan, dan sedekah Al-Qur'an di Makkah & Madinah* — jadi bareng-bareng kita berkolaborasi dalam kebaikan ya Kak 🕋\n\n✨ *Apresiasi khusus buat Kakak yang berkontribusi (senilai Rp79.000, GRATIS):*\n🎓 Kelas Online — *Sekolah Tamu Allah: Bedah Persiapan Umrohmu, Kembali dengan Mabrur* bareng *Ustadz Ahmad Fauzan, Lc.* (Pembimbing Manasik & Praktisi Umrah)\n📖 Kajian — *Mengenal Sirah Haramain: Bekal Sebelum ke Baitullah* bareng *Ustadz Hilman Al Hazmi, Lc.* (Alumni Syariah Islamiyyah Al Azhar University)\n📜 E-Sertifikat Resmi setelah selesai kelas\n▶️ Akses Rekaman — bisa Kakak tonton ulang kapan aja 🤍",
  },
  {
    keyword: "benefit",
    label: "Benefit & Fasilitas Fully Funded",
    category: "Kontribusi",
    message:
      "Siap Kak, ini benefit & fasilitas lengkap untuk peserta *Fully Funded* ya 🕋 disiapin khusus oleh *Safar Iman × Hasanah × Prestasi Kita*:\n\n🛫 *Start Jakarta — 29 November – 8 Desember 2026*\n\n*Fasilitas yang Kakak dapetin:*\n🏨 Hotel Bintang 4\n✈️ Tiket pesawat PP\n🍱 Makan 3x sehari\n🧑‍🏫 Pembimbing ibadah\n🚌 Bus AC & city tour\n🧳 Perlengkapan umrah\n📘 Visa dan Asuransi\n🪪 ID Siskopatuh\n🕌 Manasik Umrah\n👆 Akses Kelas Tamu Allah\n\n📌 Yang perlu Kakak tahu:\n• Semua peserta melalui tahapan seleksi yang sama ya, adil buat semua 🙏\n• Penetapan penerima manfaat berdasarkan hasil administrasi, essay, wawancara, dan tahapan lanjutan\n• Hasil seleksi diumumkan terbuka lewat kanal resmi Safar Iman\n\nSemoga Kakak jadi salah satu yang berangkat ya, aamiin 🤲🤍\nDetail: https://www.safariman.id",
  },
  {
    keyword: "kegiatan",
    label: "Kegiatan Program Safar Iman",
    category: "Kontribusi",
    message:
      "Boleh Kak, izin share kegiatan detail selama program *Safar Iman* ya 🕋\n\nJadi bukan cuma umrah aja Kak, kami padukan ibadah sesuai sunnah dengan kegiatan berbagi & pembelajaran:\n\n🕋 Ibadah Umrah\n📖 Sedekah Al-Qur'an\n🏛️ City Tour\n🍱 Berbagi Makanan (Makkah & Madinah)\n🤝 Networking Nasional\n🎓 Campus Tour\n\nInsyaAllah bakal jadi pengalaman spiritual yang bermakna dan penuh keberkahan buat Kakak 🤍\n\nInfo lengkap: https://www.safariman.id",
  },

  // ===== LAINNYA =====
  {
    keyword: "faq",
    label: "Arahkan ke FAQ",
    category: "Lainnya",
    message:
      "Boleh Kak, pertanyaan umum sudah kami rangkum di halaman FAQ ya:\nhttps://www.safariman.id/faq\n\nCoba Kakak cek dulu, siapa tahu jawabannya udah ada di sana biar lebih cepat 🙏 Kalau masih ada yang kurang jelas, chat kami lagi aja ya 🤍",
  },
  {
    keyword: "twibbon",
    label: "Twibbon Safar Iman",
    category: "Lainnya",
    message:
      "Siap Kak, ini cara ikut *Twibbon Safar Iman* ya, gampang kok 📸✨\n\n1. Unduh twibbonnya di https://www.safariman.id/twibbon\n2. Upload di feed Instagram Kakak dengan caption yang sudah kami sediakan\n3. Tag *5 teman* Kakak di caption\n4. Bagikan twibbonnya ke *5 grup WhatsApp*\n5. Jangan lupa tag @safariman.id ya Kak ✨\n\nTwibbon & caption resmi tersedia di https://www.safariman.id — semoga makin banyak yang tau ya 🤍",
  },
  {
    keyword: "channel",
    label: "WhatsApp Channel",
    category: "Lainnya",
    message:
      "Yuk Kak, gabung *WhatsApp Channel Safar Iman* biar Kakak nggak ketinggalan update info program, tips seleksi, & motivasi harian 🤍\n\nLink channelnya bisa Kakak cek di https://www.safariman.id ya 🕋",
  },
  {
    keyword: "kontak",
    label: "Kontak Admin",
    category: "Lainnya",
    message:
      "Baik Kak, Kakak bisa menghubungi admin Safar Iman lewat WhatsApp ini ya, jam operasional kami *09.00–17.00 WIB, Senin–Jumat* 🙏\n\nDi luar jam itu, pesan Kakak tetap kami baca kok, dan akan kami balas secepatnya begitu admin online ya 🤍 Terima kasih sudah bersabar ✨",
  },
  {
    keyword: "terima",
    label: "Penutup",
    category: "Umum",
    message:
      "Sama-sama Kak, dengan senang hati 🤍\nSemoga Allah mudahkan setiap langkah Kakak menuju *Safar Iman*, dan diberi keistiqamahan sampai berangkat ke Baitullah ya, aamiin 🤲🕋\n\nJangan sungkan chat kami lagi kalau ada yang perlu ditanyakan 😊\nWassalamu'alaikum warahmatullahi wabarakatuh.",
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
