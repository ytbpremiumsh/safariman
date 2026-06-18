## Tujuan

Buat halaman admin baru bergaya dokumen pengumuman (referensi: poster "Tahapan Seleksi Sapa Madinah") khusus untuk **Safar Iman jalur Fully Funded**, dengan isi mengikuti tahapan yang sudah ada di sistem.

## Halaman Baru

**Route**: `/admin/alur/tahapan-seleksi` — `src/routes/admin.alur.tahapan-seleksi.tsx`

Tampilan: kartu dokumen besar (rounded, border emas, latar gradient amber→emerald halus, pattern radial samar) — meniru kesan poster referensi, tapi memakai identitas visual Safar Iman (emerald + gold, bukan coklat-kertas).

**Header dokumen:**
- Kicker kecil uppercase: `TAHAPAN SELEKSI FULLY FUNDED`
- Judul besar gradient gold→emerald: **Safar Iman**

**Isi naratif (4 tahap seleksi):**

> Proses pendaftaran Safar Iman jalur Fully Funded (Gratis) peserta akan melewati 4 tahap seleksi berikut:

**1. Seleksi Tahap 1 (Berkas & Administrasi)**
- a. Pendaftaran online via formulir resmi → link `safariman.id/daftar` (dengan pill kuning "Klik di Link").
- b. Sistem menerbitkan Kode Pendaftaran unik `HXP-XXXXXXXX`.
- c. Wajib membagikan Twibbon resmi → link `safariman.id/twibbon`.
- d. Upload CV (PDF ≤2MB) & pas foto formal → link `safariman.id/berkas`.

**2. Seleksi Tahap 2 (Essay)**
- a. Peserta lolos administrasi lanjut pengerjaan essay.
- b. 3 pertanyaan wajib: alasan layak terpilih, mimpi/target setelah umrah, kontribusi setelah pulang.
- c. Dikerjakan via `safariman.id/essay`.
- d. Verifikasi 1–3 hari kerja. Hasil cek di `safariman.id/cek-hasil`. Notifikasi WhatsApp otomatis.

**3. Seleksi Tahap 3 (TKA — Tes Kesiapan Awal)**
- a. CBT online, link & token dikirim via WhatsApp.
- b. Materi: keislaman dasar, motivasi, wawasan umrah.
- c. Durasi ± 60–90 menit, hasil otomatis tercatat.

**4. Seleksi Tahap 4 (Wawancara Final)**
- Wawancara online via panggilan WhatsApp/telepon bersama tim seleksi.
- Penilaian: motivasi, komitmen, kesiapan mental & pendukung, niat ibadah.

**Penutup — Pengumuman Final & Penerimaan**
- a. Pengumuman resmi via WhatsApp/email + cek mandiri di `safariman.id/cek-hasil`.
- b. Diterima → Letter of Acceptance (LOA) + jadwal manasik & briefing.
- c. Penegasan: **100% GRATIS** — tidak ada biaya/donasi wajib pada tahap manapun.

**Fitur tambahan halaman:**
- Tombol **"Salin Teks"** di header (copy isi dokumen ke clipboard untuk dipakai admin di caption IG/WA broadcast).
- Setiap URL ditampilkan dengan komponen `FormLink` (label biru-emerald + pill gold kecil "Klik di Link" + ikon `MousePointerClick`).

## Sidebar Admin

Edit `src/components/AdminShell.tsx` — di grup **"Alur Program"** tambahkan item baru di bawah "Alur Fully Funded":

```
{ to: "/admin/alur/tahapan-seleksi", label: "Tahapan Seleksi (Poster)", icon: <ikon FileText / Megaphone> }
```

(Pakai ikon `FileText` yang sudah di-import, atau tambah `Megaphone`.)

## Yang Tidak Diubah

- Halaman publik & alur sistem tidak diubah.
- Tabel database, edge function, dan halaman admin lain tetap.
- `src/routeTree.gen.ts` akan ter-regenerate otomatis.

## File yang berubah

- **Baru**: `src/routes/admin.alur.tahapan-seleksi.tsx`
- **Edit**: `src/components/AdminShell.tsx` (1 entry navigasi)
