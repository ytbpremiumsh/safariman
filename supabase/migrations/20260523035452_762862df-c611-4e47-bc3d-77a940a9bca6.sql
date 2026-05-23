
CREATE OR REPLACE FUNCTION public.register_participant(
  p_full_name text,
  p_email text,
  p_whatsapp text,
  p_gender text,
  p_birth_date date,
  p_city text,
  p_education text,
  p_occupation text,
  p_category program_category DEFAULT 'fully_funded'
)
RETURNS TABLE(id uuid, registration_code text, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.participants (full_name, email, whatsapp, gender, birth_date, city, education, occupation, category)
  VALUES (p_full_name, p_email, p_whatsapp, p_gender, p_birth_date, p_city, p_education, p_occupation, p_category)
  RETURNING participants.id, participants.registration_code, participants.full_name;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_berkas_by_code(
  p_code text,
  p_cv_url text,
  p_photo_url text,
  p_essay_worthy text,
  p_essay_dream text,
  p_essay_contribution text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count int;
BEGIN
  UPDATE public.participants
  SET cv_url = p_cv_url, photo_url = p_photo_url,
      essay_worthy = p_essay_worthy, essay_dream = p_essay_dream, essay_contribution = p_essay_contribution,
      updated_at = now()
  WHERE upper(registration_code) = upper(p_code);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

INSERT INTO public.app_settings (key, value) VALUES
  ('wa_template_pendaftaran', 'Assalamu''alaikum {nama},\n\nTerima kasih sudah mendaftar program *SAFAR IMAN* ✨\nKode Pendaftaran: *{kode}*\n\nSimpan kode ini & lanjutkan ke pengiriman berkas + essay di website kami.\n\nBarakallahu fiik 🤲'),
  ('wa_template_lolos', 'Assalamu''alaikum {nama} 🎉\n\nSelamat! Kamu *LOLOS* seleksi program SAFAR IMAN kategori *{kategori}*.\nTunggu info teknis selanjutnya dari panitia.\n\nBarakallahu fiik 🤲'),
  ('wa_template_ditolak', 'Assalamu''alaikum {nama},\n\nTerima kasih atas partisipasimu di program SAFAR IMAN. Mohon maaf, pada kesempatan ini kamu belum lolos seleksi.\nTetap semangat — pintu kebaikan masih banyak insya Allah.\n\nBarakallahu fiik 🤲'),
  ('wa_template_custom', 'Assalamu''alaikum {nama}, ...')
ON CONFLICT (key) DO NOTHING;
