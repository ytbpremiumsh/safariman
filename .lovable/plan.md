## Sistem Affiliate Button

Fitur: Tombol tertentu (didaftarkan admin) akan membuka link affiliate Shopee di tab baru pada klik ke-N (rasio global), setelah itu klik berikutnya lanjut ke tujuan asli. Admin bisa toggle, atur URL, atur rasio, dan lihat statistik.

### Perilaku User
1. User klik tombol yang terdaftar (misalnya "Daftar Sekarang").
2. Sistem cek: apakah klik ini kelipatan N (mis. setiap klik ke-3)?
   - **Ya** → `window.open(affiliateUrl, "_blank")`, halaman asli tidak berpindah, tombol berubah teks singkat ("Klik lagi untuk lanjut") selama ~2 detik.
   - **Tidak** → langsung navigasi ke tujuan asli (`/pendaftaran` dll).
3. Counter klik global bertambah setiap klik (disimpan di database) untuk konsistensi lintas user & statistik.

### Admin Dashboard — Menu Baru "Affiliate"
Path: `/admin/pengaturan/affiliate`

Field pengaturan (disimpan sebagai satu JSON di `app_settings.affiliate_config`):
- **Aktif / Nonaktif** (toggle master)
- **URL Affiliate** (mis. Shopee)
- **Rasio N** (angka; setiap klik ke-N buka affiliate; default 3)
- **Daftar Target Tombol** (list dinamis, bisa tambah/hapus):
  - `label` — nama untuk referensi admin (mis. "Hero Daftar Sekarang")
  - `selector_id` — ID unik yang dipakai komponen tombol (mis. `hero_daftar`, `nav_daftar`, `cta_daftar`)
  - `enabled` — toggle per-tombol

Statistik ditampilkan:
- Total klik tombol terdaftar
- Total kali affiliate terpicu
- Klik per `selector_id` (tabel ringkas)
- Klik 7 hari terakhir

### Teknis

**Database**
- Tambah baris di `app_settings`: key `affiliate_config` (JSON string).
- Tabel baru `affiliate_clicks(id, selector_id, triggered_affiliate boolean, created_at)` untuk statistik + counter global.
- RPC:
  - `get_affiliate_config()` — public, return JSON config (tanpa data sensitif).
  - `log_affiliate_click(p_selector_id text)` — public, insert row, hitung total klik global, return `{ trigger_affiliate: boolean, affiliate_url: text }`. Logika modulo N dilakukan server-side agar konsisten & tidak bisa dibypass client.
  - `admin_set_affiliate_config(p_json text)` — admin-only.
  - `get_affiliate_stats(p_days int)` — admin-only, agregat statistik.
- GRANT + RLS sesuai standar (public select untuk config, insert lewat RPC saja).

**Frontend**
- Komponen baru `<AffiliateLink selectorId="hero_daftar" to="/pendaftaran">Daftar Sekarang</AffiliateLink>` menggantikan `Link` pada tombol-tombol CTA utama (Hero, Nav, CTA bawah landing).
- Saat klik: panggil `log_affiliate_click`. Jika `trigger_affiliate=true` → `window.open` affiliate, tampilkan toast/label "Klik sekali lagi untuk lanjut daftar". Jika `false` → navigate ke `to`.
- Fetch config sekali saat mount (cached di React state). Jika `enabled=false` atau `selector_id` tidak terdaftar/nonaktif → langsung navigate normal, tanpa memanggil RPC.

**File yang dibuat/diubah**
- Migration: tabel `affiliate_clicks`, RPC di atas, seed default config.
- Baru: `src/components/AffiliateLink.tsx`
- Baru: `src/routes/admin.pengaturan.affiliate.tsx` (form + statistik)
- Ubah: `src/routes/index.tsx` (ganti tombol "Daftar Sekarang" di Nav, Hero, CTA jadi `<AffiliateLink>` dengan `selectorId` masing-masing)
- Ubah: `src/components/AdminShell.tsx` (tambah menu "Affiliate" di grup Pengaturan)

### Catatan
- Karena rasio bersifat **global** (bukan per-user), user berbeda bisa mendapat klik ke-N. Ini sesuai permintaan "kelipatan N klik".
- Klik pertama user tetap bisa langsung ke daftar bila counter global belum kelipatan N — trade-off dari mode global. Kalau nanti mau per-user (localStorage), tinggal ditambahkan mode di admin.
