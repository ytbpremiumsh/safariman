-- Allow incomplete interview drafts and save one score at a time.
alter table public.interview_evaluations
  alter column interviewer_name drop not null,
  alter column motivation_score drop not null,
  alter column spirituality_score drop not null,
  alter column character_score drop not null,
  alter column commitment_score drop not null,
  alter column contribution_score drop not null,
  alter column adaptability_score drop not null;

create or replace function public.autosave_interview_score_with_password(
  _password text,
  _participant_id uuid,
  _score_key text,
  _score integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  configured_password text;
  candidate_allowed boolean;
  saved public.interview_evaluations%rowtype;
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

  if _score_key not in (
    'motivation_score', 'spirituality_score', 'character_score',
    'commitment_score', 'contribution_score', 'adaptability_score'
  ) then
    return jsonb_build_object('ok', false, 'error', 'invalid_score_key');
  end if;

  if _score is not null and _score not between 1 and 5 then
    return jsonb_build_object('ok', false, 'error', 'invalid_score');
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

  insert into public.interview_evaluations (participant_id)
  values (_participant_id)
  on conflict (participant_id) do nothing;

  update public.interview_evaluations
  set
    motivation_score = case when _score_key = 'motivation_score' then _score else motivation_score end,
    spirituality_score = case when _score_key = 'spirituality_score' then _score else spirituality_score end,
    character_score = case when _score_key = 'character_score' then _score else character_score end,
    commitment_score = case when _score_key = 'commitment_score' then _score else commitment_score end,
    contribution_score = case when _score_key = 'contribution_score' then _score else contribution_score end,
    adaptability_score = case when _score_key = 'adaptability_score' then _score else adaptability_score end,
    updated_at = now()
  where participant_id = _participant_id
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
      'is_complete', saved.motivation_score is not null
        and saved.spirituality_score is not null
        and saved.character_score is not null
        and saved.commitment_score is not null
        and saved.contribution_score is not null
        and saved.adaptability_score is not null,
      'recommendation', case
        when saved.total_score >= 85 then 'Sangat Direkomendasikan'
        when saved.total_score >= 75 then 'Direkomendasikan'
        when saved.total_score >= 65 then 'Dipertimbangkan'
        when saved.total_score is not null then 'Belum Direkomendasikan'
        else 'Draft Belum Lengkap'
      end,
      'updated_at', saved.updated_at
    )
  );
end;
$$;

revoke all on function public.autosave_interview_score_with_password(text, uuid, text, integer) from public;
grant execute on function public.autosave_interview_score_with_password(text, uuid, text, integer)
  to anon, authenticated, service_role;

notify pgrst, 'reload schema';
