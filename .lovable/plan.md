# Penilaian Manual Essay dan Alur TKA

## Hasil yang akan dibuat
- Peserta yang diputuskan **lolos** dari koreksi Essay & Studi Kasus—baik oleh admin, staff, maupun akses private—langsung berstatus lolos Essay dan muncul pada **Admin > Tahapan Seleksi > TKA**.
- Setiap 3 jawaban Essay dan 7 Studi Kasus memiliki kolom nilai **0–10**.
- Nilai dijumlahkan otomatis menjadi total **0–100** dan tersimpan bersama nama pengoreksi serta waktu koreksi.
- Panitia tetap menentukan keputusan akhir **Lolos / Tidak Lolos / Belum Diputuskan** secara manual; nilai tidak memutuskan kelulusan otomatis.
- Penilaian tersedia pada koreksi admin, Dashboard Staff, dan Koreksi Private agar hasil konsisten di semua jalur.
- Login admin dan staff menggunakan sesi browser terpisah. Login atau logout salah satunya tidak mengeluarkan sesi yang lain.

## Perubahan tampilan
- Di setiap blok jawaban ditambahkan input poin yang ringkas dengan batas 0–10.
- Panel keputusan menampilkan total nilai secara langsung dan tombol simpan keputusan.
- Daftar peserta menampilkan total nilai dan pengoreksi setelah koreksi disimpan.
- Dashboard TKA tetap hanya menampilkan peserta yang sudah diputuskan lolos Essay.

## Perubahan teknis
- Tambahkan penyimpanan nilai per soal dan total nilai pada catatan koreksi staff/private, serta penyimpanan koreksi admin.
- Validasi nilai dilakukan di backend: tepat 10 nilai bilangan bulat, masing-masing 0–10; total dihitung ulang di backend.
- Saat keputusan lolos disimpan, backend juga menetapkan `essay_status = passed`; keputusan tidak lolos menjadi `failed`; reset menjadi `pending`.
- Buat klien autentikasi khusus staff dengan kunci penyimpanan berbeda, tanpa mengubah berkas klien autentikasi otomatis.
- Pertahankan hak publikasi hanya untuk admin dan jangan mengaktifkan fitur AI.

## Verifikasi
- Uji simpan 10 nilai, total otomatis, keputusan lolos/tidak lolos/reset pada jalur staff dan private.
- Pastikan peserta lolos muncul di Tahapan TKA dan peserta tidak lolos tidak muncul.
- Uji admin dan staff login bersamaan, termasuk logout salah satu sesi tanpa memutus sesi lainnya.
