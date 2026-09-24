create or replace function public.list_contributed_pending_essay_participants()
returns table(
  id uuid,
  registration_code text,
  full_name text,
  email text,
  whatsapp text,
  city text,
  education text,
  category public.program_category,
  has_essay_worthy boolean,
  has_essay_dream boolean,
  has_essay_contribution boolean,
  has_case_study_1 boolean,
  has_case_study_2 boolean,
  has_case_study_3 boolean,
  has_case_study_4 boolean,
  has_case_study_5 boolean,
  has_case_study_6 boolean,
  has_case_study_7 boolean,
  donation_status text,
  donation_paid_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.registration_code,
    p.full_name,
    p.email,
    p.whatsapp,
    p.city,
    p.education,
    p.category,
    nullif(btrim(p.essay_worthy), '') is not null,
    nullif(btrim(p.essay_dream), '') is not null,
    nullif(btrim(p.essay_contribution), '') is not null,
    nullif(btrim(p.case_study_1), '') is not null,
    nullif(btrim(p.case_study_2), '') is not null,
    nullif(btrim(p.case_study_3), '') is not null,
    nullif(btrim(p.case_study_4), '') is not null,
    nullif(btrim(p.case_study_5), '') is not null,
    nullif(btrim(p.case_study_6), '') is not null,
    nullif(btrim(p.case_study_7), '') is not null,
    p.donation_status,
    p.donation_paid_at,
    p.updated_at
  from public.participants p
  where public.has_role(auth.uid(), 'admin'::public.app_role)
    and p.donation_status = 'paid'
    and (p.category is null or p.category in ('fully_funded', 'partial_funded', 'gelombang_1', 'gelombang_2'))
    and (
      nullif(btrim(p.essay_worthy), '') is null
      or nullif(btrim(p.essay_dream), '') is null
      or nullif(btrim(p.essay_contribution), '') is null
      or nullif(btrim(p.case_study_1), '') is null
      or nullif(btrim(p.case_study_2), '') is null
      or nullif(btrim(p.case_study_3), '') is null
      or nullif(btrim(p.case_study_4), '') is null
      or nullif(btrim(p.case_study_5), '') is null
      or nullif(btrim(p.case_study_6), '') is null
      or nullif(btrim(p.case_study_7), '') is null
    )
  order by p.donation_paid_at desc nulls last, p.updated_at desc, p.id;
$$;

revoke all on function public.list_contributed_pending_essay_participants() from public, anon;
grant execute on function public.list_contributed_pending_essay_participants() to authenticated, service_role;
