## Diagnosa

Error **"new row violates row-level security policy"** muncul saat admin upload frame twibbon baru. Penyebabnya:

- Policy `Admins can update twibbon assets` di `storage.objects` punya klausa `USING` admin, **tapi `WITH CHECK`-nya kosong**.
- Kode di `src/routes/admin.pengaturan.twibbon.tsx` upload dengan `upsert: true`. Saat Supabase Storage menjalankan jalur UPDATE (atau saat metadata baris di-update setelah insert), RLS butuh `WITH CHECK` lolos — karena kosong, baris baru dianggap melanggar policy.
- User yang sedang login sudah benar admin (`user_roles` berisi 1 baris admin), jadi root cause murni di policy storage.

## Perubahan

### 1. Migration: tambah `WITH CHECK` pada UPDATE policy storage twibbon-assets
Drop policy lama dan buat ulang dengan dua klausa:

```sql
DROP POLICY IF EXISTS "Admins can update twibbon assets" ON storage.objects;

CREATE POLICY "Admins can update twibbon assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'twibbon-assets' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'twibbon-assets' AND public.has_role(auth.uid(), 'admin'));
```

INSERT, SELECT (lewat bucket public), DELETE policy sudah benar — tidak diubah.

### 2. Tidak ada perubahan kode frontend
Logika upload di `admin.pengaturan.twibbon.tsx` sudah benar (path `frame-{timestamp}.{ext}` + upsert + simpan URL ke `app_settings`). Setelah policy diperbaiki, klik **Upload Frame Baru** akan langsung sukses.

## Tidak diubah
- Bucket `twibbon-assets` (tetap public).
- Tabel `app_settings` dan policy-nya.
- Halaman/komponen lain.
