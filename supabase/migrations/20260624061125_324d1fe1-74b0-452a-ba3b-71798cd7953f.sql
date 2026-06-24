INSERT INTO public.app_settings (key, value)
VALUES ('timeline_config', '[
  {"icon":"ClipboardList","title":"Pendaftaran Dibuka","desc":"Lengkapi formulir & dapatkan Kode Pendaftaran","date":"25 Juni – 31 Agustus 2026","ctaLabel":"Daftar Sekarang","ctaTo":"/pendaftaran"},
  {"icon":"Megaphone","title":"Bagikan Twibbon & Poster","desc":"Download frame & share di sosial media","date":"25 Juni – 31 Agustus 2026","ctaLabel":"Buat Twibbon & Poster","ctaTo":"/twibbon"},
  {"icon":"ClipboardList","title":"Pengiriman Berkas","desc":"Masukkan Kode Pendaftaran & kirim data berkas pendukung","date":"25 Juni – 31 Agustus 2026","ctaLabel":"Kirim Berkas","ctaTo":"/berkas"},
  {"icon":"CheckCircle2","title":"Seleksi Administrasi","desc":"Verifikasi berkas oleh tim kami","date":"25 Juni – 31 Agustus 2026"},
  {"icon":"ClipboardList","title":"Pengisian Essay & Studi Kasus","desc":"Tahapan Seleksi Essay dan Studi Kasus","date":"25 Juni – 31 Agustus 2026","ctaLabel":"Kirim Essay & Studi Kasus","ctaTo":"/essay"},
  {"icon":"Megaphone","title":"Pengumuman Lolos Essay","desc":"Pengumuman peserta yang lolos tahap essay & berhak lanjut ke Leadership Discussion Session","date":"5 September 2026"},
  {"icon":"Users2","title":"Tes Kesiapan Awal","desc":"Tes berbasis CBT (Computer-Based Test) untuk menyaring peserta yang akan lolos ke tahapan selanjutnya","date":"10 – 20 September 2026"},
  {"icon":"MessageSquare","title":"Interview Peserta","desc":"Sesi wawancara online","date":"Ahad, 27 September & 4 Oktober 2026"},
  {"icon":"Megaphone","title":"Pengumuman Final","desc":"Diumumkan via email & web","date":"11 Oktober 2026"},
  {"icon":"Users2","title":"Technical Meeting","desc":"Briefing keberangkatan","date":"Akhir Oktober 2026"},
  {"icon":"Rocket","title":"Keberangkatan","desc":"Perjalanan ke Tanah Suci","date":"November 2026"}
]')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_timeline_config()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT value FROM public.app_settings WHERE key = 'timeline_config' LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_timeline_config() TO anon, authenticated;