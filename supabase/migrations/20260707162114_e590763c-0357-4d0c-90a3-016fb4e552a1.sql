-- ============================================================
-- FIX 1: Restore stage history yang dihapus oleh backfill 2026-07-03
-- Kriteria: status='rejected' + essay_worthy filled + essay_status='failed'
--   dengan tka_updated_at / interview_updated_at TEPAT sama dengan updated_at
--   (tanda khas backfill yang men-stamp ketiganya = now() bersamaan)
--   dan essay_updated_at LEBIH LAMA dari itu (bukan hasil essay-fail asli).
-- Untuk baris ini, keputusan asli adalah: essay=passed, tka=passed, interview=failed.
-- ============================================================
UPDATE public.participants
SET essay_status = 'passed',
    tka_status = 'passed',
    interview_status = 'failed'
WHERE status = 'rejected'
  AND essay_worthy IS NOT NULL
  AND essay_status = 'failed'
  AND tka_updated_at = updated_at
  AND interview_updated_at = updated_at
  AND (essay_updated_at IS NULL OR essay_updated_at < updated_at);

-- ============================================================
-- FIX 3: Izinkan anon & authenticated membaca SUB-SET whitelist
-- dari app_settings yang memang dipakai oleh halaman publik.
-- Kunci sensitif (mpwa_api_key, mayar_webhook_secret, ai_provider_*,
-- email_*_sender, dll.) TIDAK termasuk dan tetap admin-only.
-- ============================================================
DROP POLICY IF EXISTS "Public can read whitelisted settings" ON public.app_settings;

CREATE POLICY "Public can read whitelisted settings"
ON public.app_settings
FOR SELECT
TO anon, authenticated
USING (
  key IN (
    -- Cek Hasil Seleksi
    'hasil_seleksi_enabled','hasil_reveal_at',
    'hasil_page_title','hasil_page_subtitle',
    'hasil_text_lolos','hasil_text_tidak_lolos',
    'hasil_text_pending','hasil_text_disabled',
    -- Publikasi hasil per-tahap (dipakai cek-tahapan)
    'berkas_results_published','essay_results_published',
    -- Countdown / poster / panduan / twibbon / WA channel (landing)
    'countdown_enabled','countdown_target',
    'poster_url','panduan_url','twibbon_frame_url','wa_channel_url',
    -- Timeline / FAQ / gelombang / donasi (landing)
    'timeline_config','faq_enabled','faq_items','gelombang_config',
    'donasi_enabled','donasi_title','donasi_subtitle','donasi_amount',
    -- Apresiasi Peserta (halaman kontribusi & cek-tahapan)
    'apresiasi_kelas_link','apresiasi_kelas_tanggal',
    'apresiasi_kajian_link','apresiasi_kajian_tanggal',
    'apresiasi_sertifikat_link','apresiasi_rekaman_link',
    -- Self Funded public config
    'self_funded_enabled','self_funded_paid_enabled','self_funded_price',
    -- Self Funded doc settings (dipakai loadDocSettings di halaman sukses)
    'sf_doc_signer_name','sf_doc_signer_title','sf_doc_signature_url','sf_doc_stamp_url',
    'sf_doc_loa_body','sf_doc_payment_body','sf_doc_attendance_body','sf_doc_proposal_body',
    'sf_doc_letterhead_url','sf_doc_footer_note',
    -- Sosial media (dipakai footer)
    'social_ig_accounts','social_tiktok_accounts'
  )
);