alter table public.staff_essay_reviews
  add column if not exists criteria_checks jsonb;

comment on column public.staff_essay_reviews.criteria_checks is
  'Indeks kriteria yang dicentang per soal agar riwayat penilaian dapat dibuka dan diedit kembali.';
