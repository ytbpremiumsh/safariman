-- Password-protected scoring for the ten Safar Iman interview candidates.
-- The public table itself stays inaccessible; all access goes through the
-- narrowly scoped RPC functions below and uses the existing stats_password.

create table if not exists public.interview_evaluations (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null unique references public.participants(id) on delete cascade,
  interviewer_name text not null check (char_length(btrim(interviewer_name)) between 2 and 100),
  interview_date date not null default current_date,
  motivation_score smallint not null check (motivation_score between 1 and 5),
  spirituality_score smallint not null check (spirituality_score between 1 and 5),
  character_score smallint not null check (character_score between 1 and 5),
  commitment_score smallint not null check (commitment_score between 1 and 5),
  contribution_score smallint not null check (contribution_score between 1 and 5),
  adaptability_score smallint not null check (adaptability_score between 1 and 5),
  aspect_notes jsonb not null default '{}'::jsonb check (jsonb_typeof(aspect_notes) = 'object'),
  general_notes text,
  decision text not null default 'Belum Diputuskan'
    check (decision in ('Belum Diputuskan', 'Fully Funded', 'Partial Funded', 'Tidak Lolos')),
  total_score numeric(5,2) generated always as (
    motivation_score::numeric / 5 * 20
    + spirituality_score::numeric / 5 * 15
    + character_score::numeric / 5 * 20
    + commitment_score::numeric / 5 * 15
    + contribution_score::numeric / 5 * 15
    + adaptability_score::numeric / 5 * 15
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.interview_evaluations enable row level security;
revoke all on table public.interview_evaluations from public, anon, authenticated;
grant all on table public.interview_evaluations to service_role;

create index if not exists interview_evaluations_total_score_idx
  on public.interview_evaluations(total_score desc, updated_at asc);

create or replace function public.get_interview_evaluations_with_password(_password text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  configured_password text;
  result jsonb;
begin
  select value into configured_password
  from public.app_settings
  where key = 'stats_password';

  if configured_password is null or btrim(configured_password) = '' then
    return jsonb_build_object('ok', false, 'error', 'not_configured');
  end if;

  if _password is null or _password <> configured_password then
    return jsonb_build_object('ok', false, 'error', 'wrong_password');
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', evaluation.id,
        'participant_id', evaluation.participant_id,
        'registration_code', participant.registration_code,
        'full_name', participant.full_name,
        'interviewer_name', evaluation.interviewer_name,
        'interview_date', evaluation.interview_date,
        'motivation_score', evaluation.motivation_score,
        'spirituality_score', evaluation.spirituality_score,
        'character_score', evaluation.character_score,
        'commitment_score', evaluation.commitment_score,
        'contribution_score', evaluation.contribution_score,
        'adaptability_score', evaluation.adaptability_score,
        'aspect_notes', evaluation.aspect_notes,
        'general_notes', evaluation.general_notes,
        'decision', evaluation.decision,
        'total_score', evaluation.total_score,
        'recommendation', case
          when evaluation.total_score >= 85 then 'Sangat Direkomendasikan'
          when evaluation.total_score >= 75 then 'Direkomendasikan'
          when evaluation.total_score >= 65 then 'Dipertimbangkan'
          else 'Belum Direkomendasikan'
        end,
        'updated_at', evaluation.updated_at
      )
      order by evaluation.total_score desc, evaluation.updated_at asc
    ),
    '[]'::jsonb
  ) into result
  from public.interview_evaluations as evaluation
  join public.participants as participant on participant.id = evaluation.participant_id;

  return jsonb_build_object('ok', true, 'evaluations', result, 'generated_at', now());
end;
$$;

create or replace function public.save_interview_evaluation_with_password(
  _password text,
  _participant_id uuid,
  _interviewer_name text,
  _interview_date date,
  _motivation_score integer,
  _spirituality_score integer,
  _character_score integer,
  _commitment_score integer,
  _contribution_score integer,
  _adaptability_score integer,
  _aspect_notes jsonb default '{}'::jsonb,
  _general_notes text default null,
  _decision text default 'Belum Diputuskan'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  configured_password text;
  saved public.interview_evaluations%rowtype;
  candidate_allowed boolean;
begin
  select value into configured_password
  from public.app_settings
  where key = 'stats_password';

  if configured_password is null or btrim(configured_password) = '' then
    return jsonb_build_object('ok', false, 'error', 'not_configured');
  end if;

  if _password is null or _password <> configured_password then
    return jsonb_build_object('ok', false, 'error', 'wrong_password');
  end if;

  if char_length(btrim(coalesce(_interviewer_name, ''))) < 2 then
    return jsonb_build_object('ok', false, 'error', 'invalid_interviewer');
  end if;

  if _interview_date is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_date');
  end if;

  if _motivation_score not between 1 and 5
    or _spirituality_score not between 1 and 5
    or _character_score not between 1 and 5
    or _commitment_score not between 1 and 5
    or _contribution_score not between 1 and 5
    or _adaptability_score not between 1 and 5 then
    return jsonb_build_object('ok', false, 'error', 'invalid_score');
  end if;

  if _aspect_notes is null or jsonb_typeof(_aspect_notes) <> 'object' then
    return jsonb_build_object('ok', false, 'error', 'invalid_notes');
  end if;

  if _decision not in ('Belum Diputuskan', 'Fully Funded', 'Partial Funded', 'Tidak Lolos') then
    return jsonb_build_object('ok', false, 'error', 'invalid_decision');
  end if;

  select exists(
    select 1
    from public.participants
    where id = _participant_id
      and registration_code = any(array[
        'HXP-D22C8CD3', 'HXP-EF20D8B0', 'HXP-F8D9FEF7', 'HXP-C633AB4E',
        'HXP-2B4820D0', 'HXP-A637F534', 'HXP-3C53A06B', 'HXP-F0E85D64',
        'HXP-AD4F867B', 'HXP-B47F06A4'
      ]::text[])
  ) into candidate_allowed;

  if not candidate_allowed then
    return jsonb_build_object('ok', false, 'error', 'participant_not_allowed');
  end if;

  insert into public.interview_evaluations (
    participant_id,
    interviewer_name,
    interview_date,
    motivation_score,
    spirituality_score,
    character_score,
    commitment_score,
    contribution_score,
    adaptability_score,
    aspect_notes,
    general_notes,
    decision,
    updated_at
  ) values (
    _participant_id,
    btrim(_interviewer_name),
    _interview_date,
    _motivation_score,
    _spirituality_score,
    _character_score,
    _commitment_score,
    _contribution_score,
    _adaptability_score,
    _aspect_notes,
    nullif(btrim(coalesce(_general_notes, '')), ''),
    _decision,
    now()
  )
  on conflict (participant_id) do update set
    interviewer_name = excluded.interviewer_name,
    interview_date = excluded.interview_date,
    motivation_score = excluded.motivation_score,
    spirituality_score = excluded.spirituality_score,
    character_score = excluded.character_score,
    commitment_score = excluded.commitment_score,
    contribution_score = excluded.contribution_score,
    adaptability_score = excluded.adaptability_score,
    aspect_notes = excluded.aspect_notes,
    general_notes = excluded.general_notes,
    decision = excluded.decision,
    updated_at = now()
  returning * into saved;

  return jsonb_build_object(
    'ok', true,
    'evaluation', jsonb_build_object(
      'id', saved.id,
      'participant_id', saved.participant_id,
      'interviewer_name', saved.interviewer_name,
      'interview_date', saved.interview_date,
      'motivation_score', saved.motivation_score,
      'spirituality_score', saved.spirituality_score,
      'character_score', saved.character_score,
      'commitment_score', saved.commitment_score,
      'contribution_score', saved.contribution_score,
      'adaptability_score', saved.adaptability_score,
      'aspect_notes', saved.aspect_notes,
      'general_notes', saved.general_notes,
      'decision', saved.decision,
      'total_score', saved.total_score,
      'recommendation', case
        when saved.total_score >= 85 then 'Sangat Direkomendasikan'
        when saved.total_score >= 75 then 'Direkomendasikan'
        when saved.total_score >= 65 then 'Dipertimbangkan'
        else 'Belum Direkomendasikan'
      end,
      'updated_at', saved.updated_at
    )
  );
end;
$$;

revoke all on function public.get_interview_evaluations_with_password(text) from public;
revoke all on function public.save_interview_evaluation_with_password(
  text, uuid, text, date, integer, integer, integer, integer, integer, integer, jsonb, text, text
) from public;

grant execute on function public.get_interview_evaluations_with_password(text)
  to anon, authenticated, service_role;
grant execute on function public.save_interview_evaluation_with_password(
  text, uuid, text, date, integer, integer, integer, integer, integer, integer, jsonb, text, text
) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
