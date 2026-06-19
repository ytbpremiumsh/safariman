Rencana perbaikan:

1. **Bersihkan konflik route admin peserta**
   - Pastikan route parent `/admin/peserta/reguler` dan `/admin/peserta/self-funded` hanya menjadi layout `<Outlet />`.
   - Pastikan route index parent hanya redirect ke halaman pendaftaran masing-masing.
   - Rapikan link admin yang masih mengarah ke parent supaya langsung ke child yang benar: `/pendaftaran` atau `/berkas`.
   - Regenerasi/rapikan `routeTree` agar tidak ada mapping dobel yang menimpa child route.

2. **Perbaiki halaman Berkas Reguler untuk Fast Track**
   - Ubah filter “Berkas Reguler” agar peserta Gelombang 1/2 yang `payment_status = paid` tetap tampil meskipun tidak punya `cv_url/photo_url`.
   - Tampilkan mereka sebagai **Berkas: Auto Lolos Fast Track** dan **Pembayaran: Valid**.
   - Pastikan peserta Gelombang 1/2 yang belum bayar tetap tidak masuk ke Berkas Reguler.

3. **Perbaiki alur backend Fast Track**
   - Update fungsi pengecekan peserta supaya Gelombang 1/2 yang sudah bayar dianggap `has_berkas = true` secara otomatis.
   - Update fungsi daftar essay lengkap agar Gelombang 1/2 juga muncul di menu Berkas & Essay setelah essay dikirim.
   - Backfill data lama: semua Gelombang 1/2 yang sudah bayar dibuat konsisten sebagai `accepted`.

4. **Cek hasil akhir**
   - Cek semua route admin peserta: Pendaftaran Reguler, Berkas Reguler, Pendaftaran Self Funded, Berkas & Essay.
   - Cek data Gelombang 1/2 paid muncul di Berkas Reguler.
   - Cek tidak ada error route/runtime di preview.