## Tujuan
Mengubah bagian **"Bonus Eksklusif — Sudah Termasuk"** menjadi **"Apresiasi Peserta"** dengan desain visual baru yang menyertakan gambar, diterapkan di dua tempat agar konsisten.

## Perubahan Konten

**Badge (atas):** `APRESIASI PESERTA — SUDAH TERMASUK`

**Heading:**
> Sebagai bentuk apresiasi, peserta akan mendapatkan kesempatan mengikuti **Kelas Online** & **Kajian Sirah**

**Subheading:** Seluruh peserta yang berkontribusi mendapatkan akses Eksklusif ke pembelajaran berkualitas.

**Isi (tetap, 4 poin):**
1. Kelas Online — *Fiqh Umrah Praktis: Dari Niat hingga Tahallul*
2. Kajian Sirah — *Jejak Cahaya: Makkah dan Madinah*
3. E-Sertifikat Resmi setelah menyelesaikan kelas
4. Akses Rekaman selamanya untuk ditonton ulang

## Desain Baru (dengan Gambar)

Layout 2 kolom (responsive: stack di mobile):

```
┌─────────────────────────────────────────────────┐
│   [badge hijau: APRESIASI PESERTA]              │
│   Heading besar 2 baris (serif + accent color)  │
├──────────────────────┬──────────────────────────┤
│  Card "Kelas Online" │  Card "Kajian Sirah"     │
│  ┌────────────────┐  │  ┌────────────────┐      │
│  │  [GAMBAR 1]    │  │  │  [GAMBAR 2]    │      │
│  └────────────────┘  │  └────────────────┘      │
│  Fiqh Umrah Praktis  │  Jejak Cahaya            │
│  Deskripsi singkat   │  Deskripsi singkat       │
│  ✓ E-Sertifikat      │  ✓ Akses rekaman         │
└──────────────────────┴──────────────────────────┘
```

**Dua gambar baru (di-generate via imagegen, disimpan sebagai Lovable Assets):**
- `kelas-online-fiqh.jpg` — ilustrasi muslim belajar online tentang manasik umrah, gaya modern islami warm tone (emerald + gold)
- `kajian-sirah-makkah.jpg` — ilustrasi Masjidil Haram/Madinah dengan nuansa sirah Nabi, gaya artistik warm tone

Gaya kartu: `rounded-2xl` overflow-hidden, bayangan halus, border `accent/20`, badge kategori di pojok gambar, palet selaras dengan halaman (emerald, gold/accent, cream).

## File yang Diubah
1. **`src/routes/donasi.tsx`** — ganti section "Bonus Eksklusif" jadi "Apresiasi Peserta" dengan layout 2-kartu + gambar.
2. **`src/routes/admin.alur.tahapan-seleksi.tsx`** — pada Section "2. Tahapan Kontribusi / Donasi", ganti label & teks "bonus eksklusif" → "apresiasi peserta" (teks saja, tidak perlu gambar karena halaman ini adalah dokumen referensi untuk di-copy).

## Aset Baru
- `src/assets/apresiasi-kelas-online.jpg.asset.json` (via `imagegen` + `lovable-assets`)
- `src/assets/apresiasi-kajian-sirah.jpg.asset.json`

## Catatan
- Tidak mengubah logika pembayaran, edge function, atau data backend.
- Hanya perubahan UI/teks; tetap memakai design token (`accent`, `emerald`, `emerald-deep`) — tidak ada warna hardcoded.
- Responsif: 1 kolom di mobile, 2 kolom mulai `md:`.
