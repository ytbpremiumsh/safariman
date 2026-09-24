insert into public.app_settings (key, value, updated_at)
values
  ('apresiasi_heading', 'Apresiasi & Benefit untuk Peserta', now()),
  ('apresiasi_description', 'Tidak ada proses yang sia-sia. Walaupun belum lolos ke tahap berikutnya, Anda tetap mendapatkan kelas online, kajian, akses rekaman, dan E-Sertifikat sebagai bentuk apresiasi atas usaha yang telah diberikan.', now()),
  ('apresiasi_kelas_title', 'Sekolah Tamu Allah: Bedah Persiapan Umrohmu, Kembali dengan Mabrur', now()),
  ('apresiasi_kelas_speaker', 'Ustadz Ahmad Fauzan, Lc.', now()),
  ('apresiasi_kelas_speaker_desc', 'Pembimbing Manasik & Praktisi Umrah', now()),
  ('apresiasi_kajian_title', 'Mengenal Sirah Haramain: Bekal Sebelum ke Baitullah', now()),
  ('apresiasi_kajian_speaker', 'Ustadz Hilman Al Hazmi, Lc.', now()),
  ('apresiasi_kajian_speaker_desc', 'Alumni Syariah Islamiyyah Al Azhar University', now()),
  ('apresiasi_sertifikat_title', 'E-Sertifikat Resmi', now()),
  ('apresiasi_sertifikat_desc', 'Sertifikat digital setelah menyelesaikan kelas', now()),
  ('apresiasi_rekaman_title', 'Akses Rekaman', now()),
  ('apresiasi_rekaman_desc', 'Tonton ulang kapan saja.', now())
on conflict (key) do nothing;

drop policy if exists "Public can read whitelisted settings" on public.app_settings;
create policy "Public can read whitelisted settings"
on public.app_settings
for select
to anon, authenticated
using (
  key in (
    'hasil_seleksi_enabled','hasil_reveal_at','hasil_page_title','hasil_page_subtitle',
    'hasil_text_lolos','hasil_text_tidak_lolos','hasil_text_pending','hasil_text_disabled',
    'berkas_results_published','essay_results_published','countdown_enabled','countdown_target',
    'poster_url','panduan_url','twibbon_frame_url','wa_channel_url','timeline_config',
    'faq_enabled','faq_items','gelombang_config','donasi_enabled','donasi_title',
    'donasi_subtitle','donasi_amount','apresiasi_kelas_link','apresiasi_kelas_tanggal',
    'apresiasi_kajian_link','apresiasi_kajian_tanggal','apresiasi_sertifikat_link',
    'apresiasi_rekaman_link','apresiasi_heading','apresiasi_description',
    'apresiasi_kelas_title','apresiasi_kelas_speaker','apresiasi_kelas_speaker_desc',
    'apresiasi_kajian_title','apresiasi_kajian_speaker','apresiasi_kajian_speaker_desc',
    'apresiasi_sertifikat_title','apresiasi_sertifikat_desc',
    'apresiasi_rekaman_title','apresiasi_rekaman_desc',
    'self_funded_enabled','self_funded_paid_enabled','self_funded_price',
    'sf_doc_signer_name','sf_doc_signer_title','sf_doc_signature_url','sf_doc_stamp_url',
    'sf_doc_loa_body','sf_doc_payment_body','sf_doc_attendance_body','sf_doc_proposal_body',
    'sf_doc_letterhead_url','sf_doc_footer_note','social_ig_accounts','social_tiktok_accounts',
    'ga_measurement_id'
  )
);
