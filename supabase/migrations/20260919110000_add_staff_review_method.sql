alter table public.staff_essay_reviews
  add column if not exists review_method text not null default 'manual';

alter table public.staff_essay_reviews
  drop constraint if exists staff_essay_reviews_review_method_check;

alter table public.staff_essay_reviews
  add constraint staff_essay_reviews_review_method_check
  check (review_method in ('manual','ai'));

comment on column public.staff_essay_reviews.review_method is
  'Metode penilaian: manual oleh staff atau dibantu AI.';
