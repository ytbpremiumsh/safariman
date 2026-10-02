-- Permanently remove one interview evaluation through the password-protected panel.
create or replace function public.delete_interview_evaluation_with_password(
  _password text,
  _participant_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  configured_password text;
  deleted_id uuid;
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

  delete from public.interview_evaluations as evaluation
  using public.participants as participant
  where evaluation.participant_id = _participant_id
    and participant.id = evaluation.participant_id
    and participant.registration_code = any(array[
      'HXP-D22C8CD3', 'HXP-EF20D8B0', 'HXP-F8D9FEF7', 'HXP-C633AB4E',
      'HXP-2B4820D0', 'HXP-A637F534', 'HXP-3C53A06B', 'HXP-F0E85D64',
      'HXP-AD4F867B', 'HXP-B47F06A4'
    ]::text[])
  returning evaluation.id into deleted_id;

  if deleted_id is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  return jsonb_build_object('ok', true, 'deleted_id', deleted_id);
end;
$$;

revoke all on function public.delete_interview_evaluation_with_password(text, uuid) from public;
grant execute on function public.delete_interview_evaluation_with_password(text, uuid)
  to anon, authenticated, service_role;

notify pgrst, 'reload schema';
