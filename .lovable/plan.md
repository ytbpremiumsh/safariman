## Analisa

Path picker di preview Lovable (dropdown "Find page or enter path") mengisi daftar rute dengan membaca file `public/sitemap.xml` dari project. Di project lain yang menampilkan `/activity`, `/app`, `/auth`, dst., file sitemap tersebut tersedia.

Pada project Safar Iman:
- Folder `public/` tidak ada sama sekali → tidak ada `sitemap.xml`, `robots.txt`, dll.
- Karena tidak ada sitemap, picker hanya bisa menebak rute root `/` (atau apa pun yang sedang di-render), sehingga di gambar pertama Anda hanya muncul `/` dan di gambar kedua (saat sedang di `/admin`) hanya muncul `/`.
- Rute aplikasi memang banyak (TanStack file routes di `src/routes/*` — landing, daftar, donasi, twibbon, essay, cek-hasil, admin/*, dll.), tapi picker tidak punya cara membacanya tanpa sitemap.

Jadi ini bukan bug TanStack Router maupun preview — cukup tambahkan sitemap.

## Yang akan dikerjakan

1. Buat folder `public/` dan tambahkan `public/sitemap.xml` berisi seluruh rute publik & admin yang ada di `src/routes/`:
   - Publik: `/`, `/tentang`, `/daftar`, `/daftar-gelombang-1`, `/daftar-gelombang-2`, `/daftar-mandiri`, `/pendaftaran`, `/pendaftaran-sukses`, `/sukses`, `/berkas`, `/essay`, `/donasi`, `/twibbon`, `/cek-hasil`
   - Admin: `/admin`, `/admin/login`, `/admin/alur/fully-funded`, `/admin/alur/tahapan-seleksi`, `/admin/peserta/reguler/pendaftaran`, `/admin/peserta/reguler/berkas`, `/admin/peserta/self-funded/pendaftaran`, `/admin/peserta/essay`, `/admin/pengaturan` + semua sub-pengaturan (gelombang, twibbon, countdown, panduan, donasi, hasil-seleksi, dokumen-self-funded), `/admin/wa-setup`
2. Tambahkan juga `public/robots.txt` minimal (allow root, reference sitemap) supaya crawler & tools lain konsisten.
3. Gunakan `https://safariman.lovable.app` sebagai base URL di entry sitemap (sesuai published URL).

## Detail teknis

- Format `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` standar.
- Tidak perlu mengubah konfigurasi Vite — file di `public/` otomatis disajikan di root oleh dev server & build.
- Tidak perlu mengubah `routeTree.gen.ts` atau kode route apa pun.
- Setelah file dibuat, refresh preview lalu buka dropdown path picker — daftar lengkap akan muncul.

Tidak ada perubahan logika aplikasi, hanya menambah 2 file statis.