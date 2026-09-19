alter table public.staff_essay_reviews
  add column if not exists reviewer_notes text;

comment on column public.staff_essay_reviews.reviewer_notes is
  'Catatan opsional dari staff pengoreksi, maksimal 2000 karakter divalidasi oleh Edge Function.';
