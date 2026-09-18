# Tombol Tutup Semua Tahap Administrasi

## Tujuan
Admin dapat membuka atau menutup seluruh rangkaian administrasi dari satu tombol. Saat ditutup, peserta melihat pemberitahuan yang jelas dan tidak dapat mengirim data baru.

## Perubahan
- Tambahkan pengaturan global `registration_open` dengan kondisi awal tetap terbuka agar alur yang sekarang tidak berubah.
- Tambahkan tombol buka/tutup di **Admin > Pengaturan > Gelombang Pendaftaran**, lengkap dengan status aktif dan konfirmasi hasil penyimpanan.
- Terapkan status tutup pada halaman:
  - pilihan jalur dan semua formulir pendaftaran;
  - pengiriman berkas;
  - kontribusi/pembayaran administrasi;
  - Essay & Studi Kasus.
- Saat ditutup, ganti formulir atau aksi kirim dengan pemberitahuan “Pendaftaran dan pengiriman administrasi telah ditutup” serta tombol kembali ke beranda.
- Tambahkan pemeriksaan di database pada fungsi pendaftaran, kirim berkas, dan kirim Essay agar permintaan langsung tidak dapat melewati penutupan. Jalur pembuatan kontribusi juga diperiksa sebelum invoice baru dibuat.
- Perbaiki penulisan hook layar mobile dengan impor hook React langsung agar laporan TypeScript pada `use-mobile.tsx` tidak muncul lagi.

## Detail Teknis
- Pengaturan dibaca publik melalui fungsi khusus agar halaman peserta memperoleh status terbaru tanpa bergantung pada cache lama.
- Penutupan tidak menghapus atau mengubah data peserta yang sudah tersimpan.
- Admin tetap dapat membuka kembali semua tahap kapan saja melalui tombol yang sama.
- Fitur AI tetap nonaktif dan tidak disentuh.

## Verifikasi
- Pastikan saat terbuka seluruh alur tetap dapat diakses.
- Tutup lewat halaman admin, lalu pastikan empat halaman peserta menampilkan pemberitahuan dan tombol kirim tidak tersedia.
- Pastikan pemanggilan langsung ke fungsi penyimpanan juga ditolak saat tutup.
- Buka kembali dan pastikan alur kembali tersedia.
