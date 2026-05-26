## Perubahan

### 1. `src/components/AdminShell.tsx` — Logo & label
- Ubah header sidebar jadi layout **vertikal (stacked)**: logo di atas, tulisan **"ADMIN PANEL"** (uppercase, tracking lebar, ukuran kecil, warna `text-muted-foreground`) tepat di bawah logo — mirip gaya pada lampiran.
- Saat sidebar collapsed (`group-data-[collapsible=icon]`), label "ADMIN PANEL" disembunyikan, hanya logo (ukuran lebih kecil) yang tampil.
- Tidak ada perubahan navigasi / route lain.

### 2. `src/routes/admin.index.tsx` — Aktivitas Harian Realtime
- Tambah **section baru "Aktivitas Hari Ini (Realtime)"** di atas chart aktivitas harian, berisi 3 kartu kecil:
  - Pendaftaran hari ini
  - Kirim berkas hari ini
  - Donasi valid hari ini
- Angka dihitung dari `rows` yang sudah ada (filter `created_at` / `updated_at` / `paid_at` = hari ini, timezone lokal).
- Tambah **realtime subscription** ke tabel `participants` via `supabase.channel(...).on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, ...)`:
  - Saat ada INSERT → tambahkan row baru ke state.
  - Saat ada UPDATE → replace row di state berdasarkan `id` (butuh ambil kolom `id` juga di select awal).
  - Saat ada DELETE → hapus dari state.
  - Cleanup channel di unmount.
- Indikator kecil titik hijau berdenyut + label "Live" di header section supaya jelas realtime.
- Chart "Aktivitas Harian" yang lama tetap, otomatis ikut update karena pakai state yang sama.

### 3. Database
- Pastikan tabel `participants` masuk publication realtime. Tambah migration:
  ```sql
  ALTER TABLE public.participants REPLICA IDENTITY FULL;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
  ```
  (idempotent guard dengan `DO $$ ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;`)

## Tidak diubah
- RLS, server functions, route lain, styling halaman selain admin overview & sidebar header.
