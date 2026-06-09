
-- Public lookup for hasil seleksi (returns minimal info)
CREATE OR REPLACE FUNCTION public.lookup_hasil_seleksi_by_code(p_code text)
RETURNS TABLE(found boolean, full_name text, result text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    true AS found,
    p.full_name,
    CASE
      WHEN p.status IN ('interview','accepted') THEN 'lolos'
      WHEN p.status = 'rejected' THEN 'tidak_lolos'
      ELSE 'pending'
    END AS result
  FROM public.participants p
  WHERE upper(p.registration_code) = upper(p_code)
    AND p.essay_worthy IS NOT NULL
    AND p.essay_dream IS NOT NULL
    AND p.essay_contribution IS NOT NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_hasil_seleksi_by_code(text) TO anon, authenticated;

-- Seed default settings for Cek Hasil Seleksi page
INSERT INTO public.app_settings (key, value) VALUES
  ('hasil_seleksi_enabled', 'false'),
  ('hasil_page_title', 'Cek Hasil Seleksi Essay'),
  ('hasil_page_subtitle', 'Masukkan kode pendaftaran kamu untuk melihat hasil seleksi essay menuju tahap TPA / LDS.'),
  ('hasil_text_lolos', E'🎉 Selamat! Kamu *LOLOS* ke tahap selanjutnya: TPA / LDS.\n\nInformasi jadwal dan link CBT akan dikirimkan via WhatsApp & email. Mohon pantau terus pesan dari panitia Safar Iman.'),
  ('hasil_text_tidak_lolos', E'Mohon maaf, kamu belum lolos ke tahap TPA / LDS pada gelombang ini.\n\nTerima kasih atas semangat dan partisipasimu. Tetap istiqomah — pintu Allah selalu terbuka lewat jalan yang lain.'),
  ('hasil_text_pending', 'Hasil seleksi kamu sedang diproses oleh tim penilai. Silakan cek kembali nanti.'),
  ('hasil_text_disabled', 'Halaman pengumuman hasil seleksi belum dibuka. Mohon tunggu informasi resmi dari panitia.')
ON CONFLICT (key) DO NOTHING;
