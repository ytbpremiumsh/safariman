### Tujuan
Merapikan tampilan submenu **Pengaturan** di sidebar admin agar lebih ringkas, proporsional, dan tidak membingungkan.

### Masalah yang Diamati
- Teks submenu terlalu panjang: "Gelombang Pendaftaran", "Donasi & Pembayaran", "Pengumuman Hasil", dsb.
- Padding/margin submenu tidak proporsional, membuat sub-item terlihat menjorok dan tidak sejajar.
- Tombol induk (Pengaturan) memiliki lebar penuh dengan border/gradient yang membutuhkan penyesuaian spacing agar seimbang dengan item lain.

### Perubahan yang Akan Dilakukan

#### 1. Memperpendek Label Submenu
Mengubah label di `NAV_GROUPS` (bagian `children` Pengaturan) menjadi lebih singkat namun tetap jelas:

```text
Gelombang Pendaftaran   → Gelombang
Frame Twibbon           → Twibbon
Countdown Landing       → Countdown
Link Panduan            → Panduan
Donasi & Pembayaran     → Donasi
Pengumuman Hasil        → Hasil Seleksi
Dokumen Self Funded     → Dokumen Self Funded (tetap, karena sudah jelas)
```

#### 2. Merapikan Layout Submenu
- Mengurangi padding kiri sub-item agar tidak terlalu menjorok.
- Memberi `gap`/`margin` proporsional antara tombol induk dan daftar sub-item.
- Menjaga agar sub-item tetap sejajar dengan ikon/teks induk.
- Memastikan active state sub-item menggunakan token tema (bukan warna hardcoded).

#### 3. Menyesuaikan Tombol Induk
- Memberi `mb-1` atau spacing serupa di bawah tombol induk agar ada jarak terukur sebelum submenu terbuka.
- Memastikan border-radius, tinggi, dan padding tombol induk konsisten dengan item sidebar lainnya.

### File yang Diubah
- `src/components/AdminShell.tsx`

### Verifikasi
- Screenshot preview sidebar admin untuk memastikan submenu terlihat rapi dan teks tidak kepanjangan.