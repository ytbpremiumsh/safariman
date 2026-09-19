# Rekomendasi Koreksi Otomatis melalui OpenRouter

## Hasil yang akan dibuat
- Pada detail koreksi `/staff`, tambahkan tombol **Analisis dengan AI** yang dijalankan hanya saat staf menekannya.
- OpenRouter membaca 10 jawaban peserta dan menilai setiap kriteria yang sudah tersedia pada checkbox.
- Hasil AI berupa rekomendasi checkbox, nilai awal per soal, total nilai, tingkat keyakinan, dan kutipan singkat dari jawaban sebagai bukti.
- AI tidak menetapkan **Lolos / Tidak Lolos**, tidak menyimpan nilai secara otomatis, dan tidak memindahkan peserta ke TKA.
- Staf dapat menerima atau mengubah rekomendasi sebelum menyimpan keputusan seperti biasa.

## Aturan agar penilaian adil
- Penilaian berdasarkan makna, konteks, sinonim, dan tindakan yang dijelaskan—bukan sekadar kemunculan kata.
- Setiap kriteria hanya direkomendasikan bila ada bukti yang dapat dikutip dari jawaban peserta.
- Penyebutan kata tanpa pemahaman, jawaban yang bertentangan, atau bukti yang tidak jelas tidak mendapat rekomendasi poin.
- Kriteria berkeyakinan tinggi dapat dicentang sebagai rekomendasi; hasil meragukan ditandai untuk pemeriksaan staf.
- Rubrik dan bobot tetap persis seperti checkbox saat ini, maksimal 10 per soal dan 100 keseluruhan.

## Penggunaan OpenRouter
- Gunakan OpenRouter saja untuk fitur ini, sehingga tidak memakai kredit Lovable.
- Biaya tetap mengikuti saldo dan tarif model OpenRouter; model gratis hanya digunakan bila model yang dipilih memang berlabel gratis dan tersedia.
- API key disimpan sebagai rahasia server, tidak di halaman, browser, atau tabel yang dapat dibaca pengguna.
- Model OpenRouter dapat diatur admin tanpa memperlihatkan kembali API key.
- Fitur AI lain, termasuk koreksi lama dan balasan WhatsApp otomatis, tetap terkunci nonaktif.

## Tampilan dan alur
1. Staf membuka detail peserta lalu menekan **Analisis dengan AI**.
2. Selama proses, tampilkan status analisis dan cegah klik berulang.
3. Setelah selesai, checkbox rekomendasi terisi dan tiap centang menampilkan kutipan bukti serta tingkat keyakinan.
4. Staf meninjau, mengubah centang bila perlu, lalu memilih **Lolos**, **Tidak Lolos**, atau **Belum Diputuskan**.
5. Hanya tindakan simpan oleh staf yang mencatat nilai dan keputusan.

## Perubahan teknis
- Tambahkan tindakan analisis pada fungsi koreksi staf dengan pemeriksaan sesi dan status akun staf aktif.
- Kirim hanya jawaban peserta dan rubrik tetap dari server ke OpenRouter; jangan menerima rubrik atau instruksi AI dari browser.
- Wajibkan keluaran terstruktur per soal dan per kriteria: terpilih/tidak, kutipan bukti, serta keyakinan; validasi dan hitung ulang seluruh nilai di server.
- Batasi satu peserta per permintaan, cegah permintaan ganda saat masih berjalan, dan tampilkan pesan asli yang aman bila OpenRouter gagal atau saldo habis.
- Jangan simpan hasil rekomendasi mentah sebelum staf menekan tombol simpan.

## Verifikasi
- Uji jawaban dengan kata persis, sinonim, makna implisit, penyebutan tanpa konteks, dan jawaban yang bertentangan.
- Pastikan total rekomendasi sesuai bobot checkbox dan tidak pernah melebihi 10 per soal atau 100 keseluruhan.
- Pastikan analisis tidak mengubah status, nilai tersimpan, atau Tahapan TKA sebelum staf menyimpan.
- Uji akun staf aktif, akun nonaktif, respons OpenRouter gagal, rate limit, dan saldo OpenRouter habis.
- Pastikan tidak ada penggunaan kredit Lovable dan fitur AI lain tetap nonaktif.
