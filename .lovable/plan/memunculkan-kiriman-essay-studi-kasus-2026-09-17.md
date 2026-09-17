# Memunculkan Kiriman Essay & Studi Kasus

## Tujuan
Memastikan peserta yang telah mengirim Essay dan Studi Kasus tampil di Dashboard Staff dan halaman Koreksi Private.

## Perubahan
- Ubah pengambilan data Dashboard Staff agar penyaringan dilakukan langsung di database, bukan setelah memuat seluruh peserta.
- Gunakan kriteria kiriman yang kompatibel dengan formulir lama dan baru: tiga Essay serta dua Studi Kasus utama wajib terisi; Studi Kasus tambahan tetap ditampilkan bila tersedia.
- Pindahkan pemeriksaan token halaman private sepenuhnya ke fungsi akses private agar token valid tidak ditolak oleh aturan privasi database.
- Samakan sumber daftar peserta untuk Dashboard Staff dan Koreksi Private, termasuk nama serta waktu pengoreksi.
- Pertahankan keputusan koreksi sebagai data internal; hak publikasi tetap hanya untuk admin.
- AI berbayar tetap nonaktif dan tidak digunakan.

## Verifikasi
- Bandingkan jumlah kiriman yang memenuhi syarat di database dengan jumlah yang dikembalikan kedua fungsi.
- Uji halaman private memakai token aktif.
- Uji Dashboard Staff memakai akun staff aktif.
- Pastikan peserta lama dengan dua Studi Kasus dan peserta baru dengan tujuh Studi Kasus sama-sama muncul.
