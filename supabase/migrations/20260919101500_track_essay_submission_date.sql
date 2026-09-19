alter table public.participants
  add column if not exists essay_submitted_at timestamptz;

update public.participants
set essay_submitted_at = updated_at
where essay_submitted_at is null
  and nullif(btrim(essay_worthy), '') is not null
  and nullif(btrim(essay_dream), '') is not null
  and nullif(btrim(essay_contribution), '') is not null
  and nullif(btrim(case_study_1), '') is not null
  and nullif(btrim(case_study_2), '') is not null;

create or replace function public.submit_essay_by_code(
  p_code text, p_essay_worthy text, p_essay_dream text, p_essay_contribution text
) returns boolean
language plpgsql security definer set search_path to 'public'
as $function$
declare v_count int;
begin
  update public.participants
  set essay_worthy=p_essay_worthy, essay_dream=p_essay_dream,
      essay_contribution=p_essay_contribution,
      essay_submitted_at=coalesce(essay_submitted_at, now()), updated_at=now()
  where upper(registration_code)=upper(p_code) and donation_status='paid';
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$function$;

create or replace function public.submit_essay_by_code(
  p_code text, p_essay_worthy text, p_essay_dream text, p_essay_contribution text,
  p_case_study_1 text default null, p_case_study_2 text default null,
  p_case_study_3 text default null, p_case_study_4 text default null,
  p_case_study_5 text default null, p_case_study_6 text default null,
  p_case_study_7 text default null
) returns boolean
language plpgsql security definer set search_path to 'public'
as $function$
declare v_count int;
begin
  update public.participants
  set essay_worthy=p_essay_worthy, essay_dream=p_essay_dream,
      essay_contribution=p_essay_contribution,
      case_study_1=coalesce(p_case_study_1,case_study_1),
      case_study_2=coalesce(p_case_study_2,case_study_2),
      case_study_3=coalesce(p_case_study_3,case_study_3),
      case_study_4=coalesce(p_case_study_4,case_study_4),
      case_study_5=coalesce(p_case_study_5,case_study_5),
      case_study_6=coalesce(p_case_study_6,case_study_6),
      case_study_7=coalesce(p_case_study_7,case_study_7),
      essay_submitted_at=coalesce(essay_submitted_at,now()), updated_at=now()
  where upper(registration_code)=upper(p_code) and donation_status='paid';
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$function$;

create or replace function public.list_essay_complete_participants()
returns table(id uuid, registration_code text, full_name text, email text, whatsapp text, gender text, birth_date date, city text, education text, occupation text, social_media text, reason text, achievements text, organization_experience text, category program_category, status participant_status, essay_worthy text, essay_dream text, essay_contribution text, case_study_1 text, case_study_2 text, case_study_3 text, case_study_4 text, case_study_5 text, case_study_6 text, case_study_7 text, cv_url text, photo_url text, twibbon_confirmed_at timestamptz, payment_status text, paid_at timestamptz, donation_status text, donation_paid_at timestamptz, essay_ai_score integer, essay_ai_percent integer, essay_ai_verdict text, essay_ai_summary text, essay_ai_graded_at timestamptz, created_at timestamptz, updated_at timestamptz, reviewer_name text, reviewed_at timestamptz, review_decision text)
language sql stable set search_path to 'public'
as $function$
  select p.id,p.registration_code,p.full_name,p.email,p.whatsapp,p.gender,
    p.birth_date,p.city,p.education,p.occupation,p.social_media,p.reason,
    p.achievements,p.organization_experience,p.category,p.status,
    p.essay_worthy,p.essay_dream,p.essay_contribution,
    p.case_study_1,p.case_study_2,p.case_study_3,p.case_study_4,
    p.case_study_5,p.case_study_6,p.case_study_7,
    p.cv_url,p.photo_url,p.twibbon_confirmed_at,
    p.payment_status,p.paid_at,p.donation_status,p.donation_paid_at,
    p.essay_ai_score,p.essay_ai_percent,p.essay_ai_verdict,
    p.essay_ai_summary,p.essay_ai_graded_at,p.created_at,
    coalesce(p.essay_submitted_at,p.updated_at) as updated_at,
    sr.reviewer_name,sr.reviewed_at,sr.decision::text
  from public.participants p
  left join public.staff_essay_reviews sr on sr.participant_id=p.id
  where nullif(btrim(p.essay_worthy),'') is not null
    and nullif(btrim(p.essay_dream),'') is not null
    and nullif(btrim(p.essay_contribution),'') is not null
    and nullif(btrim(p.case_study_1),'') is not null
    and nullif(btrim(p.case_study_2),'') is not null
    and (p.category is null or p.category in ('fully_funded','partial_funded','gelombang_1','gelombang_2'))
  order by coalesce(p.essay_submitted_at,p.updated_at) desc;
$function$;

comment on column public.participants.essay_submitted_at is
  'Waktu pengiriman pertama Essay dan Studi Kasus; tidak berubah saat hasil koreksi diperbarui.';
