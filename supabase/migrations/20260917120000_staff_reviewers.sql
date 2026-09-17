create table if not exists public.staff_reviewers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.staff_reviewers enable row level security;
revoke all on table public.staff_reviewers from anon, authenticated;
grant select on table public.staff_reviewers to authenticated;
grant all on table public.staff_reviewers to service_role;

drop policy if exists "Admins can read staff reviewers" on public.staff_reviewers;
create policy "Admins can read staff reviewers"
on public.staff_reviewers for select to authenticated
using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));

create index if not exists staff_reviewers_active_idx
  on public.staff_reviewers(active) where active = true;

create table if not exists public.staff_essay_reviews (
  participant_id uuid primary key references public.participants(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id),
  reviewer_name text not null,
  decision text not null check (decision in ('reviewed', 'interview', 'rejected')),
  reviewed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.staff_essay_reviews enable row level security;
revoke all on table public.staff_essay_reviews from anon, authenticated;
grant all on table public.staff_essay_reviews to service_role;
create index if not exists staff_essay_reviews_decision_idx
  on public.staff_essay_reviews(decision, updated_at desc);
