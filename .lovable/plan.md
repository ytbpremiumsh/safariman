## Tanggal dan Kontrol Pendaftaran

### Perubahan
- Ubah tanggal selesai Gelombang 2 menjadi **17 September 2026** pada konfigurasi bawaan dan data aktif.
- Tambahkan satu toggle utama **Buka/Tutup Pendaftaran** pada halaman Pengaturan Gelombang.
- Saat ditutup, halaman `/pendaftaran` menampilkan pemberitahuan pendaftaran ditutup dan menyembunyikan pilihan jalur.
- Lindungi formulir serta proses penyimpanan pendaftaran agar tautan langsung tidak dapat dipakai ketika pendaftaran ditutup.
- Saat dibuka kembali, seluruh jalur kembali mengikuti toggle dan rentang tanggal masing-masing.

### Teknis
- Simpan status utama pada pengaturan `pendaftaran_enabled`.
- Sediakan pembacaan publik yang hanya mengembalikan status buka/tutup.
- Terapkan pemeriksaan pada fungsi pendaftaran di database sebagai pengaman utama.
- Perbarui halaman admin dan halaman publik tanpa mengubah data peserta yang sudah ada.

### Verifikasi
- Pastikan tanggal Gelombang 2 tampil berakhir pada 17 September 2026.
- Uji status buka dan tutup pada tampilan publik serta akses formulir langsung.
- Pastikan admin tetap dapat mengubah dan menyimpan status pendaftaran.
