-- Password-protected, read-only dataset for the external interview panel.
-- The password deliberately follows the existing stats_password setting.
create or replace function public.get_interview_participants_with_password(_password text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  configured_password text;
  result jsonb;
  interview_codes constant text[] := array[
    'HXP-D22C8CD3',
    'HXP-EF20D8B0',
    'HXP-F8D9FEF7',
    'HXP-C633AB4E',
    'HXP-2B4820D0',
    'HXP-A637F534',
    'HXP-3C53A06B',
    'HXP-F0E85D64',
    'HXP-AD4F867B',
    'HXP-B47F06A4'
  ];
begin
  select value
    into configured_password
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
        'id', p.id,
        'registration_code', p.registration_code,
        'full_name', p.full_name,
        'email', p.email,
        'whatsapp', p.whatsapp,
        'gender', p.gender,
        'birth_date', p.birth_date,
        'city', p.city,
        'education', p.education,
        'occupation', p.occupation,
        'religion', p.religion,
        'social_media', p.social_media,
        'has_passport', p.has_passport,
        'reason', p.reason,
        'achievements', p.achievements,
        'organization_experience', p.organization_experience,
        'category', p.category,
        'photo_url', p.photo_url,
        'cv_url', p.cv_url,
        'essay_worthy', p.essay_worthy,
        'essay_dream', p.essay_dream,
        'essay_contribution', p.essay_contribution,
        'case_study_1', p.case_study_1,
        'case_study_2', p.case_study_2,
        'case_study_3', p.case_study_3,
        'case_study_4', p.case_study_4,
        'case_study_5', p.case_study_5,
        'case_study_6', p.case_study_6,
        'case_study_7', p.case_study_7,
        'essay_submitted_at', p.essay_submitted_at,
        'essay_updated_at', p.essay_updated_at,
        'created_at', p.created_at
      )
      order by array_position(interview_codes, p.registration_code)
    ),
    '[]'::jsonb
  )
  into result
  from public.participants as p
  where p.registration_code = any(interview_codes);

  return jsonb_build_object(
    'ok', true,
    'participants', result,
    'generated_at', now()
  );
end;
$$;

revoke all on function public.get_interview_participants_with_password(text) from public;
grant execute on function public.get_interview_participants_with_password(text)
  to anon, authenticated, service_role;
